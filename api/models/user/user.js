var mongoose = require('mongoose');
var Schema = mongoose.Schema;;
var app = require('../../settings');

var instanceSchema = new Schema({
  id: String,
  role: String
})

// Create & Initialize Schema
var userSchema = new Schema({
    username: String,
    email: String,
    verified: Boolean,
    instances: [],
    avatar: String,
    salt: String,
    created: Date,
    password: String,
    usergroup: String,
    apiTokens: {
      internal: String,
      discord: String
    }
});

module.exports = app.mongodb.users.connection.model('users', userSchema);
