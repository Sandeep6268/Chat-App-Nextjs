// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDbm_Omf6O5OVoWulA6KaJjyDBr5V2Vy6A",
  authDomain: "chat-app-testing-234fc.firebaseapp.com",
  projectId: "chat-app-testing-234fc",
  storageBucket: "chat-app-testing-234fc.firebasestorage.app",
  messagingSenderId: "1024725461365",
  appId: "1:1024725461365:web:3381b37b2593781ff38b3c"
});

const messaging = firebase.messaging();

// Background messages handle karo
messaging.onBackgroundMessage((payload) => {
  console.log('📩 Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/icon.png',
    badge: '/badge.png'
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});