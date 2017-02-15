/**
 * Registration validator
 */

const util = require('util');

module.exports = request => {
  // Must pull request.file (resume) into request.body parameter for later validation
  request.body.resume = request.file;

  const emptyErrorMessage = 'must not be empty';
  request.checkBody('firstName', `First name ${emptyErrorMessage}`).notEmpty();
  request.checkBody('lastName', `Last name ${emptyErrorMessage}`).notEmpty();
  request.checkBody('email', `Email ${emptyErrorMessage}`).notEmpty();
  request.checkBody('school', `School ${emptyErrorMessage}`).notEmpty();
  request.checkBody('major', `Major ${emptyErrorMessage}`).notEmpty();
  request.checkBody('education', `Education ${emptyErrorMessage}`).notEmpty();
  request.checkBody('gender', `Gender ${emptyErrorMessage}`).notEmpty();
  request.checkBody('ethnicity', `Ethnicity ${emptyErrorMessage}`).notEmpty();
  request.checkBody('phoneNumber', `Phone number ${emptyErrorMessage}`).notEmpty();
  request.checkBody('shirtSize', `Shirt size ${emptyErrorMessage}`).notEmpty();
  request.checkBody('dob', `Date Of birth ${emptyErrorMessage}`).notEmpty();

  const errors = request.validationErrors();
  return errors;
}
