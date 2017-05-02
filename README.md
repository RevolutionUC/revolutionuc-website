# revolutionuc-website

[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)
[![build status](https://api.travis-ci.org/RevolutionUC/revolutionuc-website.svg?branch=master)](https://api.travis-ci.org/revolutionuc/revolutionuc-website.svg?branch=master)
[![Dependency Status](https://david-dm.org/RevolutionUC/revolutionuc-website.svg)](https://david-dm.org/revolutionuc/revolutionuc-website)
[![devDependency Status](https://david-dm.org/RevolutionUC/revolutionuc-website/dev-status.svg)](https://david-dm.org/revolutionuc/revolutionuc-website#info=devDependencies)
[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

Spring 2017 (and possibly future) RevolutionUC University hackathon website "framework". See [v1.2.0](https://github.com/RevolutionUC/revolutionuc-website/tree/v1.2.0) for the Spring 2017 site.

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

# Contributing

> Better description on how the code is structured coming soon... (discuss .env file)

If you're using VSCode, by default it will not recognize files with the `.ejs` extension. Place the following code in `File -> Preferences -> User Settings` to overwrite the default settings
```js
{
    // Configure file-language associations (e.g. "*.extension": "html"). These have precedence over the default associations of the languages installed.
    "files.associations": {"*.ejs": "html"}
}
```

Just about all contributions (with the exception of hot-fixes and other small things) should have an associated branch and pull request, and if the contribution is substantial please open an issue so we can discuss the best way to go about something before a bunch of code is written.

### Tests

If necessary, please write tests for your contributions. End-to-end tests can be found in and/or added to `test/e2e.js`. If you have a test that is not end-to-end you can add it to or create the appropriate file in the `test` folder.

Running tests:

```sh
npm test
```

Happy contributing.
