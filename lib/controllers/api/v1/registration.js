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
    cb(null, './resumes')
  },
  filename: function (request, file, cb) {
    cb(null, `${request.body.email}.pdf`)
  }
});

const upload = multer({storage: storage});

const registrantScheme = mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  school: {
    type: String,
    required: true
  },
  major: {
    type: String,
    required: true
  },
  education: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  shirtSize: {
    type: String,
    required: true
  },
  githubUsername: {
    type: String
  },
  dob: {
    type: String,
    required: true
  },
  registrationTime: {
    type: String,
    required: true
  },
  checkedIn: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  dietaryRestrictions: {
    type: String,
    default: ''
  },
  accommodations: {
    type: String,
    default: ''
  },
  resumePath: {
    type: String,
    required: true
  }
});

const Registrant = mongoose.model('Registrant', registrantScheme);

/**
 * Registration route handlers
 */

routes.post('/register', upload.single('resume'), require('./registrationValidator'), (request, response) => {
  // Set meta defaults
  request.body.registrationTime = Date();
  request.body.resumePath = `./resumes/${request.body.email}.pdf`;

  const newRegistrant = new Registrant(request.body);

  newRegistrant.save(function (err, savedRegistrant) {
    if (err) return console.error(err);
    response.status(201).json(savedRegistrant);
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

    response.json({removed: true});

  });
});

module.exports = routes;
