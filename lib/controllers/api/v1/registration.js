const crypto = require('crypto');
const multer = require('multer');
const mongoose = require('mongoose');
const routes = require('express').Router();
const Email = require('revolutionuc-emails');

const email = new Email(process.env.MAILGUN_API_KEY, process.env.MAILGUN_DOMAIN);
const MONGO_URL = process.env.MONGO_URL;
const RESUME_PATH = process.env.RESUME_PATH;
mongoose.connect(MONGO_URL);

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', _ => {console.log('Connected to mongoose!')});

const storage = multer.diskStorage({
  destination: function (request, file, cb) {
    cb(null, RESUME_PATH)
  },
  filename: function (request, file, cb) {
    cb(null, `${request.body.email}.pdf`)
  }
});

const upload = multer({storage, limits: { fileSize: 20000000, files: 1 }}); // 20mb max
const userCryptoAlgorithm = 'aes-256-ctr';
const userCryptoPassword = process.env.MONGO_SALT;

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
  ethnicity: {
    type: String,
    required: true
  },
  howYouHeard: {
    type: String
  },
  hackathons: {
    type: String
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
  attendanceConfirmed: {
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

routes.post('/register', (request, response) => {
  upload.single('resume')(request, response, err => {
    if (err) {
      return response.status(400).json([{param: err.field, msg: err.code}]);
    }

    const validationErrors = require('./registrationValidator')(request);

    if (validationErrors) {
      return response.status(400).json(validationErrors);
    }

    // Set meta defaults
    const resumePath = RESUME_PATH.endsWith('/') ? RESUME_PATH : RESUME_PATH + '/';
    request.body.registrationTime = Date();
    request.body.resumePath = `${resumePath}${request.body.email}.pdf`;

    const newRegistrant = new Registrant(request.body);

    Registrant.find({email: request.body.email}, (err, registrants) => {
      if (registrants.length) return response.status(400).json([{param: 'email', msg: 'Email address has already been registered'}]);

      newRegistrant.save(function (err, savedRegistrant) {
        const cipher = crypto.createCipher(userCryptoAlgorithm, userCryptoPassword)
        let encrypted = cipher.update(savedRegistrant.email, 'utf8', 'hex')
        encrypted += cipher.final('hex');

        const emailData = {
          subject: 'Verify Email',
          shortDescription: 'Please verify your email address for RevolutionUC',
          firstName: savedRegistrant.firstName,
          verificationUrl: `${request.protocol + '://' + request.get('host')}/api/v1/registration/verify?user=${encrypted}`
        }

        email.build('verifyEmail', emailData, 'RevolutionUC <info@revolutionuc.com>', savedRegistrant.email)
          .then(email => {
            if (err) return console.error(err);
            return response.status(201).json(savedRegistrant);
          }, e => {
            console.log(e);
            return response.status(400).send(e);
          });

      });
    });
  });
});

routes.get('/verify', (request, response) => {
  const decipher = crypto.createDecipher(userCryptoAlgorithm, userCryptoPassword);
  let dec = decipher.update(request.query.user, 'hex', 'utf8');
  dec += decipher.final('utf8');

  const userEmail = dec;

  Registrant.update({email: userEmail}, {emailVerified: true}, (err, numberAffected, rawResponse) => {
    if (err) response.status(400).send('Sorry, something went wrong');
    response.status(200).redirect('/email-verified');
  })
});

// routes.get('/all', (request, response) => {
//   Registrant.find((err, allRegistrants) => {
//     if (err) return console.error(err);
//     response.json(allRegistrants);
//   });
// });

// routes.get('/clear', (request, response) => {
//   Registrant.find(function (err, allRegistrants) {
//     if (err) return console.error(err);

//     allRegistrants.forEach(registrant => {
//       Registrant.remove(registrant, _ => {});
//     });

//     response.json({removed: true});
//   });
// });

module.exports = routes;