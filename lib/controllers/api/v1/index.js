const routes = require('express').Router();
const registrationRoutes = require('./registration');
const notificationRoutes = require('./notification');

routes.get('/*', (request, response, next) => {
  // API responses should never be stored
  response.set({
    'Cache-Control': 'no-store'
  });

  next();
});


// API v1 index handler
routes.get('/', (request, response) => {
  response.json({api: true});
});

// Registration post handler
routes.use('/registration', registrationRoutes);
routes.use('/notification', notificationRoutes);

module.exports = routes;
