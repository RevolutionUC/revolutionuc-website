const routes = require('express').Router();
const {build, send} = require('revolutionuc-emails');
const {readOnlyAPIKeyValidator, apiKeyValidator, eventDeadlineValidator} = require('./mwValidators');
const {Registrant} = require('../models/registrant');
const crypto = require ('crypto');

const mailgunApiKey = process.env.MAILGUN_API_KEY;
const mailgunDomain = process.env.MAILGUN_DOMAIN;

const userCryptoAlgorithm = 'aes-256-ctr';
const userCryptoPassword = process.env.MONGO_SALT;

/**
 * Email route handlers
 */

/**
 * This is used to send email verification emails to all
 * registrants that:
 *
 *   - Have registered but not verified their email address
 *
 * It is intended to be called from the dashboard or manually.
 * We use this to give people who haven't confirmed their email
 * a chance to be able to receive the attendance confirmation email.
 *
 * usage: /sendEmailVerification?key=<apikeyhere>
 */
routes.get('/sendEmailVerification', apiKeyValidator, eventDeadlineValidator, (request, response) => {
  Registrant.find({emailVerified: false}, (err, registrants) => {
    if (err) {
      console.error(err);
      return response.status(400).send('Sorry, something went wrong');
    }

    sendEmailVerification(request, registrants);
    response.json({"affected users": registrants.length});
  });
});

/**
 * This is used to send attendance confirmation emails to
 * all registrants that:
 *
 *   - Have verified their email address
 *   - Do not appear on the waitlist
 *   - Have not previously received an attendance confirmation email
 *
 * It is intended to be called from the dashboard or manually.
 *
 * usage: /sendConfirmation?key=<apikeyhere>
 */
routes.get('/sendConfirmation', apiKeyValidator, eventDeadlineValidator, (request, response) => {
  Registrant.find({emailVerified: true, waitList: false, receivedAttendanceConfirmationEmail: false}, (err, registrants) => {
    if (err) {
      console.error(err);
      return response.status(400).send('Sorry, something went wrong');
    }

    sendConfirmationEmails(request, registrants);
    response.status(200).json({"affected users": registrants.length});
  });
});

/**
 * This is used to send attendance confirmation emails to
 * an individual registrant:
 *
 *   - Exec has decided to include regardless of any other condition
 *
 * It is intended to be called from the dashboard or manually.
 * We use this to give priority to someone or to send an attendance
 * confirmation email to someone who might not have received it.
 * Use with caution :)
 *
 * usage: /sendConfirmationToIndividual?key=<apikeyhere>
 */
routes.get('/sendConfirmationToIndividual', apiKeyValidator, (request, response) => {
  const userEmail = request.query.userEmail;

  Registrant.find({email: userEmail}, (err, registrants) => {
    if (err || !registrants.length) return response.status(400).send(`Either something went wrong, or ${userEmail} could not be found`);

    Registrant.update({email: userEmail}, {waitList: false}, (err, numberAffected, rawResponse) => {
      if (err) {
        console.error(err);
        return response.status(400).send('Sorry, something went wrong');
      }

      sendConfirmationEmails(request, registrants);
      response.json({"affected users": registrants.length});
    }); // Registrant.update()
  }); // Registrant.find()
});

/**
 * This is used to send attendance confirmation emails to
 * all registrants that are sitting ducks. A sitting duck is
 * a registrant that:
 *
 *   - Has previously received an attendance confirmation email
 *   - But has not confirmed/denied their attendance
 *
 * It is intended to be called from the dashboard or manually.
 * We use this to give people who haven't replied a bump so they
 * can still confirm their attendance.
 *
 * usage: /sendConfirmationToSittingDucks?key=<apikeyhere>
 */
routes.get('/sendConfirmationToSittingDucks', apiKeyValidator, eventDeadlineValidator, (request, response) => {
  Registrant.find({receivedAttendanceConfirmationEmail: true, attendanceConfirmed: 'NA'}, (err, registrants) => {
    if (err) {
      console.error(err);
      return response.status(400).send('Sorry, something went wrong');
    }

    sendConfirmationEmails(request, registrants);
    response.json({"affected users": registrants.length});
  });
});

