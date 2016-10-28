var express = require('express');
var mongoose = require('mongoose');
var mysql = require('mysql');
var uuid = require('node-uuid');
var Promise = require('bluebird');
var crypto = require('crypto');
var mfSql = require('../mysql/mysql');
var encrypt = require('../utils/encrypt');
var settings = require('../../settings');

var extend = require('util')._extend;
var User = require('../../models/user/user');
var ShortUrls = require('../../models/user/shortUrls');
var Actions = require('../../models/user/action');
var Clipboard = require('../../models/user/clipboard');
var gContact = require('../../models/google/gContact');
var RedisSessions = require("redis-sessions");
var phone = require('phone');
var mandrill = require('node-mandrill')(settings.mandrill.apiKey);
//
// Parameters for RedisSession:
// e.g. rs = new RedisSession({host:"192.168.0.20"});
//
// `port`: *optional* Default: 6379. The Redis port.
// `host`, *optional* Default: "127.0.0.1". The Redis host.
// `options`, *optional* Default: {}. Additional options. See: https://github.com/mranney/node_redis#rediscreateclientport-host-options
// `namespace`: *optional* Default: "rs". The namespace prefix for all Redis keys used by this module.
// `wipe`: *optional* Default: 600. The interval in second after which the timed out sessions are wiped. No value less than 10 allowed.
// `client`: *optional* An external RedisClient object which will be used for the connection.
//
rs = new RedisSessions({host: settings.redis.host});

// Get All Users
exports.getAll = function(){
  return new Promise(function(resolve, reject){
    User.find(function(err, res){
      if(err){ reject(res);}
      else{ resolve(res); }
    });
  });
}

// Get User By ID
exports.getByID = function(id){
  return new Promise(function(resolve, reject){
    if(isNaN(id)){
      User.find({_id: id},function(err, res){
        if(err){ reject(err); }
        else{ resolve(res); }
      })
    }
    else{
      User.find({ID: parseInt(id)},function(err, res){
        if(err){ reject(err); }
        else{ resolve(res); }
      })
    }
  });
}
// Update User
exports.update = function(dbData, newData){
  return new Promise(function(resolve, reject){
      User.update(dbData, function(err, res){
        if(err){ reject(res);}
        else{ resolve(res); }
      });
  });
}

// Create User
exports.create = function(data){
  var returned = {};
  return new Promise(function(resolve, reject){
    // if we are logging in user
    var login = false;
    var session = null;

    if(typeof(data.session) != 'undefined'){
      session = data.session;
    }
    if(typeof(data.login) != 'undefined'){
      login = data.login;
    }
    // Promise with properties
    Promise.props({
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        domain: data.username.replace(/.*@/, ""),
        department: data.department,
        apiToken: uuid.v4(),
        password: encrypt.appHash(data.password, ''),
        exists: exports.getByEmail(data.username),
        authorizedDomain: settings.authorizedDomains.indexOf(data.username.replace(/.*@/, ""))
    })
    // After initial promise returned
    .then(function(result) {
      error = false;
      if(result.domain === ''){
        error = true;
        response = {message: 'Domain Not Found', error:'domainNotFound'}
        resolve(response);
      }
      // If User Exists
      if(result.exists.length > 0){
        error = true;
        response = {message: 'Username already exists', error:'userExists'}
        resolve(response);
      }
      // If Authorized Domain
      if(result.authorizedDomain >= 0){ result.authorizedDomain = true;  }
      // If not Authorized Domain, return message
      else{
        error = true;
        response = {message: 'Email address not from Authorized domain', error:'unathorizeDomain'}
        resolve(response);
      }
      // if User Name isnt supplied
      if(typeof result.firstName === 'undefined' || !result.firstName.length || typeof result.lastName === 'undefined'
      || !result.lastName.length){
        error = true;
        response = {message: 'First and Last name are required', error:'NameError'};
        resolve(response);
      }
      // If department or job Role isnt defined
      if(typeof result.department === 'undefined'){
        error = true;
        response = {message: 'Department & Job Role is required', error:'invalidDepartment'};
        resolve(response);
      }
      else if(result.department === 'Web Content Developer'){
        result.role = 'Developer'
      }
      else if(result.deparment === 'Customer Service'){
          result.role = 'Customer Service'
      }
      else if (result.department === 'Sales Representative'){
        result.role = 'Sales'
      }
      // If no errors, save user
      if(error){
        resolve(response);
      }

        // Create User Struct to Send to Mongo
        var userStruct = {
          email: result.username,
          domain: result.domain,
          name: {
            first: result.firstName,
            last: result.lastName,
            full: result.firstName + ' ' + result.lastName
          },
          role: {
            department: result.department,
            title: result.role,
            permissionLevel: 1
          },
          verified: false,
          salt: result.password.salt,
          password: result.password.string,
          apiTokens: {
            internal: result.apiToken
          }
        };
        // Send to Mongo
        var user = new User(userStruct);
        user.save(function(err, res){
            if(err){ reject(res);}
            else{
              resolve( {
                'user': res.email,
                'data': res,
                'status': 'success',
                'login': login,
                'session': session
              });
            }
        });
    })
    // On Error
    .catch(function(err){
      resolve(err);
    })
  });
}


