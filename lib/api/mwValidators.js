/**
 * Middleware validators for
 * use in API handlers.
 */
const API_KEY = process.env.API_KEY;
const READONLY_API_KEY = process.env.READONLY_API_KEY;
const deadline = 1520053200000; // Sat, 03 Mar 2018 00:00:00 EST

/**
 * This is mostly used for MLH when they view our data, because we
 * can't have them changin' stuff and what not
 */
function readOnlyAPIKeyValidator(request, response, next) {
  if (request.query.key === API_KEY || request.query.key === READONLY_API_KEY) {
    // triple equals man, you know, for security ;)
    next();
  } else {
    response.status(401).json({ authenticated: false });
  }
}

function apiKeyValidator(request, response, next) {
  if (request.query.key === API_KEY) {
    // triple equals man, you know, for security ;)
    next();
  } else {
    response.status(401).json({ authenticated: false });
  }
}

function eventDeadlineValidator(request, response, next) {
  if (Date.now() < deadline) {
    next();
  } else {
    response.status(403).send("deadlinePassed");
  }
}

module.exports = {
  readOnlyAPIKeyValidator,
  apiKeyValidator,
  eventDeadlineValidator
};
