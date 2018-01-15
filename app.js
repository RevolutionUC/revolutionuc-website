'use strict';

require('dotenv').config({silent: true});

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('morgan');
const bodyParser = require('body-parser');
//const LEX = require('letsencrypt-express');
const cookieParser = require('cookie-parser');
const expressValidator = require('express-validator');

const express = require('express');
const app = express();

/**
 * Middleware setup (gross)
 */
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator([]));
app.use(cookieParser());

/**
 * Custom handler for all cache control
 */
app.get('*', (request, response, next) => {
  response.set({
    'Cache-Control': 'no-cache'
  });

  // Remove bs headers
  response.removeHeader('X-Powered-By');

  // Move on down the line
  next();
});

/**
 * API setup
 */
const apiV1 = require('./lib/api');
app.use('/', apiV1);

app.get('/404', (request, response) => {
  response.status(404).json({"error": "page not found"});
});

/**
 * Letsencrypt and other stuff below
 */
/*const lex = LEX.create({
  server: 'staging',
  //configDir: require('os').homedir() + '/letsencrypt/etc',
  configDir: '/etc/letsencrypt',
  approveDomains: approveDomains
});

function approveDomains(opts, certs, cb) {
  // This is where you check your database and associated
  // email addresses with domains and agreements and such

  // The domains being approved for the first time are listed in opts.domains
  // Certs being renewed are listed in certs.altnames
  if (certs) {
    opts.domains = certs.altnames;
  } else {
    opts.email = 'domfarolino@gmail.com';
    opts.agreeTos = true;
  }

  // NOTE: you can also change other options such as `challengeType` and `challenge`
  // opts.challengeType = 'http-01';
  // opts.challenge = require('le-challenge-fs').create({});

  cb(null, { options: opts, certs: certs });
}

lex.onRequest = app;
*/

require('http').createServer(app).listen(process.env.PORT, function() {
  console.log('Server created!');
});

/*
require('http').createServer(lex.middleware(app)).listen(process.env.PORT, function () {
  console.log("Listening for ACME http-01 challenges on", this.address());
});
*/

/*
require('https').createServer(lex.httpsOptions, lex.middleware(app)).listen(process.env.HTTPS_CHALLENGE_PORT, function () {
  console.log("Listening for ACME tls-sni-01 challenges and serve app on", this.address());
});
*/

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.redirect('/404');
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, request, response, next) {
    response.status(err.status || 500);
    response.json({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, request, response, next) {
  response.status(err.status || 500);
  response.json({
    message: err.message,
    error: {}
  });
});

module.exports = app;
