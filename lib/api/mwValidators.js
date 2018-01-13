/**
 * Middleware validators for
 * use in API handlers.
 */
const API_KEY = process.env.API_KEY;
const deadline = 1520053200000; // Sat, 03 Mar 2018 00:00:00 EST

function apiKeyValidator(request, response, next) {
  if (request.query.key === API_KEY) { // triple equals man, you know, for security ;)
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

module.exports = {
  apiKeyValidator,
  eventDeadlineValidator
}
