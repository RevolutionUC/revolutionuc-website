// const mongoose = require('mongoose');
// const MONGO_URL = process.env.MONGO_URL;
// mongoose.connect(MONGO_URL);

// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function() {
//   console.log(`We're connected now`);
// });

// const registrantScheme = mongoose.Schema({
//   firstName: String,
//   lastName: String,
//   email: String
// });

// const Registrant = mongoose.model('Registrant', registrantScheme);

// const newRegistrant = new Registrant(newPushCredentials);
// console.log("about to save ==> ", newPushCredentials);
// newCredential.save(function (err, newCredential) {
// if (err) return console.error(err);
// });

module.exports = (request, response) => {
  console.log(request.body);
}
