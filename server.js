var express = require('express');
var app = express();
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var sessions = require('client-sessions');
var favicon = require('serve-favicon');
var fs = require('fs');
require('dot-env');

// App Settings
var config = require('./api/settings');

app.use(bodyParser.urlencoded({limit: '50mb'}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(cookieParser());
app.use(favicon(__dirname + '/app/static/images/favicon.png'));

// Load Routes
require('./api/routes/')(app);

/* Static Assets */
app.use(express.static(path.join(__dirname, 'app')));

// Defaults for sending non valid routes to index.html
app.get('/:a', function(req, res) {
  res.sendfile(path.join(__dirname, 'app', 'index.html'));
});
app.get('/:a/:b', function(req, res) {
  res.sendfile(path.join(__dirname, 'app', 'index.html'));
});
app.get('/:a/:b/:c', function(req, res) {
  res.sendfile(path.join(__dirname, 'app', 'index.html'));
});
app.get('/:a/:b/:c/:d', function(req, res) {
  res.sendfile(path.join(__dirname, 'app', 'index.html'));
});


/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;

app.listen(config.port, function() {
  console.log(process.env.startMessage, config.port);
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
  mongoose.connection.close(function () {
    console.log('Mongoose disconnected on app termination');
    process.exit(0);
  });
});
