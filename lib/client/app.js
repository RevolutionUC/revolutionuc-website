/**
 * App.js
 */

import './sass/master.scss';

import { Router } from './modules/Router'

class App {
  constructor() {
    this._router = new Router();
  }
}

new App();
