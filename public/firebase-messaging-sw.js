// public/firebase-messaging-sw.js - UPDATED NOTIFICATION CLICK HANDLER
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

console.log('✅ [SW] Service Worker Loaded - Version 3');

// Enhanced background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('📬 [SW] Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationBody = payload.notification?.body || 'You have a new message';
  
  const notificationOptions = {
    body: notificationBody,
    icon: '/icon-192.png',
    badge: '/badge-72x72.png',
    tag: 'chat-message',
    requireInteraction: true,
    data: payload.data || {},
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

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ✅ FIXED: Enhanced notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 [SW] Notification clicked:', event.notification.tag);
  console.log('📱 Action clicked:', event.action);
  console.log('📊 Notification data:', event.notification.data);
  
  event.notification.close();

  const notificationData = event.notification.data || {};
  const chatId = notificationData.chatId;
  const baseUrl = self.location.origin;
  
  let targetUrl = baseUrl + '/'; // Default to home
  
  // If chatId is available, navigate directly to that chat
  if (chatId) {
    targetUrl = `${baseUrl}/chat/${chatId}`;
    console.log(`📍 Navigating to chat: ${targetUrl}`);
  } else {
    console.log('📍 No chatId found, navigating to home');
  }

  event.waitUntil(
    clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    }).then((clientList) => {
      console.log(`🔍 Found ${clientList.length} open windows`);
      
      // Check if there's already a window/tab open with our app
      for (const client of clientList) {
        console.log('🏷️ Checking client:', client.url);
        
        // If client is from our domain, focus it
        if (client.url.startsWith(baseUrl)) {
          console.log('🎯 Found existing app window, focusing...');
          
          // Navigate to the target URL if different
          if (chatId && !client.url.includes(`/chat/${chatId}`)) {
            console.log('🔄 Navigating existing window to chat...');
            return client.navigate(targetUrl).then(() => client.focus());
          }
          
          return client.focus();
        }
      }
      
      // If no window exists, open a new one
      console.log('🆕 Opening new window...');
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    }).catch(error => {
      console.error('❌ Error in notification click:', error);
      // Fallback: always open window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle notification action buttons
self.addEventListener('notificationclose', (event) => {
  console.log('🔔 [SW] Notification closed:', event.notification.tag);
});

// Enhanced push event handler
self.addEventListener('push', (event) => {
  console.log('📬 [SW] Push event received');
  
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch (err) {
    data = {
      notification: {
        title: 'New Message',
        body: 'You have a new message'
      },
      data: {}
    };
  }

  const options = {
    body: data.notification?.body || 'You have a new message',
    icon: '/icon-192.png',
    badge: '/badge-72x72.png',
    tag: `push-${Date.now()}`,
    requireInteraction: true,
    data: data.data || {},
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

  event.waitUntil(
    self.registration.showNotification(
      data.notification?.title || 'New Message',
      options
    )
  );
});