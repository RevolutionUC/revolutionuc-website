class Registration {
  static init() {
    console.log('Registration::init()');
    this._formElement = document.querySelector('form');
    this._firstNameControl = document.querySelector('input[name=firstName]');
    this._lastNameControl = document.querySelector('input[name=lastName]');
    this._emailControl = document.querySelector('input[name=email]');
    this._registrationSubmit = document.querySelector('input[type=submit]');

    this._formElement.addEventListener('submit', this._onSubmit.bind(this));
  }

  static _onSubmit(e) {
    e.preventDefault();

    this._formElement.classList.toggle('hide');

    fetch('/api/v1/registration/register', {
	    method: 'POST',
	    body: new FormData(this._formElement)
    })
    .then(response => {
      this._formElement.classList.toggle('hide');
      this._updateFormUI(response);
    })
  }

  static _updateFormUI(response) {
    console.log(`Response status: ${response.status}`);
    if (response.status != 200 && response.status != 201) {
      // Bad news bears
      this._formElement.classList.toggle('error');
    } else {
      // ...Good news bears
      this._formElement.classList.toggle('success');
    }
  }
}

Registration.init();
