/**
 * App.js
 */

import './sass/master.scss';

import { Router } from './modules/Router';
import { PushNotifications } from './modules/PushNotifications';

class App {
  constructor() {
    this._router = new Router();
    this._registerServiceWorker();
    document.querySelector('nav').addEventListener('click', function() {
      document.querySelector('input[type="checkbox"]').click();
    });
  }

  _registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      console.warn('About to load the service worker yay');
      navigator.serviceWorker.register('/sw.js', {scope: '/'})
        .then(registration => {
          new PushNotifications(registration);
        });
    }
  }
}

new App();
