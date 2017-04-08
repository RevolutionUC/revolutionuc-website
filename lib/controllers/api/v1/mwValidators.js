/**
 * Middleware validators for
 * use in API handlers.
 */

const API_KEY = process.env.API_KEY;
const deadline = 1491624000000; // Sat, 08 Apr 2017 00:00:00 EST

function apiKeyValidator(request, response, next) {
  if (request.query.key === API_KEY) {
    next();
  } else {
    response.status(403).json({authenticated: false});
  }
}

function eventDeadlineValidator(request, response, next) {
  if (Date.now() < deadline) {
    next();
  } else {
    response.status(400).send('deadlinePassed');
  }
}

function notificationChannelValidator(request, response, next) {
  if (request.query.channel_name === 'notifications') {
    next();
  } else {
    response.status(400).send('incorrectChannel');
  }
}

module.exports = {
  apiKeyValidator,
  eventDeadlineValidator,
  notificationChannelValidator
}
