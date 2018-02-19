const routes = require('express').Router();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL);
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', _ => {console.log('Connected to mongoose in registration controller')});

const registrationRoutes = require('./registration');
const emailRoutes = require('./email');

/**
 * CORS and Cache-handling stuff
 */
routes.use('/*', (request, response, next) => {
  const origin = request.headers.origin;
  const allowedOrigins = ['http://localhost:4000', 'https://revolutionuc.com', 'https://test.revolutionuc.com', 'http://test.revolutionuc.com'];

  if (allowedOrigins.indexOf(origin) > -1) {
    response.setHeader('Access-Control-Allow-Origin', origin);
  }

  response.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Requested-With');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,HEAD,DELETE,OPTIONS');
  response.setHeader('Access-Control-Allow-Credentials', true);

  // API responses should never be stored
  response.set({
    'Cache-Control': 'no-store'
  });

  response.removeHeader('X-Powered-By');

  next();
});

// API index handler
routes.get('/', (request, response) => {
  response.json({api: true});
});

// Registration endpoints
routes.use('/registration', registrationRoutes);

// Email endpoints
routes.use('/email', emailRoutes);

module.exports = routes;
