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
  phoneNumber: {
    type: String,
    required: true
  },
  school: {
    type: String,
    required: true
  },
  schoolOther: {
    type: String,
    default: "off"
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
  },
  receivedInfoEmail3: {
    type: Boolean,
    default: false
  },
  receivedMinorInfoEmail: {
    type: Boolean,
    default: false
  }
});

const Registrant = mongoose.model('Registrant', registrantScheme);

module.exports = {Registrant};
