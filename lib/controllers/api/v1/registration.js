const routes = require('express').Router();
const mongoose = require('mongoose');
const MONGO_URL = process.env.MONGO_URL;

mongoose.connect(MONGO_URL);

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function() {
  console.log(`We're connected now`);
});

const registrantScheme = mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String
});

const Registrant = mongoose.model('Registrant', registrantScheme);

routes.post('/register', (request, response) => {
  const registrantObject = {
    firstName: request.body.firstName,
    lastName: request.body.lastName,
    email: request.body.email
  }

  const newRegistrant = new Registrant(registrantObject);

  newRegistrant.save(function (err, savedRegistrant) {
    if (err) return console.error(err);
    response.json(savedRegistrant);
  });
});

routes.get('/all', (request, response) => {
  Registrant.find((err, allRegistrants) => {
    if (err) return console.error(err);
    response.json(allRegistrants);
  });
});

routes.get('/clear', (request, response) => {

  Registrant.find(function (err, allRegistrants) {
    if (err) return console.error(err);

    allRegistrants.forEach(registrant => {

      Registrant.remove(registrant, function(err, removed) {
      });

    });

    response.json({removed: 'removed'});

  });
});

module.exports = routes;
