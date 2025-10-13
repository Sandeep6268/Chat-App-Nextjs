// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:"AIzaSyDbm_Omf6O5OVoWulA6KaJjyDBr5V2Vy6A",
  authDomain:"chat-app-testing-234fc.firebaseapp.com",
  projectId:"chat-app-testing-234fc",
  messagingSenderId:"1024725461365",
  appId:"1:1024725461365:web:3381b37b2593781ff38b3c",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("📩 Received background message ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    // icon: "/icon-192x192.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
