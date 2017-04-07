const express = require('express');
const router  = express.Router();
const path    = require('path');
const webPush = require('web-push');
const mongoose = require('mongoose');

// web-push Firebase setup
const firebaseAPIKey = process.env.FIREBASE_API_KEY;
const API_KEY = process.env.API_KEY;
webPush.setGCMAPIKey(firebaseAPIKey);

// All da mongo{ose} Jazz
const MONGO_URL = process.env.MONGO_URL;
mongoose.connect(MONGO_URL);

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', _ => {console.log('Connected to mongoose in notification controller')});

const pushCredentialSchema = mongoose.Schema({
  endpoint: {
    type: String,
    required: true
  },
  p256dh: {
    type: String,
    required: true
  },
  auth: {
    type: String,
    required: true
  }
});

const PushCredentials = mongoose.model('PushCredentials', pushCredentialSchema);

/**
 * Endpoints
 */
router.get('/credentials', (request, response, next) => {
  if (request.query.key !== API_KEY) return response.json({authenticated: false});

  PushCredentials.find((err, allPushCredentials) => {
    response.json(allPushCredentials);
  });
});

router.get('/pushAll', (request, response, next) => {
  if (request.query.key !== API_KEY) return response.json({authenticated: false});
  const pushPayload = {
    text: request.query.text || "RevolutionUC",
    icon: request.query.icon || "https://revolutionuc.com/imgs/revuc@144.png"
  }

  PushCredentials.find((err, allPushCredentials) => {

    /**
     * Map mongoose object that looks like
     * {_id: 0, auth: a, p256dh: b, endpoint: c} to
     * {keys: {auth: a, p256dh: b}, endpoint: c}
     */
    allPushCredentials = allPushCredentials.map(x => ({keys: {auth: x.auth, p256dh: x.p256dh}, endpoint: x.endpoint}));

    allPushCredentials.forEach(pushCredentials => {

      webPush.sendNotification(pushCredentials, JSON.stringify(pushPayload))
        .then(resp => console.log, err => {
          console.error(err);
          if (err.statusCode == '410') { // Credentials are no longer valid, push noficiation cannot be sent
            // Remove invalid credentials from database
            PushCredentials.remove({endpoint: pushCredentials.endpoint}, console.error);
          }
        });

    }); // end forEach()

  }) // end PushCredentials.find()

  response.sendStatus(201);
});

/* POST subscription data */
router.post('/subscribe', (request, response, next) => {
  PushCredentials.find({endpoint: request.body.endpoint}, (err, client) => {

    console.log(client);

    if (!client.length) {
      const newPushCredentials = {
        endpoint: request.body.endpoint,
        p256dh: request.body.p256dh,
        auth: request.body.auth
      };

      console.log(newPushCredentials);

      const newClient = new PushCredentials(newPushCredentials);

      newClient.save((error, savedClient) => {
        if (error) {
          return response.status(500).send(error);
        }

        response.sendStatus(201);
      });
    }

  }); // end PushCredentials.find()
});

module.exports = router;
