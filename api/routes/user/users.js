var express = require('express');
var users = require('../../modules/user/users');
var encrypt = require('../../modules/utils/encrypt');
var router = express.Router();
var Promise = require('bluebird');
var sessions = require('client-sessions');
var uuid = require('node-uuid');
var cookieParser = require('cookie-parser');

module.exports = function(app){
/**
 * @api {get} users Get Instance Users
 * @apiName getAll
 * @apiGroup User
 *
 *
 * @apiSuccess {Object} UserData User Data Object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *       username: '',
 *       role: '',
 *       contribution: ''
 *   }
 */
app.get('/api/users/:instanceId', function(req, res) {
  users.getAll(req.params.instanceId)
  .then(function(users){
    res.json(users);
  })
  .catch(function(err){
    res.send(err);
  });
});

/**
 * @api {post} users/login Submit User Login
 * @apiName login
 * @apiGroup User
 *
 *
 * @apiSuccess {Object} UserData User Data Object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *      "user": {
 *        "_id": "561db8bd3bd8b1d00b810849",
 *        "email": "example@materialflow.com",
 *        "domain": "materialflow.com",
 *        "verified": true,
 *        "plusProfile": {
 *          "coverPhoto": {}
 *          "placesLived": [],
 *          "organizations": [],
 *          "image": {},
 *          "name": {},
 *          "emails": [],
 *        }
 *        "apiTokens": {},
 *        "role": {},
 *        "name": {}
 *      },
 *      "session": {
 *        "domain": '',
 *        "category": '',
 *        "subCategory": '',
 *        "clipboard": [],
 *        "lists": []
 *      }
 *  }
 */
app.post('/api/users/login', function(req, res) {
  // Validate Submission
  var token = req.cookies.session;
  var sessionChanges = {};
  var returned = {
    authenticated: false
  };
  users.validateLogin(req.body, 'password')
  // Update Session
  .then(function(response){
    returned = response;
    if(response.loggedIn){
      returned.authenticated = true;
      sessionChanges = {
        user: response.email,
        id: response._id.toString(),
        verified: response.verified,
        browseMethod: 'default',
        authenticated: true,
        domain: 'materialflow.com',
        category: '',
        subCategory: '',
        department: response.role.department,
        title: response.role.title,
        firstName: response.name.first,
        lastName: response.name.last
      };
    }
    return sessionChanges;
  })
  // Update
  .then(function(response){
    //console.log(sessionChanges, token);
    if(returned.authenticated){
      users.updateSession(token, sessionChanges)
      .then(function(result){
        return true;
      })
    }
    else{
      return response;
    }
  })
  .then(function(response){
    res.json(returned);
  })
  .catch(function(err){
    res.send(err);
  });
});

/**
 * @api {post} users/session Update Session
 * @apiName updateSession
 * @apiGroup User
 *
 *
 * @apiSuccess {Boolean}  Sucess true.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *    success: true
 *  }
 */
app.post('/api/users/session', function(req, res) {
  users.updateSession(req.body)
  .then(function(response){
    res.send(response);
  })
  .catch(function(err){
    res.send(err);
  });
});

/**
 * @api {post} users/session Update Session
 * @apiName updateSession
 * @apiGroup User
 *
 *
 * @apiSuccess {Boolean}  Sucess true.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *    success: true
 *  }
 */
app.get('/api/users/storeApiKey', function(req, res) {
  var token = req.cookies.session;
  var packet = {
    type: 'oauth',
    key: 'clientID',
    secret: 'clientSecret'
  }
  users.storeApiKey(token, 'github', packet)
  .then(function(response){
    res.send(response);
  })
  .catch(function(err){
    res.send(err);
  });
});


/**
 * @api {post} users Create User
 * @apiName createUser
 * @apiGroup User
 *
 *
 * @apiSuccess {Object} User Created User Data.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *    user: {
 *
 *    }
 *
 *  }
 * @apiError domainNotFound Domain Name not found in Username
 * @apiError userExists Domain Name not found in Username
 * @apiError unauthorizedDomain Domain Name not found in Username
 * @apiError nameError Invalid or Non Existant Name
 * @apiError invalidDepartment Invalid Department
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "domainNotFound",
 *       "message": "Domain Not Found"
 *     }
 */
app.post('/api/users', function(req, res) {
  // Validate Submission
  var token = req.cookies.session;
  var sessionChanges = {};
  var returned = {
    authenticated: false
  };
  users.create(req.body)
  .then(function(result){
    var user = result.data;
    if(!result.login){
      return user;
    };
    sessionChanges = {
        user: user.email,
        id: user._id.toString(),
        verified: user.verified,
        browseMethod: 'default',
        authenticated: true,
        domain: null,
        category: null,
        subCategory: null,
        department: user.role.department,
        title: user.role.title,
        firstName: user.name.first,
        lastName: user.name.last
      };
      console.log('ss',sessionChanges, token);
      return users.updateSession(token, sessionChanges)
      .then(function(result){
        return sessionChanges;
      })
  })
  .then(function(user){
    res.json(user);
  })
  .catch(function(err){
    res.send(err);
  });
});

/**
 * @api {post} user Get Logged in User
 * @apiName getLoggedInUser
 * @apiGroup User
 *
 *
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *      "user": {
 *          name: {},
 *          plusProfile: {},
 *          role: {},
 *          loggedIn: true,
 *          apiTokens: {},
 *          email: '',
 *          lists: [],
 *          clipboard: []
 *       },
 *     domain: 1,
 *     category: '',
 *     subCategory: ''
 *  }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 Not Found
 *     {
 *       "user": {
 *          loggedIn: false
 *       }
 *     }
 */
app.get('/api/user', function(req, res) {
  // if session exists
  if('user' in req.session){
      res.json(req.session);
  }
  // If session doesnt exist
  else{
    // fetch default session from config
    result = {
      user: {
       loggedIn: false
      }
    }
    res.json(result);
  }
});


/**
 * @api {post} user/:id Get User by ID
 * @apiName getUserByID
 * @apiGroup User
 *
 *
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *   [
 *      "user": {
 *          name: {},
 *          plusProfile: {},
 *          role: {},
 *          loggedIn: true,
 *          apiTokens: {},
 *          email: '',
 *          lists: [],
 *          clipboard: []
 *       }
 *  ]
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 Not Found
 *     {
 *       "user": {
 *          loggedIn: false
 *       }
 *     }
 */
app.get('/api/users/:id', function(req, res) {
  users.getByID(req.params.id)
  .then(function(quote){
    res.json(quote);
  })
  .catch(function(err){
    res.send(err);
  })
});


/**
 * @api {get} session Get Current Users Session Token
 * @apiName getSessionToken
 * @apiGroup User
 *
 *
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *   {
 *      "token": ""
 *  }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 200 Not Found
 *     {
 *       "error": "Session Not Found"
 *     }
 */
app.get('/api/session', function(req, res) {
  //console.log(req);
  var defaultSession = {
    id: uuid.v4(),
    loggedIn:false
  };
  var user = {
    id: defaultSession.id,
    ip: req.connection.remoteAddress
  };
  var returned = {
    authenticated: false
  };
  var token = req.cookies.session;
  //console.log(token, 'cookie');
  // If we dont have session, create it
  if(typeof(token) === 'undefined'){
    users.createSession(user, defaultSession)
    .then(function(result){
      //console.log(result.token, 'token');
      // Set cookie
      returned.token = result.token;
      returned.session = defaultSession;
      return result;
    })
    .then(function(result){
      res.json(returned);
    })
    .catch(function(err){
      res.send(err);
    });
  }
  // If we have token cookie, check if valid and return
  else{
    // get current session
    users.getSession(token)
    .then(function(result){
      //console.log(result, 'sessionLookup');
      returned.token = token;
      returned.ip = user.ip;
      returned.session = result.d;
      //console.log(returned.session);
      if(!returned.session){
        returned.authenticated = false;
      }
      else if(returned.session.authenticated){
        returned.authenticated = true;
      }
      return returned;
    })
    .then(function(result){
      res.json(returned);
    })
    // If we encountered an Error Fetching Session
    .catch(function(err){
      var errName = err.name;
      // If session Token is invalid Format, create a new one and return it
      if(errName === 'invalidFormat'){
        users.createSession(user, defaultSession)
        .then(function(result){
          //console.log(result.token, 'token from Catch');
          // Set cookie
          returned.token = result.token;
          returned.ip = user.ip;
          return result;
        })
        // Log that User Submitted Invalid Session Token
        // If Multple times, user may be trying to Hijack
        .then(function(result){
          res.json(returned);
        })
        .catch(function(err){
          res.send(err);
        });
      }
      else{
        res.send(err);
      }
    });
  }
})

}
