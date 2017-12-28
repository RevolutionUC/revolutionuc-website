# revolutionuc-website

[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/RevolutionUC/revolutionuc-website.svg?branch=master)](https://travis-ci.org/RevolutionUC/revolutionuc-website)
[![Dependency Status](https://david-dm.org/RevolutionUC/revolutionuc-website.svg)](https://david-dm.org/revolutionuc/revolutionuc-website)
[![devDependency Status](https://david-dm.org/RevolutionUC/revolutionuc-website/dev-status.svg)](https://david-dm.org/revolutionuc/revolutionuc-website#info=devDependencies)
[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

Spring 2018 (and possibly future) RevolutionUC University hackathon backend. Written in Node.js.

For the front end repository, visit [RevolutionUC/revolutionuc-frontend](https://github.com/RevolutionUC/revolutionuc-frontend).

# Development

> Better docs coming soon...

```sh
git clone git@github.com:revolutionuc/revolutionuc-website.git
cd revolutionuc-website
npm install
cp .env.example .env
# get environment variables from someone with write access
npm run dev
```

Navigate to `http://localhost:8080` in a browser.

# Deploying

If you have push access to the DO droplet, you can deploy the site by running:

```sh
git remote add dokku dokku@revolutionuc.com:revolutionuc.com
git push dokku master # this deploys the app
```

### Tests

If necessary, please write tests for your contributions. End-to-end tests can be found in and/or added to `test/e2e.js`. If you have a test that is not end-to-end you can add it to or create the appropriate file in the `test` folder.

Running tests:

```sh
npm test
```

Happy contributing.
