
var firebase = require('firebase');
require('firebase/auth');
require('firebase/database');
var env = require('../../.env.json');


exports.authenticate = function(){
  return new Promise(function(resolve, reject) {
    var app = firebase.initializeApp({
      apiKey: env.firebase.apiKey,
      authDomain: env.firebase.authDomain,
      databaseURL: env.firebase.database,
      storageBucket: env.firebase.storageBucket
    });
  });
}

module.exports = exports;
