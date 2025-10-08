// public/firebase-messaging-sw.js - UPDATED UNIFIED FORMAT
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

console.log('✅ [SW] Service Worker Loaded - Unified Notification Format');

// ✅ FIXED: Unified background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('📬 [SW] Background message received:', payload);
  
  // Extract data from payload (handle both formats)
  const data = payload.data || {};
  const notificationTitle = data.title || payload.notification?.title || 'New Message';
  const notificationBody = data.body || payload.notification?.body || 'You have a new message';
  
  // Get target URL
  const baseUrl = self.location.origin;
  let targetUrl = `${baseUrl}/`;
  
  if (data.chatId) {
    targetUrl = `${baseUrl}/chat/${data.chatId}`;
  } else if (data.url) {
    targetUrl = data.url;
  } else if (data.click_action) {
    targetUrl = data.click_action;
  }

  console.log('📍 [SW] Target URL:', targetUrl);

  // ✅ UNIFIED NOTIFICATION OPTIONS
  const notificationOptions = {
    body: notificationBody,
    icon: '/icon-192.png',
    badge: '/badge-72x72.png',
    image: '/icon-512.png', // For platforms that support large images
    tag: `chat-${data.chatId || 'general'}`,
    renotify: true,
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200], // vibration pattern
    data: {
      ...data,
      targetUrl: targetUrl,
      timestamp: new Date().toISOString()
    },
    // ✅ SIMPLIFIED ACTIONS - Remove extra buttons
    actions: [
      {
        action: 'open',
        title: '💬 Open Chat',
        icon: '/icon-192.png'
      }
    ]
  };

  // Close any existing notifications with same tag
  self.registration.getNotifications({ tag: notificationOptions.tag })
    .then(notifications => {
      notifications.forEach(notification => notification.close());
      
      // Show new notification
      return self.registration.showNotification(notificationTitle, notificationOptions);
    })
    .catch(error => {
      console.error('❌ [SW] Error showing notification:', error);
    });
});

// ✅ FIXED: Unified notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 [SW] Notification clicked - Action:', event.action);
  event.notification.close();

  const notificationData = event.notification.data || {};
  let targetUrl = notificationData.targetUrl || self.location.origin + '/';

  console.log('📍 [SW] Navigating to:', targetUrl);

  event.waitUntil(
    clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    }).then((clientList) => {
      console.log(`🔍 Found ${clientList.length} client windows`);
      
      // Check for existing tabs/windows
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          console.log('🎯 Focusing existing client:', client.url);
          
          // Navigate to target URL if different
          if (client.url !== targetUrl && 'navigate' in client) {
            console.log('🔄 Navigating client to:', targetUrl);
            return client.navigate(targetUrl).then(() => client.focus());
          }
          
          return client.focus();
        }
      }
      
      // If no client found, open new window
      console.log('🆕 Opening new window:', targetUrl);
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    }).catch(error => {
      console.error('❌ [SW] Error in notification click:', error);
      // Fallback: open window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('🔔 [SW] Notification closed');
});