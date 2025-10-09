// lib/universal-notifications.ts - SIMPLE DEBUG VERSION
import { DeviceUtils } from './device-utils';
import { FCMService } from './fcm-service';
import toast from 'react-hot-toast';

export class UniversalNotificationService {
  private static fcmInitialized = false;

  // Initialize FCM for user
  static async initializeFCM(userId: string): Promise<boolean> {
    console.log('🎯 [FCM] initializeFCM called for user:', userId);
    
    if (this.fcmInitialized) {
      console.log('✅ [FCM] Already initialized');
      return true;
    }

    if (!DeviceUtils.isMobile()) {
      console.log('📱 [FCM] Not mobile device - skipping FCM');
      return false;
    }

    console.log('🚀 [FCM] Starting FCM initialization...');
    
    const isSupported = await FCMService.isSupported();
    console.log('🔧 [FCM] Supported check:', isSupported);
    
    if (!isSupported) {
      console.log('❌ [FCM] Not supported on this device');
      return false;
    }

    try {
      // Request permission and get token
      console.log('🔔 [FCM] Requesting permission...');
      const token = await FCMService.requestPermission(userId);
      
      if (token) {
        console.log('✅ [FCM] Initialized successfully with token');
        
        // Listen for foreground messages
        FCMService.onMessage((payload) => {
          console.log('📨 [FCM] NEW MESSAGE RECEIVED:', {
            title: payload.notification?.title,
            body: payload.notification?.body,
            data: payload.data
          });
          this.handleForegroundMessage(payload);
        });

        this.fcmInitialized = true;
        return true;
      } else {
        console.log('❌ [FCM] Initialization failed - no token received');
        return false;
      }
    } catch (error) {
      console.error('💥 [FCM] Initialization error:', error);
      return false;
    }
  }

  // Handle foreground messages
  private static handleForegroundMessage(payload: any) {
    console.log('🔄 [FCM] Handling foreground message');
    
    try {
      const notification = payload.notification || payload.data;
      const { title, body, data } = notification;
      
      console.log('📝 [FCM] Message details:', { title, body, data });
      
      if (title && body) {
        // Remove emoji from title for sender name
        const senderName = title.replace('💬 ', '');
        const chatId = data?.chatId || 'unknown';
        
        console.log('📱 [FCM] Showing toast for:', senderName);
        this.showMobileToastNotification(senderName, body, chatId);
      } else {
        console.log('⚠️ [FCM] No title/body in message');
      }
    } catch (error) {
      console.error('💥 [FCM] Error handling message:', error);
    }
  }

  // Main notification function
  static async sendNotification(
    senderName: string, 
    message: string, 
    targetUserId: string, 
    chatId: string
  ) {
    console.log('🔔 [NOTIFICATION] Sending:', {
      from: senderName,
      to: targetUserId,
      chat: chatId,
      message: message.substring(0, 50) + '...',
      isMobile: DeviceUtils.isMobile()
    });

    try {
      if (DeviceUtils.isMobile()) {
        console.log('📱 [NOTIFICATION] Using FCM for mobile');
        
        // Mobile - Try FCM push notification
        const pushResult = await this.sendFCMPushNotification(
          targetUserId,
          senderName,
          message,
          chatId
        );

        console.log('📊 [NOTIFICATION] FCM Result:', pushResult);

        if (pushResult.success) {
          console.log('✅ [NOTIFICATION] FCM Push sent successfully');
          return pushResult;
        } else {
          console.log('🔄 [NOTIFICATION] FCM failed, using toast fallback');
          return this.showMobileToastNotification(senderName, message, chatId);
        }
      } else {
        console.log('💻 [NOTIFICATION] Using browser notifications for desktop');
        return this.sendDesktopNotification(senderName, message, chatId);
      }
    } catch (error) {
      console.error('💥 [NOTIFICATION] Error:', error);
      return this.showToastNotification(senderName, message, chatId);
    }
  }

  // Send FCM Push Notification
  private static async sendFCMPushNotification(
    targetUserId: string,
    senderName: string,
    message: string,
    chatId: string
  ) {
    console.log('🚀 [FCM PUSH] Sending to user:', targetUserId);
    
    try {
      const payload = {
        targetUserId,
        title: `💬 ${senderName}`,
        body: message,
        data: { chatId, type: 'message' },
      };

      console.log('📤 [FCM PUSH] API Payload:', payload);

      const response = await fetch('/api/send-push-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📡 [FCM PUSH] API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [FCM PUSH] API Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ [FCM PUSH] API Success:', result);
      
      return { 
        success: true, 
        type: 'push',
        messageId: result.messageId 
      };

    } catch (error: any) {
      console.error('💥 [FCM PUSH] Error:', error.message);
      return { 
        success: false, 
        type: 'push',
        error: error.message 
      };
    }
  }

