importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDbm_Omf6O5OVoWulA6KaJjyDBr5V2Vy6A',
  authDomain: 'chat-app-testing-234fc.firebaseapp.com',
  projectId: 'chat-app-testing-234fc',
  storageBucket: 'chat-app-testing-234fc.firebasestorage.app',
  messagingSenderId: '1024725461365',
  appId: '1:1024725461365:web:3381b37b2593781ff38b3c'
});

const messaging = firebase.messaging();

// Handle background messages - SIMPLE & RELIABLE
messaging.onBackgroundMessage((payload) => {
  console.log('📨 Background message received');
  
  // ALWAYS use data from payload (more reliable)
  const title = payload.data?.title || 'New Message';
  const body = payload.data?.body || 'You have a new message';
  const chatId = payload.data?.chatId;

  const notificationOptions = {
    body: body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: { 
      chatId: chatId,
      url: chatId ? `https://chat-app-nextjs-gray-eta.vercel.app/chat/${chatId}` : 'https://chat-app-nextjs-gray-eta.vercel.app/chat'
    },
    tag: 'chat-message',
    requireInteraction: false
  };

  console.log('🔄 Showing notification:', title);
  return self.registration.showNotification(title, notificationOptions);
});

// Handle notification click - WORKING REDIRECT
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked');
  event.notification.close();

  const chatId = event.notification.data?.chatId;
  const url = event.notification.data?.url || 'https://chat-app-nextjs-gray-eta.vercel.app/chat';

  console.log('🔗 Opening:', url);

  // SIMPLE & RELIABLE REDIRECT
  event.waitUntil(
    clients.openWindow(url)
  );
});