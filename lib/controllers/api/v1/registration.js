const routes = require('express').Router();
const mongoose = require('mongoose');
const MONGO_URL = process.env.MONGO_URL;
mongoose.connect(MONGO_URL);

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function() {
  console.log(`We're connected now`);
});

const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (request, file, cb) {
    cb(null, './resumes/')
  },
  filename: function (request, file, cb) {
    cb(null, `${request.body.email}.pdf`)
  }
});

const upload = multer({storage: storage});

const registrantScheme = mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  resumePath: String
});

const Registrant = mongoose.model('Registrant', registrantScheme);

routes.post('/register', upload.single('resume'), (request, response) => {
  const registrantObject = {
    firstName: request.body.firstName,
    lastName: request.body.lastName,
    email: request.body.email,
    resumePath: `./resumes/${request.body.email}.pdf`
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
      Registrant.remove(registrant, _ => {});
    });

    response.json({removed: 'removed'});

  });
});

module.exports = routes;
