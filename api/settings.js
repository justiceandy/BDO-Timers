var express = require('express');
var uuid = require('node-uuid');
var mongoose = require('mongoose');

// Api Settings
var settings = {
    name: process.env.name,
    port: process.env.port,
    mailer: 'mailgun',
    defaultDB: 'mongodb',
    favicon: '/app/static/images/favicon.ico',
    views: '/api/views',
    renderEngine: 'jade',
    sessions: {
      cookieName: 'session',
      secret: uuid.v4(),
      duration: 30 * 60 * 1000,
      activeDuration:  5 * 60 * 1000
    },
    defaultSession: {
      'loggedIn': false,
      'verified': false,
      'loginAttempts': 0,
      'domain': 1
    },
    redis: {
      enabled: true,
      host: process.env.redis_host,
      port: process.env.redis_port
    },
    mongodb: {
      enabled: true,
      instances: {
          connection: mongoose.createConnection('mongodb://'+process.env.mongoDB)
      },
      users: {
          connection: mongoose.createConnection('mongodb://'+process.env.mongoDB)
      },
      bosses: {
          connection: mongoose.createConnection('mongodb://'+process.env.mongoDB)
      },
      channels: {
          connection: mongoose.createConnection('mongodb://'+process.env.mongoDB)
      },
      spawns: {
          connection: mongoose.createConnection('mongodb://'+process.env.mongoDB)
      },
      loot: {
          connection: mongoose.createConnection('mongodb://'+process.env.mongoDB)
      }
    }
}

module.exports = settings;
