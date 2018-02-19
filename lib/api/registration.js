const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const crypto = require('crypto');
const multer = require('multer');
const routes = require('express').Router();
const {build, send} = require('revolutionuc-emails');
const {readOnlyAPIKeyValidator, apiKeyValidator, eventDeadlineValidator} = require('./mwValidators');
const {Registrant} = require('../models/registrant');

const mailgunApiKey = process.env.MAILGUN_API_KEY;
const mailgunDomain = process.env.MAILGUN_DOMAIN;
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

const userCryptoAlgorithm = 'aes-256-ctr';
const userCryptoPassword = process.env.MONGO_SALT;

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
    if (err) {
      console.log(err);
      return response.status(400).send('Sorry, something went wrong');
    }

    response.status(200).redirect('https://revolutionuc.com/email-verified');
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

  Registrant.findOne({email: userEmail, emailVerified: true}, (err, registrant) => {
    if (err || !registrant) {
      console.error(err);
      return response.status(400).send('Sorry, something went wrong');
    }

    if (registrant && (registrant.attendanceConfirmed == 'YES' || registrant.attendanceConfirmed == 'NO')) {
      return response.send('You have already confirmed your attendance');
    }

    Registrant.update({email: userEmail}, {attendanceConfirmed: confirmValue}, (err, numberAffected, rawResponse) => {
      if (err) {
        console.error(err);
        return response.status(400).send('Sorry, something went wrong');
      }

      if (confirmValue == 'YES') {
        emailData.firstName = registrant.firstName;
        build('firstInfoEmail', emailData)
          .then(html => {
            return send(mailgunApiKey, mailgunDomain, 'RevolutionUC <info@revolutionuc.com>', registrant.email, emailData.subject, html);
          })
          .catch(e => {
            console.log(e);
            return response.status(400).send(e);
          }); // build().then()
      }

      // Send them to the proper page after they confirm or deny attendence
      response.status(200).redirect(`https://revolutionuc.com/attendance-${(confirmValue == 'YES' ? 'confirmed' : 'denied')}`);
    });
  });
});

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
    if (err) {
      console.error(err);
      return response.status(400).send('Sorry, something went wrong');
    }

    response.json({checkedIn: true});
  });
});

routes.get('/all', readOnlyAPIKeyValidator, (request, response) => {
  Registrant.find((err, allRegistrants) => {
    if (err) {
      console.error(err);
      return response.status(400).send('Sorry, something went wrong');
    }

    response.json(allRegistrants);
  });
});

routes.get('/clear', apiKeyValidator, (request, response) => {
  Registrant.remove({}, _ => {});
  response.json({removed: true});
});

module.exports = routes;
