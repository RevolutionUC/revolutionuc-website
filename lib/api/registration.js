const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const crypto = require('crypto');
const multer = require('multer');
const mongoose = require('mongoose');
const routes = require('express').Router();
const { build, send } = require('revolutionuc-emails');
const {apiKeyValidator, eventDeadlineValidator} = require('./mwValidators');

const mailgunApiKey = process.env.MAILGUN_API_KEY;
const mailgunDomain = process.env.MAILGUN_DOMAIN;
const MONGO_URL = process.env.MONGO_URL;
const WAITLIST_THRESHOLD = process.env.WAITLIST_THRESHOLD;

const storage = multer.diskStorage({
  destination: function (request, file, cb) {
    cb(null, './');
  },
  filename: function (request, file, cb) {
    cb(null, 'test.txt');
  }
});

const upload = multer({storage, limits: { fileSize: 20000000, files: 1 }}); // 20mb max

mongoose.connect(MONGO_URL);

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', _ => {console.log('Connected to mongoose in registration controller')});

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
  phoneNumber: {
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
  waitList: {
    type: Boolean,
    default: false
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
    type: String,
    default: "NA",
  },
  receivedAttendanceConfirmationEmail: {
    type: Boolean,
    default: false
  },
  vegetarian: {
    type: Boolean,
    default: false
  },
  vegan: {
    type: Boolean,
    default: false
  },
  peanutAllergy: {
    type: Boolean,
    default: false
  },
  glutenFree: {
    type: Boolean,
    default: false
  },
  otherDietaryRestrictions: {
    type: String,
    default: ''
  }
});

const Registrant = mongoose.model('Registrant', registrantScheme);

/**
 * Registration route handlers
 */