  // Desktop notifications (browser)
  private static async sendDesktopNotification(
    senderName: string, 
    message: string, 
    chatId: string
  ) {
    console.log('💻 [DESKTOP] Sending browser notification');
    
    try {
      if (!('Notification' in window)) {
        console.log('❌ [DESKTOP] Notifications not supported');
        return this.showToastNotification(senderName, message, chatId);
      }

      console.log('🔔 [DESKTOP] Current permission:', Notification.permission);

      if (Notification.permission === 'denied') {
        console.log('❌ [DESKTOP] Notifications denied by user');
        return this.showToastNotification(senderName, message, chatId);
      }

      if (Notification.permission === 'default') {
        console.log('🔄 [DESKTOP] Requesting permission...');
        const permission = await Notification.requestPermission();
        console.log('🔔 [DESKTOP] Permission result:', permission);
        
        if (permission !== 'granted') {
          console.log('❌ [DESKTOP] Permission not granted');
          return this.showToastNotification(senderName, message, chatId);
        }
      }

      console.log('✅ [DESKTOP] Creating notification');
      const notification = new Notification(`💬 ${senderName}`, {
        body: message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: chatId,
        requireInteraction: true,
      });

      notification.onclick = () => {
        console.log('📍 [DESKTOP] Notification clicked, navigating to chat');
        window.location.href = `/chat/${chatId}`;
        notification.close();
      };

      setTimeout(() => {
        notification.close();
        console.log('⏰ [DESKTOP] Notification auto-closed');
      }, 7000);

      return { success: true, type: 'desktop' };

    } catch (error) {
      console.error('💥 [DESKTOP] Error:', error);
      return this.showToastNotification(senderName, message, chatId);
    }
  }

  // Mobile toast notification (fallback)
  private static showMobileToastNotification(
    senderName: string, 
    message: string, 
    chatId: string
  ) {
    const truncatedMessage = message.length > 40 ? message.substring(0, 40) + '...' : message;
    
    console.log('📱 [TOAST] Showing mobile toast:', { senderName, chatId });
    
    const toastId = toast.success(
      `💬 ${senderName}\n${truncatedMessage}`,
      {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#3B82F6',
          color: 'white',
          borderRadius: '12px',
          padding: '16px',
          cursor: 'pointer',
          minWidth: '300px',
          maxWidth: '90vw',
          fontSize: '14px',
          fontWeight: '500',
          lineHeight: '1.4',
        },
      }
    );

    // Add click handler
    setTimeout(() => {
      const toastElement = document.querySelector(`[data-toast-id="${toastId}"]`);
      if (toastElement) {
        toastElement.addEventListener('click', () => {
          console.log('📍 [TOAST] Clicked, navigating to chat:', chatId);
          window.location.href = `/chat/${chatId}`;
          toast.dismiss(toastId);
        });
      }
    }, 100);

    return { success: true, type: 'toast', toastId };
  }

  // Fallback toast notification
  private static showToastNotification(
    senderName: string, 
    message: string, 
    chatId: string
  ) {
    const truncatedMessage = message.length > 60 ? message.substring(0, 60) + '...' : message;

    console.log('🔄 [FALLBACK] Showing toast notification');

    toast.success(
      `💬 ${senderName}: ${truncatedMessage}`,
      {
        duration: 5000,
        position: DeviceUtils.isMobile() ? 'top-center' : 'top-right',
        style: {
          background: '#3B82F6',
          color: 'white',
          borderRadius: '12px',
          padding: '16px',
          cursor: 'pointer',
          minWidth: DeviceUtils.isMobile() ? '300px' : '350px',
        },
      }
    );

    return { success: true, type: 'toast' };
  }

  // Test function
  static async testNotifications(userId?: string) {
    console.log('🧪 [TEST] Starting notification test...');
    
    const deviceType = DeviceUtils.isMobile() ? '📱 Mobile' : '💻 Desktop';
    console.log(`${deviceType} Device Detected`);

    if (DeviceUtils.isMobile() && userId) {
      console.log('🚀 [TEST] Testing FCM initialization...');
      await this.initializeFCM(userId);
    }

    const result = await this.sendNotification(
      'Test User',
      'This is a test notification! ' + new Date().toLocaleTimeString(),
      userId || 'test-user',
      'test-chat'
    );

    console.log('📊 [TEST] Test result:', result);
    return result;
  }

  // Debug function to check FCM status
  static getFCMStatus() {
    return {
      fcmInitialized: this.fcmInitialized,
      isMobile: DeviceUtils.isMobile(),
      notificationPermission: Notification.permission,
      supportsNotifications: 'Notification' in window,
      supportsServiceWorker: 'serviceWorker' in navigator,
    };
  }
}