/**
 * This is used to send attendance confirmation emails to all
 * registrants that:
 *
 *   - Have verified their email address
 *   - Have registered after we hit our waitlist threshold
 *
 * It is intended to be called from the dashboard or manually.
 * We use this to give people who were put on the waitlist a chance
 * to attend the event if space frees up.
 *
 * usage: /sendConfirmationToWaitlisted?key=<apikeyhere>
 */
routes.get('/sendConfirmationToWaitlisted', apiKeyValidator, eventDeadlineValidator, (request, response) => {
  Registrant.find({emailVerified: true, waitList: true}, (err, registrants) => {
    if (err) {
      console.error(err);
      return response.status(400).send('Sorry, something went wrong');
    }

    Registrant.update({emailVerified: true, waitList: true}, {waitList: false}, {multi: true}, (err, numberAffected, rawResponse) => {
      sendConfirmationEmails(request, registrants, {offWaitlist: true});
      response.json({"affected users": registrants.length});

    }); // Registrant.update
  }); // Registrant.find
});

/**
 * This is used to send the infoEmail1 email to all registrants that:
 *
 *   - Have confirmed their email address
 *
 * It is intended to be called manually, or from the dashboard if that
 * functionality gets implemented.
 *
 * usage: /sendInfoEmail1?key=<apikeyhere>
 */
routes.get('/sendInfoEmail1', apiKeyValidator, eventDeadlineValidator, (request, response) => {
  Registrant.find({emailVerified: true}, (err, registrants) => {
    if (err) {
      console.error(err);
      return response.status(400).send('Sorry, something went wrong');
    }

    sendInfoEmail1(request, registrants);
    response.json({"affected users": registrants.length});
  });
});

/**
 * This is used to send the infoEmailMinors email to all registrants that:
 *
 *   - Are under 18
 *   - Have not received this email before
 *   - Have confirmed their attendance for the event
 *
 * It is intended to be called manually, or from the dashboard if that
 * functionality gets implemented.
 *
 * usage: /sendInfoEmailMinors?key=<apikeyhere>
 *
 */
routes.get('/sendInfoEmailMinors', apiKeyValidator, eventDeadlineValidator, (request, response) => {
  Registrant.find({attendanceConfirmed: "YES", receivedMinorInfoEmail: false}, (err, registrants) => {
    if (err) {
      console.error(err);
      return response.status(400).send('Sorry, something went wrong');
    }

    // We'll do a little preprocessing here to filter out the non-minor registrants
    let eighteenYearsUnix = 567993600;
    registrants = registrants.filter(registrant => {
      let dob = Date.parse(registrant.dob) / 1000;
      let now = Date.now() / 1000;
      return now - dob < eighteenYearsUnix;
    });

    for (registrant of registrants) {
      Registrant.update({email: registrant.email}, {receivedMinorInfoEmail: true}, (err, numberAffected, rawResponse) => {});
    }

    sendInfoEmailMinors(request, registrants);
    response.json({"affected users": registrants.length});
  }); // Registrant.find
});

/**
 * This is used to send the infoEmail3 email to all registrants that:
 *
 *   - Have not received this email before
 *   - Have confirmed their attendance for the event
 *
 * It is intended to be called manually, or from the dashboard if that
 * functionality gets implemented.
 *
 * usage: /infoEmail3?key=<apikeyhere>
 *
 */
routes.get('/sendInfoEmail3', apiKeyValidator, eventDeadlineValidator, (request, response) => {
  Registrant.find({attendanceConfirmed: "YES", receivedInfoEmail3: false}, (err, registrants) => {
    if (err) {
      console.error(err);
      return response.status(400).send('Sorry, something went wrong');
    }

    for (registrant of registrants) {
      Registrant.update({email: registrant.email}, {receivedInfoEmail3: true}, (err, numberAffected, rawResponse) => {});
    }

    sendInfoEmail3(request, registrants);
    response.json({"affected users": registrants.length});
  }); // Registrant.find
});

