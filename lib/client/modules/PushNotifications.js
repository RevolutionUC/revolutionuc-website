export class PushNotifications {
  constructor(serviceWorkerRegistration) {
    console.log('PushNotifications::constructor()');
    this.registration = serviceWorkerRegistration;
    this.subscription = null;

    this.isSubscribed = false;
    this.supportsPayload = false;

    this.endpoint = '';
    this.deviceToken = '';
    this.pubKey = '';
    this.authSecret = '';

    // Elements
    try {
      this.subscribeButton = document.getElementById('subscribe-button');
    } catch (error) {

    }

    try {
      this.subscribeButton.addEventListener('click', () => {
        if (this.isSubscribed) this.unsubscribe();
        else this.subscribe();
      });
    } catch (error) {

    }

    this.attemptToReviveExistingSubscription();
  }

  notifyHandler() {
    console.log('notifyAll()');
    this.notifyAll();
  }

  notifyAll() {
    let url = new URL('/pushAll');
    let params = {text: this.notifyAllMessage.value, icon: this.notifyAllIcon.value};

    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    fetch(url).then(() => {
      console.log('Notifying all that support payload!');
    }).catch(console.log);
  }

  attemptToReviveExistingSubscription() {
    console.log("reviveSubscriptionDetails()");

    this.registration.pushManager.getSubscription().then(serviceWorkerSubscription => {
      this.subscription = serviceWorkerSubscription;
      if (this.subscription) {
        this.isSubscribed = true;
        this.buildValuesFromSubscription();
      }
      this.updateUI();
    });
  }

  buildValuesFromSubscription() {
    console.log('buildValuesFromSubscription()');

    if (this.subscription) {
      this.endpoint = this.subscription.endpoint;

      if (this.subscription.getKey) {
        this.supportsPayload = true;

        let rawPubKey = this.subscription.getKey('p256dh');
        let rawAuthSecret = this.subscription.getKey('auth');

        this.pubKey = rawPubKey ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawPubKey))) : null;
        this.authSecret = rawAuthSecret ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawAuthSecret))) : null;
      } else {
        console.log('A true American shame...your browser does not support payload encrypted push notifications');
      }
    }
  }

  updateUI() {
    console.log("updateUI()");
    if (this.registration) this.subscribeButton.setAttribute('disabled', false);

    if (this.isSubscribed) {
      console.log("Subscribed");
      this.subscribeButton.innerText = 'Unsubscribe from notifications';
    } else {
      console.log('Not subscribed');
      this.subscribeButton.innerText = 'Subscribe to notifications';
    }
  }

  subscribe() {
    console.log("subscribe()");

    this.registration.pushManager.subscribe({userVisibleOnly: true}).then(serviceWorkerSubscription => {
      this.subscription = serviceWorkerSubscription;
      if (this.subscription) {
        this.isSubscribed = true;
        this.buildValuesFromSubscription();
      }

      console.log('Subscribed! Endpoint:', this.endpoint);

      if (this.supportsPayload) {
        console.log('Public key: ', this.pubKey);
        console.log('Private key: ', this.authSecret);
        this.sendEncryptionInformationToServer();
      }

      // Update UI
      this.updateUI();
    });
  }

  sendEncryptionInformationToServer() {
    console.log("sendEncryptionInformationToServer()");
    let fetchOptions = {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({
        endpoint: this.endpoint,
        p256dh: this.pubKey,
        auth: this.authSecret
      })
    };

    fetch('/api/v1/notification/subscribe', fetchOptions).then(response => {
      if (response.status >= 400 && response.status < 500) {
        console.log('Failed web push response: ', response, response.status);
        throw new Error('Failed to send push message via web push protocol');
      }
    }).catch(console.log);
  }

  unsubscribe() {
    this.subscription.unsubscribe().then(event => {
      console.log('Unsubscribed!', event);
      this.isSubscribed = false;
      this.supportsPayload = false;
      this.updateUI();
    }).catch(console.log);
  }

}
