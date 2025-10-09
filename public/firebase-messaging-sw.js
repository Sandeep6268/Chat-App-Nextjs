importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAabTzeCwbsnkgWE7d2y4_aAvDlyXv_QUo",
  authDomain: "whatsapp-clone-69386.firebaseapp.com",
  projectId: "whatsapp-clone-69386",
  storageBucket: "whatsapp-clone-69386.firebasestorage.app",
  messagingSenderId: "580532933743",
  appId: "1:580532933743:web:d74eca375178f6a3c2699a"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

console.log('✅ [SW] Service Worker Loaded - Mobile Fix');

// ✅ FIXED: Background message handler for both mobile & desktop
messaging.onBackgroundMessage((payload) => {
  console.log('📬 [SW] Background message received:', payload);
  
  // Extract data from both places for compatibility
  const notificationTitle = payload.data?.title || payload.notification?.title || 'New Message';
  const notificationBody = payload.data?.body || payload.notification?.body || 'You have a new message';
  const data = payload.data || {};
  
  // Build target URL - Mobile compatible
  const baseUrl = 'https://chat-app-nextjs-gray-eta.vercel.app';
  let targetUrl = `${baseUrl}/`;
  
  if (data.chatId) {
    targetUrl = `${baseUrl}/chat/${data.chatId}`;
  }

  console.log('📍 [SW] Target URL for mobile:', targetUrl);

  const notificationOptions = {
    body: notificationBody,
    image: '/icon-512.png', // ✅ Added for mobile
    tag: `chat-${data.chatId || 'general'}`,
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200], // ✅ Vibration for mobile
    data: {
      ...data,
      targetUrl: targetUrl,
      click_action: targetUrl // ✅ Important for mobile
    },
    actions: [
      {
        action: 'open-chat',
        title: '💬 Open Chat'
      },
      {
        action: 'dismiss',
        title: '❌ Dismiss'
      }
    ]
  };

  // Show notification
  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

// ✅ FIXED: Mobile-compatible notification click
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 [SW] Notification clicked on:', self.clientInformation ? 'Desktop' : 'Mobile');
  event.notification.close();

  const notificationData = event.notification.data || {};
  let targetUrl = notificationData.targetUrl || notificationData.click_action || 'https://chat-app-nextjs-gray-eta.vercel.app/';

  console.log('📍 [SW] Mobile navigating to:', targetUrl);

  event.waitUntil(
    clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    }).then((clientList) => {
      // Focus existing tab or open new one
      for (const client of clientList) {
        if (client.url.includes('chat-app-nextjs') && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      
      // Open new window - mobile compatible
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});