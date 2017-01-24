class Registration {
  static init() {
    console.log('Registration::init()');
    this._formElement = document.querySelector('form');
    this._firstNameControl = document.querySelector('input[name=firstName]');
    this._lastNameControl = document.querySelector('input[name=lastName]');
    this._emailControl = document.querySelector('input[name=email]');
    this._registrationSubmit = document.querySelector('input[type=submit]');

    this._registrationSubmit.addEventListener('click', this._onSubmit.bind(this));
  }

  static _onSubmit(e) {
    e.preventDefault();

    fetch('/api/v1/registration/register', {
	    method: 'POST',
	    body: new FormData(this._formElement)
    });
  }
}

Registration.init();
