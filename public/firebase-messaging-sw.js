importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// 🔥 NEW TESTING PROJECT CONFIG
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

  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: payload.data || {},
    tag: payload.data?.chatId || 'chat-notification', // Important for mobile
    renotify: true,
    requireInteraction: false,
    // Mobile-specific options
    actions: [
      {
        action: 'open',
        title: 'Open Chat',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/icon-192x192.png'
      }
    ],
    // Vibration pattern for mobile
    vibrate: [200, 100, 200]
  };

  // Add image if available (for mobile rich notifications)
  if (payload.data?.imageUrl) {
    notificationOptions.image = payload.data.imageUrl;
  }

  console.log('🔄 Showing notification:', notificationTitle);
  
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click - FIXED REDIRECT
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification click received:', event);
  
  event.notification.close();

  // Get chatId from notification data
  const chatId = event.notification.data?.chatId;
  console.log('📍 Chat ID from notification:', chatId);
  
  let url;
  if (chatId && chatId !== 'undefined' && chatId !== 'test-chat-id') {
    url = `https://chat-app-nextjs-gray-eta.vercel.app/chat/${chatId}`;
  } else {
    url = 'https://chat-app-nextjs-gray-eta.vercel.app/chat';
  }

  console.log('🔗 Redirecting to:', url);

  event.waitUntil(
    clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    }).then((clientList) => {
      console.log('🪟 Found clients:', clientList.length);
      
      // Check if chat window is already open
      for (const client of clientList) {
        console.log('🔍 Checking client:', client.url);
        if (client.url.includes('/chat') && 'focus' in client) {
          console.log('✅ Focusing existing chat window');
          return client.focus();
        }
      }
      
      // Open new window if none exists
      if (clients.openWindow) {
        console.log('🆕 Opening new window to:', url);
        return clients.openWindow(url);
      }
    }).catch(error => {
      console.error('❌ Error in notification click:', error);
      // Fallback: always open the URL
      return clients.openWindow(url);
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('❌ Notification closed:', event.notification.tag);
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('🔄 Push subscription changed:', event);
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'BGVsvUWSIEz1COSECmWhy0IkVmiNWC2Zfq5D4Cx-cGlWImCum46BL7Ce8KESD5wLQFagtd-UlHD72_RS7PFk2ZY'
    }).then((subscription) => {
      console.log('✅ New subscription:', subscription);
      // You might want to send this to your server
    })
  );
});