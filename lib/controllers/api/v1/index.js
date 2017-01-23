const routes = require('express').Router();

routes.get('/*', (request, response) => {
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

// Mock registration handler
routes.post('/register', (request, response) => {
  response.json({response: true});
});

module.exports = routes;
