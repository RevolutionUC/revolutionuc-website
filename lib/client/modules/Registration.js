class Registration {
  static init() {
    console.log('Registration::init()');
    this._formElement = document.querySelector('form');
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
    }
  }

  static _updateLabels(jsonErrors) {
    for (let error of jsonErrors) {
      document.querySelector(`label[for=${error.param}]`).classList.add('error');
    }

    Array.prototype.diff = function(a) {
      return this.filter(function(i) {return a.indexOf(i) < 0;});
    };

    this._cleanDirtyLabels(this._labels.diff(jsonErrors.map(elem => elem.param)));
  }

  static _cleanDirtyLabels(labelsArray) {
    for (let label of labelsArray) {
      document.querySelector(`label[for=${label}]`).classList.remove('error');
    }
  }
}

Registration.init();
