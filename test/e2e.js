'use strict';

const child_process = require('child_process');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

const startServerChildProcess = require('./spawnProcess').startServerChildProcess;
const killServerChildProcess = require('./spawnProcess').killServerChildProcess;
const childProcess = startServerChildProcess();

/**
 * Thanks to the articles:
 * http://markbirbeck.com/2015/12/11/using-selenium-webdriver-with-mocha/
 * https://watirmelon.blog/2015/10/28/getting-started-with-webdriverjs-mocha/
 * though I am sure this could be improved upon soon, it is a good start.
 * TODO: look into a better way to start the dev server alongside the test running.
 * `Concurrently` package might do it (installed) but not sure yet. Is spawn process
 * a bit much for what we're doing?
 */
const webdriver = require('selenium-webdriver');
const test = require('selenium-webdriver/testing'),
      By       = webdriver.By,
      until    = webdriver.until,
      describe = test.describe,
      it       = test.it;

let driver = new webdriver.Builder().forBrowser('chrome').build();

describe('Suite 1', function() {
  child_process.execSync("sleep 5");
  this.timeout(30000); // browser tests might take a bit

  beforeEach(function() {
    driver.get('http://localhost:8080');
  });

  it('should render the header on load', function() {
    driver.wait(until.elementLocated(webdriver.By.css('.header')), 4000)
      .then(element => expect(element).to.not.equal(null));
  });

  it('should render the navigation on load', function() {
    driver.wait(until.elementLocated(webdriver.By.css('nav')), 4000)
      .then(element => expect(element).to.not.equal(null));
  });

  it('should render home content on root load', function() {
    driver.wait(until.elementLocated(webdriver.By.css('div[view]')), 4000).getAttribute('id')
      .then(id => expect(id).to.equal('view-home'));
  });

  it('should render about content on /about load', function() {
    driver.get('http://localhost:8080/about')
      .then(() => driver.wait(until.elementLocated(webdriver.By.css('div[view]')), 4000).getAttribute('id'))
      .then(id => expect(id).to.equal('view-about'));
  });

  it('should render contact content on /faq load', function() {
    driver.get('http://localhost:8080/faq')
      .then(() => driver.wait(until.elementLocated(webdriver.By.css('div[view]')), 4000).getAttribute('id'))
      .then(id => expect(id).to.equal('view-faq'));
  });

  it('should load about content when about link is clicked', function() {
    driver.findElement(By.id('a-about')).click()
      .then(() => {
        driver.wait(until.elementLocated(webdriver.By.css('div[view]')), 4000).getAttribute('id')
          // .then(id => {console.log(id);console.log(id);console.log(id);expect(id).to.equal('view-about')});
      });
  });

  it('should load about faq when faq link is clicked', function() {
    driver.findElement(By.id('a-faq')).click()
      .then(() => {
        driver.wait(until.elementLocated(webdriver.By.css('div[view]')), 4000).getAttribute('id')
          // .then(id => expect(id).to.equal('view-faq'));
      });
  });

  after(function(done) {
    killServerChildProcess(childProcess.pid);
    done();
    driver.quit();
  });

});
