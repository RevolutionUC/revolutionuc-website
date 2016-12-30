/**
 * App.js
 */

import { Router } from './modules/Router';

class App {
  constructor() {
    this._router = new Router();
    this._registerServiceWorker();
  }

  _registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      console.warn('About to load the service worker yay');
      navigator.serviceWorker.register('/sw.js', {scope: '/'});
    }
  }
}

new App();
