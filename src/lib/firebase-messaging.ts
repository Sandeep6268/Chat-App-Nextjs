// lib/firebase-messaging.ts
// Simple browser notifications without FCM for production

export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return false;
    }

    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    // Check if we're on localhost or HTTPS (required for notifications)
    const isLocalhost = window.location.hostname === 'localhost';
    const isHttps = window.location.protocol === 'https:';
    
    if (!isLocalhost && !isHttps) {
      console.log('Notifications require HTTPS in production');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    // Only request permission if user interaction is available
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const showBrowserNotification = (title: string, body: string) => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      // Check if document is focused - don't show notification if user is active
      const isDocumentFocused = document.hasFocus();
      
      if (isDocumentFocused) {
        console.log('Document is focused, skipping browser notification');
        return;
      }

      new Notification(title, { 
        body, 
        icon: '/icon.png',
        requireInteraction: false // Changed to false for better UX
      });
    }
  } catch (error) {
    console.error('Error showing browser notification:', error);
  }
};