// validate login request
exports.validateLogin = function(request, type){
  return new Promise(function(resolve, reject){
    var returned = {
      'authType': type
    };
    Promise.props({
        lookup: exports.getByEmail(request.username),
        request: request
    // After initial Lookup
    }).then(function(result) {
      result.passwordMatch = false;
      result.authenticated = false;
      result.loggedIn = false;
      returned.lookup = result.lookup;
      // If no results found for user, return not authenticated
      if(!result.lookup.length){
        response: { message: 'Invalid Username/Password'};
        resolve(response);
      }
      // If user results are found, compare passwords
      else{
        // App Hash submited Password with Users Salt
        result.submitedPassword = encrypt.appHash(result.request.password, result.lookup[0].salt);
        if(result.submitedPassword.string === result.lookup[0].password){
          result.passwordMatch = true;
        }
        return result;
      }
    })
    // Once we have determined if we are authenticated
    .then(function(result){
      // If passwords match, Authenticate User
      if(result.passwordMatch){
        user = extend({}, result.lookup[0]);
        user['_doc'].loggedIn = true;
        // Remove password and Salt
        delete user['_doc'].password;
        delete user['_doc'].salt;
        // Return Logged in Users Info
        resolve(user['_doc']);
      }
      // If passwords dont match, return error
      else{
        response: { message: 'Invalid Username/Password'};
        resolve(response);
      }
    })
    // On Error
    .catch(function(err){
      resolve(err);
    })
  });
};

// Send Verification Email
exports.sendVerificationEmail = function(user){

}

exports.getContacts = function(email){
  return new Promise(function(resolve, reject){
    gContact.find({owner: email},function(err, res){
      if(err){ reject(err); }
      else{  resolve(res); }
    });
  });
}

// Is Authorized Domain
exports.isAuthorizedDomain = function(email){
  return new Promise(function(resolve, reject){
    if(email.indexOf("@") < 0){ resolve(false); }
    var domain = email.replace(/.*@/, "");
    var domainList = appSettings().authorizedDomains;
    if(!domainList.indexOf(domain)){
      resolve(false);
    }
  });
}

// Find by Email
exports.getByEmail = function(email){
  return new Promise(function(resolve, reject){
    User.find({email: email},function(err, res){
      if(err){ reject(err); }
      else{  resolve(res); }
    });
  });
};


// Get User Actions
exports.getActions = function(user){
  return new Promise(function(resolve, reject){
    User.find({email: email},function(err, res){
      if(err){ reject(err); }
      else{  resolve(res); }
    });
  });
}
// Save Action
exports.saveAction = function(user, action){

}
// Get Recently Viewed
exports.getRecentlyViewed = function(user){

}
// Save Recently Viewed
exports.logViewedPage = function(user, page){

}
// Get Notifications
exports.getNotifications = function(user){

}

