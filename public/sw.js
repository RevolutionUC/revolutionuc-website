'use strict';

const version = 'V1';

self.addEventListener('install', function(event) {
  self.skipWaiting();
  console.log('Installed', event);
});

self.addEventListener('activate', function(event) {
  console.log('Activated', event);
});

 self.addEventListener('push', function(event) {
   console.log('Push message', event);
   console.log(event.data);

  let notificationTitle = 'RevolutionUC Live';
  let notificationText = 'You\'ve recieved a notification';
  let notificationIcon = 'https://unsplash.it/200/200?random';

  if (event.data) {

    try {
      let payload = event.data.json();
      notificationText = payload.text;
      notificationIcon = payload.icon;
    } catch (error) {
      notificationText = event.data.text();
    }

  }

  const notificationOptions = {
    body: notificationText,
    icon: notificationIcon,
    tag: 'notify-sw',
    data: {
      url: 'https://revolutionuc.com/schedule'
    }
  };

   event.waitUntil(
     self.registration.showNotification(notificationTitle, notificationOptions)
   );
 });

self.addEventListener('notificationclick', function(event) {
  console.log('Notification click: tag', event.notification.tag);
  // Android doesn't close the notification when you click it
  // See http://crbug.com/463146
  event.notification.close();
  let url = 'https://revolutionuc.com/schedule';
  // Check if there's already a tab open with this URL.
  // If yes: focus on the tab.
  // If no: open a tab with the URL.
  event.waitUntil(
    clients.matchAll({
      type: 'window'
    })
    .then(function(windowClients) {
      console.log('WindowClients', windowClients);
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        console.log('WindowClient', client);
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
