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

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('📨 Received background message:', payload);

  // Use data from payload if notification is not available
  const title = payload.data?.title || payload.notification?.title || 'New Message';
  const body = payload.data?.body || payload.notification?.body || 'You have a new message';
  const chatId = payload.data?.chatId;

  const notificationOptions = {
    body: body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: payload.data || { chatId: chatId },
    tag: chatId || 'general-chat',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open',
        title: 'Open Chat'
      }
    ]
  };

  console.log('🔄 Showing notification:', title);
  self.registration.showNotification(title, notificationOptions);
});

// Handle notification click - SIMPLE & WORKING
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked');
  event.notification.close();

  const chatId = event.notification.data?.chatId;
  let url = 'https://chat-app-nextjs-gray-eta.vercel.app/chat';
  
  if (chatId && chatId !== 'undefined' && chatId !== 'test-chat-id') {
    url = `https://chat-app-nextjs-gray-eta.vercel.app/chat/${chatId}`;
  }

  console.log('🔗 Redirecting to:', url);

  // SIMPLE REDIRECT - Always open the URL
  event.waitUntil(
    clients.openWindow(url)
  );
});