module.exports = class Live {
  static init() {
    console.log('Live::init()');
    const script = document.createElement('script');
    script.src = '//platform.twitter.com/widgets.js';
    document.body.appendChild(script);
  }
};
