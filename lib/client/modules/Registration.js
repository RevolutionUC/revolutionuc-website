module.exports = class Registration {
  static init() {
    console.log('Registration::init()');
    if (!document.querySelector('form')) return; // temporary
    this._dataSharingBox = document.querySelector('input[name=dataSharing]');
    this._codeOfConductBox = document.querySelector('input[name=codeOfConduct]');
    this._formElement = document.querySelector('form');
    this._submitButton = document.querySelector('form input[type=submit]')

    this._dataSharingBox.addEventListener('change', this._checkChange.bind(this));
    this._codeOfConductBox.addEventListener('change', this._checkChange.bind(this));
    this._formElement.addEventListener('submit', this._onSubmit.bind(this));

    this._labels = [
      'firstName',
      'lastName',
      'shirtSize',
      'email',
      'school',
      'major',
      'dob',
      'phoneNumber',
      'education',
      'gender',
      'resume'
    ];
  }

  static _onSubmit(e) {
    console.log('Registration::_onSubmit');
    e.preventDefault();

    fetch('/api/v1/registration/register', {
	    method: 'POST',
	    body: new FormData(this._formElement)
    })
    .then(response => {
      this._updateFormUI(response);
    })
  }

  static _updateFormUI(response) {
    console.log(`Response status: ${response.status}`);
    if (response.status != 200 && response.status != 201) {
      // Bad news bears
      response.json().then(jsonErrors => {
        this._updateLabels(jsonErrors);
      });
    } else {
      // ...Good news bears
      this._cleanDirtyLabels(this._labels);
      this._removeEmailRegisteredWarning();
      window.location.pathname = 'check-email';
    }
  }

  static _updateLabels(jsonErrors) {
    for (let error of jsonErrors) {
      document.querySelector(`label[for=${error.param}]`).classList.add('error');
      if (error.param == 'email' && error.msg.includes('registered')) { // email address has already been registered
        this._addEmailRegisteredWarning();
      }
    }

    Array.prototype.diff = function(a) {
      return this.filter(function(i) {return a.indexOf(i) < 0;});
    };

    this._cleanDirtyLabels(this._labels.diff(jsonErrors.map(elem => elem.param)));
  }

  static _cleanDirtyLabels(labelsArray) {
    let labelElement;
    for (let label of labelsArray) {
      labelElement = document.querySelector(`label[for=${label}]`);
      labelElement.classList.remove('error');
      if (label == 'email' && labelElement.innerText.includes('registered')) {
        this._removeEmailRegisteredWarning();
      }
    }
  }

  static _addEmailRegisteredWarning() {
    const emailLabel = document.querySelector('label[for=email');
    if (!emailLabel.innerText.includes('registered')) {
      emailLabel.innerText = 'Email has already been registered';
    }
  }

  static _removeEmailRegisteredWarning() {
    const emailLabel = document.querySelector('label[for=email');
    if (emailLabel.innerText.toLowerCase().includes('registered')) {
      emailLabel.innerText = 'Email*';
    }
  }

  static _checkChange() {
    if (this._codeOfConductBox.checked && this._dataSharingBox.checked) {
      this._submitButton.disabled = false;
    } else {
      this._submitButton.disabled = true;
    }
  }
}
