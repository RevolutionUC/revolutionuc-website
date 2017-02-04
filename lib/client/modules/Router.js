export class Router {
  constructor() {

    this._newContent = null;
    this._newContentPromise = Promise.resolve();
    this._viewElement = document.querySelector('section.view-content');
    this._mastHead = this._viewElement.querySelector('div.masthead');
    this._viewContent = this._viewElement.querySelector('div[view]');
    this._isAnimatingOut = false;
    this._isAnimatingIn = false;
    this._spinnerTimeout = 0;
    this._currentPath = window.location.pathname;

    this._bootstrapNavigation();
    this._onChanged();

    // Load any async scripts the initial route depends on
    this._loadAsyncScripts();
  }

  _queueSpinner() {
    this._spinnerTimeout = setTimeout(() => {
      document.body.classList.add('view-pending');
    }, 500);
  }

  _hideSpinner() {
    document.body.classList.remove('view-pending');
    clearTimeout(this._spinnerTimeout);
  }

  _onChanged() {
    console.log(`Router::_onChanged(${window.location.pathname})`);

    if (this._currentPath === window.location.pathname) {
      console.log('Bumping request');
      return Promise.resolve();
    }

    this._currentPath = window.location.pathname;

    this._newContentPromise = this._loadAsyncView();

    if (this._isAnimatingOut) {
      console.log(' Either animating out or loading still - sorry');
      return Promise.resolve();
    }

    this._isAnimatingOut = true;
    return this._animateOut().then(() => {
      console.log('Router::_animateOut() complete');
      this._isAnimatingOut = false;
      return this._newContentPromise;
    }).then(() => {
      console.log(`Router::_loadAsyncView() complete`);
      window.scrollTo(0, 0);
      this._swapContents();
      this._animatingIn = true;
      return this._animateIn();
    }).then(() => {
      console.log('Router::_animateIn() complete');
      this._animatingIn = false;
      this._bootstrapBodyNavLinks();
      return this._loadAsyncScripts();
    }).catch(error => {
      console.error(error);
    });
  }

  _swapContents() {
    // Find new mastHead, new mastHead title div, and new view div
    const newMastHead = this._newContent.querySelector('div.masthead');
    const newMastHeadTitle = newMastHead.querySelector('div.masthead-title');
    const newViewContent = this._newContent.querySelector('div[view]');

    // Strip and swap mastHead styles, mastHead title div, and view div content
    this._mastHead.style.cssText = newMastHead.style.cssText;
    this._mastHead.querySelector('div.masthead-title').innerHTML = newMastHeadTitle.innerHTML;
    this._viewContent.innerHTML = newViewContent.innerHTML;

    // Swap IDs over
    this._viewContent.id = newViewContent.id;
  }

  _loadAsyncView() {
    console.log(`Router::_loadAsyncView(${this._currentPath})`);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.onload = evt => {
        this._newContent = evt.target.response.querySelector('*');
        resolve();
      };

      xhr.onerror = reject;

      xhr.responseType = 'document';
      console.log(`XHR open ${this._currentPath}?partial`)
      xhr.open('GET', `${this._currentPath}?partial`);
      xhr.send();
    });
  }

  _loadAsyncScripts() {
    console.log('Router::_loadAsyncScripts()');
    return new Promise((resolve, reject) => {
      if (window.location.pathname == '/') {
        require.ensure(['./Registration'], require => {
          // Pass in 'this' router as a dependency so the module can provide animated routing
          resolve(require('./Registration').init(this));
        });
      }
    });
  }

  _animateIn() {
    console.log('Router::_animateIn()');
    this._hideSpinner();

    return new Promise((resolve, reject) => {
      const onTransitionEnd = () => {
        this._viewElement.removeEventListener('transitionend', onTransitionEnd);
        resolve();
      };

      this._viewElement.classList.add('visible');
      this._viewElement.addEventListener('transitionend', onTransitionEnd);
    });
  }

  _animateOut() {
    console.log(`Router::_animateOut()`);
    if (document.body.classList.contains('view-pending')) {
      console.log('Already pending - not going to anim out');
      return Promise.resolve();
    }
    this._queueSpinner();

    return new Promise((resolve, reject) => {
      const onTransitionEnd = () => {
        this._viewElement.removeEventListener('transitionend', onTransitionEnd);
        resolve();
      };

      this._viewElement.classList.remove('visible');
      this._viewElement.addEventListener('transitionend', onTransitionEnd);

    });
  }

  go(url) {
    window.history.pushState(null, null, url);
    return this._onChanged();
  }

  _bootstrapNavigation() {
    // Finds all elements
    this._bootstrapHeaderNavLinks();
    this._bootstrapBodyNavLinks();
  }

  _bootstrapHeaderNavLinks() {
    window.addEventListener('popstate', this._onChanged.bind(this));
    Array.prototype.forEach.call(document.querySelectorAll('header li[router-link]'), link => {
      console.log('Attaching listener to header nav link');

      // Plain old li click listener
      link.addEventListener('click', evt => {
        this.go(evt.target.firstChild);
      });

      /**
       * If the user clicks a link inside a list item
       * that link will be the `.target` of the event
       * passed into the onClick function - however we
       * always want to call onClick with the list item
       * as the event target so we can get its firstChild's
       * href
       */
      link.firstChild.addEventListener('click', evt => {
        evt.preventDefault();
        evt.stopPropagation(); // prevents us from triggering li click again on bubble stage
        link.click();
      });
    });
  }

  _bootstrapBodyNavLinks() {
    Array.prototype.forEach.call(document.querySelectorAll('div[view] *[router-link]'), link => {
      console.log('Attaching listener to body nav link');

      link.addEventListener('click', evt => {
        // Cannot use evt.target.firstChild because the
        // first child in a div with any whitespace is the
        // #text node. Use css selector intead
        this.go(evt.target.querySelector(':first-child'));
      });

      link.firstChild.addEventListener('click', evt => {
        evt.preventDefault();
        evt.stopPropagation();
        link.click();
      });
    });
  }
}