routes.post('/register', eventDeadlineValidator, (request, response) => {
upload.single('resume')(request, response, err => {
  const validationErrors = require('./registrationValidator')(request);

  if (validationErrors) {
    return response.status(400).json(validationErrors);
  }

  // Set meta defaults
  request.body.registrationTime = Date();

  const newRegistrant = new Registrant(request.body);

  Registrant.find((err, registrants) => {

    /**
     * Check if user has already registered
     */
    for (let registrant of registrants) {
      if (registrant.email.toLowerCase() == request.body.email.toLowerCase()) {
        // Manual error: this could be done better
        return response.status(400).json([{param: 'email', msg: 'Email address has already been registered'}]);
      }
    }

    if (request.file) {
      // Upload resume to s3
      const extensionArray = request.file.originalname.split('.');
      const resumeExtension = extensionArray[extensionArray.length - 1];
      const params = {
        Body: require('fs').createReadStream(request.file.path),
        Bucket: 'revolutionuc-resumes',
        Key: `${request.body.email}.${resumeExtension}`
      }

      s3.upload(params, (err, data) => {
        if (err) {
          console.log(err, err.stack);
          // Manual error: this could be done better
          return response.status(400).json([{param: 'resume', msg: 'Resume failed to upload'}]);
        }
    newRegistrant.waitList = (registrants.length >= WAITLIST_THRESHOLD);

    newRegistrant.save((err, savedRegistrant) => {
      const cipher = crypto.createCipher(userCryptoAlgorithm, userCryptoPassword);
      let encrypted = cipher.update(savedRegistrant.email, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      let emailType, emailData;

      emailData = {
        subject: 'Verify Email',
        shortDescription: 'Please verify your email address for RevolutionUC',
        firstName: savedRegistrant.firstName,
        verificationUrl: `${request.protocol}://${request.get('host')}/registration/verify?user=${encrypted}`,
        waitlist: savedRegistrant.waitList
      };

      build('verifyEmail', emailData)
        .then(html => {
          return send(mailgunApiKey, mailgunDomain, 'RevolutionUC <info@revolutionuc.com>', savedRegistrant.email, emailData.subject, html);
        })
        .then(() => {
          if (err) return console.error(err);
          return response.status(201).json(savedRegistrant);
        }, e => {
          console.log(e);
          return response.status(400).send(e);
        }); // build().then()

    }); // newRegistrant.save()

      });
    } else {

    newRegistrant.waitList = (registrants.length >= WAITLIST_THRESHOLD);

    newRegistrant.save((err, savedRegistrant) => {
      const cipher = crypto.createCipher(userCryptoAlgorithm, userCryptoPassword);
      let encrypted = cipher.update(savedRegistrant.email, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      let emailType, emailData;

      emailData = {
        subject: 'Verify Email',
        shortDescription: 'Please verify your email address for RevolutionUC',
        firstName: savedRegistrant.firstName,
        verificationUrl: `${request.protocol}://${request.get('host')}/registration/verify?user=${encrypted}`,
        waitlist: savedRegistrant.waitList
      };

      build('verifyEmail', emailData)
        .then(html => {
          return send(mailgunApiKey, mailgunDomain, 'RevolutionUC <info@revolutionuc.com>', savedRegistrant.email, emailData.subject, html);
        })
        .then(() => {
          if (err) return console.error(err);
          return response.status(201).json(savedRegistrant);
        }, e => {
          console.log(e);
          return response.status(400).send(e);
        }); // build().then()

    }); // newRegistrant.save()
    }
  }); // Registrant.find()
});// multer shit
});

routes.get('/verify', eventDeadlineValidator, (request, response) => {
  const decipher = crypto.createDecipher(userCryptoAlgorithm, userCryptoPassword);
  let dec = decipher.update(request.query.user, 'hex', 'utf8');
  dec += decipher.final('utf8');

  const userEmail = dec;

  Registrant.update({email: userEmail}, {emailVerified: true}, (err, numberAffected, rawResponse) => {
    if (err) response.status(400).send('Sorry, something went wrong');
    response.status(200).redirect('https://revolutionuc.com/email-verified');
  });
});

routes.get('/sendConfirmation', apiKeyValidator, eventDeadlineValidator, (request, response) => {
  Registrant.find({emailVerified: true, waitList: false, receivedAttendanceConfirmationEmail: false}, (err, registrants) => {
    if (err) return console.error(err);

    sendConfirmationEmails(request, registrants);
    response.send({sent: true});
  });
});

routes.get('/sendConfirmationToSittingDucks', apiKeyValidator, eventDeadlineValidator, (request, response) => {
  Registrant.find({receivedAttendanceConfirmationEmail: true, attendanceConfirmed: 'NA'}, (err, registrants) => {
    if (err) return console.error(err);

    sendConfirmationEmails(request, registrants);
    response.send({sent: true});
  });
});

routes.get('/sendConfirmationToWaitlisted', apiKeyValidator, eventDeadlineValidator, (request, response) => {
  Registrant.find({emailVerified: true, waitList: true}, (err, registrants) => {
    if (err) return console.error(err);

    Registrant.update({emailVerified: true, waitList: true}, {waitList: false}, {multi: true}, (err, numberAffected, rawResponse) => {
      response.send(registrants);
    });

    sendConfirmationEmails(request, registrants, {offWaitlist: true});
  });
});

routes.get('/sendConfirmationIndividual', apiKeyValidator, (request, response) => {
  const userEmail = request.query.userEmail;

  Registrant.find({email: userEmail}, (err, registrants) => {
    if (err || !registrants.length) return response.status(400).send(`Either something went wrong, or ${userEmail} could not be found`);

    Registrant.update({email: userEmail}, {waitList: false}, (err, numberAffected, rawResponse) => {
      if (err) return response.status(400).send('Sorry, something went wrong');

      sendConfirmationEmails(request, registrants);
    });

    response.send({sent: true});
  });
});

/**
 * This endpoint is intended to be called from the confirmation
 * email.
 */
routes.get('/confirm', eventDeadlineValidator, (request, response) => {
  const decipher = crypto.createDecipher(userCryptoAlgorithm, userCryptoPassword);
  let dec = decipher.update(request.query.user, 'hex', 'utf8');
  dec += decipher.final('utf8');

  const userEmail = dec;

  const confirmValue = request.query.confirm;

  const emailData = {subject: 'Welcome to RevolutionUC!', shortDescription: 'What you need to know for RevolutionUC'};

  if (confirmValue !== 'YES' && confirmValue !== 'NO') {
    return response.status(400).send('You must confirm yes or no');
  }

  Registrant.findOne({email: userEmail}, (err, registrant) => {
    if (err) response.status(400).send('Sorry, something went wrong');

    if (registrant && (registrant.attendanceConfirmed == 'YES' || registrant.attendanceConfirmed == 'NO')) {
      return response.send('You have already confirmed your attendance');
    }

    Registrant.update({email: userEmail}, {attendanceConfirmed: confirmValue}, (err, numberAffected, rawResponse) => {
      if (err) response.status(400).send('Sorry, something went wrong');

      if (confirmValue == 'YES') {
        emailData.firstName = registrant.firstName;
        build('firstInfoEmail', emailData)
          .then(html => {
            return send(mailgunApiKey, mailgunDomain, 'RevolutionUC <info@revolutionuc.com>', registrant.email, emailData.subject, html);
          })
          .then(() => {
            if (err) return console.error(err);
            return response.status(201).json(savedRegistrant);
          }, e => {
            console.log(e);
            return response.status(400).send(e);
          }); // build().then()

      }

      // Send them to the proper page after they confirm or deny attendence
      response.status(200).redirect(`https://revolutionuc.com/attendance-${(confirmValue == 'YES' ? 'confirmed' : 'denied')}`);
    });
  });
});

function sendConfirmationEmails(request, registrants, settings = {}) {
  for (let registrant of registrants) {
    // Build user hash
    let cipher = crypto.createCipher(userCryptoAlgorithm, userCryptoPassword);
    let encrypted = cipher.update(registrant.email, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Build user confirmationUrl and nextTimeUrl
    let confirmationUrl = `${request.protocol}://${request.get('host')}/registration/confirm?user=${encrypted}`;

    // Build user emailData
    let emailData = {
      subject: 'Confirm Your Attendance',
      shortDescription: 'Please confirm your attendance for RevolutionUC',
      firstName: registrant.firstName,
      yesConfirmationUrl: `${confirmationUrl}&confirm=YES`,
      noConfirmationUrl: `${confirmationUrl}&confirm=NO`,
    };

    Object.assign(emailData, settings);

    // Two async tasks
    //   1. Send confirm attendance email
    //   2. Update user in DB to have received the attendance confirmation email
    email.build('confirmAttendance', emailData, 'RevolutionUC <info@revolutionuc.com>', registrant.email);
    Registrant.update({email: registrant.email}, {receivedAttendanceConfirmationEmail: true}, _ => {});
  }
}

/**
 * This is used to manually check a user in via
 * email address. It is intended to be used by the
 * organizer team, and requires the API key.
 *
 * usage: /checkIn?key=<apikeyhere>
 */
routes.get('/checkIn', apiKeyValidator, (request, response) => {
  const userEmail = request.query.userEmail;

  Registrant.update({email: userEmail}, {checkedIn: true}, (err, numberAffected, rawResponse) => {
    if (err) return response.status(400).send('Sorry, something went wrong');

    response.json({checkedIn: true});
  });
});

routes.get('/all', apiKeyValidator, (request, response) => {
  Registrant.find((err, allRegistrants) => {
    if (err) return console.error(err);
    response.json(allRegistrants);
  });
});

routes.get('/clear', apiKeyValidator, (request, response) => {
  Registrant.remove({}, _ => {});
  response.json({removed: true});
});

module.exports = routes;
