const mongoose = require('mongoose');


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
    type: String
  }
});

module.exports = mongoose.model('Registrant', registrantScheme);