// Get Clipboard
exports.getClipboard = function(user){

}

exports.getCloudPrinters = function(user){
  return new Promise(function(resolve, reject) {


  });
}

exports.storeApiKey = function(token, service, packet){
  return new Promise(function(resolve, reject) {
    var returned = {
      token: token,
      service: service,
      packet: packet,
      result: {
        created: false
      }
    }
    // Get Current Session
    exports.getSession(token)
    .then(function(result){
      if(result === null || !result.d.authenticated){
        reject({message: 'User not Authenticated'})
      }
      else{
        var user = {
          id: result.d.id,
          email: result.d.user
        }
        return returned.user = user;
      }
    })
    // If we have current User
    .then(function(result){
      resolve(returned);
    })
    .catch(function(err){
      reject(err);
    })
  });
}

// Update Session Variables
exports.updateSession = function(token, data){
  return new Promise(function(resolve, reject) {
    rs.set({
      app: settings.name,
      token: token,
      d: data},
      function(err, resp) {
        if(err){
          reject(err);
        }
        else{
          resolve(resp.d);
        }
      });
  });
};

// Get Session
exports.getSession = function(token){
  return new Promise(function(resolve, reject) {
    rs.get({
      app: settings.name,
      token: token
      },
      function(err, resp) {
        if(err){
          reject(err);
        }
        else{
          resolve(resp);
        }
      });
  });
}

// Create Sesssion
exports.createSession = function(user, data){
  return new Promise(function(resolve, reject) {
    data.ip = user.ip;
    rs.create({
      app: settings.name,
      id: user.id,
      ip: user.ip,
      ttl: settings.sessions.activeDuration,
      d: data
    },
    function(err, resp) {
      // resp should be something like
      // {token: "r30kKwv3sA6ExrJ9OmLSm4Wo3nt9MQA1yG94wn6ByFbNrVWhcwAyOM7Zhfxqh8fe"}
      resolve(resp);
    });
  });
}

// Send Reset Password Email
exports.sendResetPasswordEmail = function(user, token){
  return new Promise(function(resolve, reject) {
    //send an e-mail to jim rubenstein
    mandrill('/messages/send', {
        message: {
            to: [{email: user.email, name: user.firstName}],
            from_email: 'admin@materialflow.com',
            subject: "CMS Password Reset Request",
            text: "Click <a href='google.com'>Here</a>"
        }
    }, function(error, response) {
        if(error){reject(error) }
        else { resolve(response) };
    });
  });
}
// Send Approve Account Email
exports.sendApproveAccountEmail = function(user, token){
  return new Promise(function(resolve, reject) {
    //send an e-mail to jim rubenstein
    mandrill('/messages/send', {
        message: {
            to: [{email: user.email, name: user.firstName}],
            from_email: 'admin@materialflow.com',
            subject: "CMS Account Creation",
            text: "A user account with your email address was recently created. If this was not you, Click <a href='google.com'>Here</a>"
        }
      }, function(error, response) {
          if(error){reject(error) }
          else { resolve(response) };
      });
  });
}
// Send Login Alert from New IP
exports.sendApproveAccountEmail = function(user, token){
  return new Promise(function(resolve, reject) {
    //send an e-mail to jim rubenstein
    mandrill('/messages/send', {
        message: {
            to: [{email: user.email, name: user.firstName}],
            from_email: 'admin@materialflow.com',
            subject: "CMS Account Accessed from Unrecognized IP",
            text: "A logon request with your credentials was sent from a Unrecognized IP Address. If this was you, click <a href='google.com'>here</a> to allow access for this IP"
        }
      }, function(error, response) {
          if(error){reject(error) }
          else { resolve(response) };
      });
  });
}
module.exports = exports;
