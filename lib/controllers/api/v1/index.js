module.exports.apiMiddleware = (request, response, next) => {
  // API responses should never be stored
  response.set({
    'Cache-Control': 'no-store'
  });

  next();
};

// API v1 index handler
module.exports.index = (request, response) => {
  response.json({api: true});
};