/*
 ***********************************************************
 * Below are helper functions that some of the above
 * endpoints call. For example, `/sendInfoEmail1` makes
 * use of sendInfoEmail1(), while just about ever other
 * email endpoint makes use of `sendConfirmationEmails()`
 ***********************************************************
 */

async function sendConfirmationEmails(request, registrants, settings = {}) {
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

    // Used to copy all enumerable own properties from `settings` to `emailData`, thus
    // effectively merging the two objects. If `settings` and `emailData` share any of the
    // same keys, the values associated with `settings` will be used, and will overwrite those
    // in `emailData`
    Object.assign(emailData, settings);

    // Two async tasks
    //   1. Send confirm attendance email
    const html = await build('confirmAttendance', emailData);
    send(mailgunApiKey, mailgunDomain, 'RevolutionUC <info@revolutionuc.com>', registrant.email, emailData.subject, html);

    //   2. Update user in DB to have received the attendance confirmation email
    Registrant.update({email: registrant.email}, {receivedAttendanceConfirmationEmail: true}, _ => {});
  }
}

/**
 * TODO(domfarolino): generalize this function for other "info"
 * emails that we might send when the time comes.
 */
async function sendInfoEmail1(request, registrants) {
  for (let registrant of registrants) {
    // Build user emailData
    let emailData = {
      subject: 'RevolutionUC is Less Than 3 Weeks Away! 🙌 ',
      shortDescription: "We're less than 3 weeks away from RevolutionUC Spring 2018! Here are some updates on the event.",
      firstName: registrant.firstName
    };

    // One async task
    //   1. Send infoEmail1
    const html = await build('infoEmail1', emailData);
    await send(mailgunApiKey, mailgunDomain, 'RevolutionUC <info@revolutionuc.com>', registrant.email, emailData.subject, html);
  }
}

async function sendInfoEmailMinors(request, registrants) {
  for (let registrant of registrants) {
    // Build user emailData
    let emailData = {
      subject: "Minors at RevolutionUC - Important Information for the Event",
      shortDescription: "Because you're under 18, there is some extra information you need to know to get ready.",
      firstName: registrant.firstName
    };

    // One async task
    //   1. Send infoEmailMinors
    const html = await build('infoEmailMinors', emailData);
    await send(mailgunApiKey, mailgunDomain, 'RevolutionUC <info@revolutionuc.com>', registrant.email, emailData.subject, html);
  }
}

async function sendInfoEmail3(request, registrants) {
  for (let registrant of registrants) {
    // Build user emailData
    let emailData = {
      subject: "Important Information for RevolutionUC!",
      shortDescription: "Here's some important information you need to know to get ready for this weekend!",
      firstName: registrant.firstName
    };

    // One async task
    //   1. Send infoEmail3
    const html = await build('infoEmail3', emailData);
    await send(mailgunApiKey, mailgunDomain, 'RevolutionUC <info@revolutionuc.com>', registrant.email, emailData.subject, html);
  }
}

async function sendEmailVerification(request, registrants) {
  for (let registrant of registrants) {
    // Build user emailData
    let emailData = {
      subject: 'Verify Email',
      shortDescription: 'Please verify your email address for RevolutionUC',
      firstName: savedRegistrant.firstName,
      verificationUrl: `${request.protocol}://${request.get('host')}/registration/verify?user=${encrypted}`,
      waitlist: savedRegistrant.waitList
    };

    // One asnyc task
    //   1. Send email verification emaily
    const html = await build('verifyEmail', emailData);
    await send(mailgunApiKey, mailgunDomain, 'RevolutionUC <info@revolutionuc.com>', savedRegistrant.email, emailData.subject, html);
  }

}

module.exports = routes;
