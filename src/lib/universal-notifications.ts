// lib/universal-notifications.ts - COMPLETE FIXED VERSION
import { DeviceUtils } from './device-utils';
import { FCMService } from './fcm-service';
import toast from 'react-hot-toast';

export class UniversalNotificationService {
  private static fcmInitialized = false;

  // Initialize FCM for user
  static async initializeFCM(userId: string): Promise<boolean> {
    if (this.fcmInitialized) {
      console.log('🔔 FCM: Already initialized');
      return true;
    }

    if (!DeviceUtils.isMobile()) {
      console.log('🔔 FCM: Skipping initialization - not mobile device');
      return false;
    }

    console.log('🚀 FCM: Initializing for mobile user:', userId);
    
    const isSupported = await FCMService.isSupported();
    if (!isSupported) {
      console.log('❌ FCM: Not supported on this device');
      return false;
    }

    try {
      // Request permission and get token
      const token = await FCMService.requestPermission(userId);
      
      if (token) {
        console.log('✅ FCM: Initialized successfully');
        
        // Listen for foreground messages
        FCMService.onMessage((payload) => {
          console.log('📱 FCM: Foreground message received:', payload);
          this.handleForegroundMessage(payload);
        });

        this.fcmInitialized = true;
        return true;
      } else {
        console.log('❌ FCM: Initialization failed - no token');
        return false;
      }
    } catch (error) {
      console.error('❌ FCM: Initialization error:', error);
      return false;
    }
  }

  // Handle foreground messages
  private static handleForegroundMessage(payload: any) {
    try {
      const notification = payload.notification || payload.data;
      const { title, body, data } = notification;
      
      if (title && body) {
        // Remove emoji from title for sender name
        const senderName = title.replace('💬 ', '');
        const chatId = data?.chatId || 'unknown';
        
        console.log('📱 FCM: Showing toast for foreground message');
        this.showMobileToastNotification(senderName, body, chatId);
      }
    } catch (error) {
      console.error('❌ FCM: Error handling foreground message:', error);
    }
  }

  // Main notification function
  static async sendNotification(
    senderName: string, 
    message: string, 
    targetUserId: string, 
    chatId: string
  ) {
    console.log('🔔 Sending notification:', {
      senderName,
      targetUserId,
      chatId,
      isMobile: DeviceUtils.isMobile()
    });

    try {
      if (DeviceUtils.isMobile()) {
        // Mobile - Try FCM push notification
        const pushResult = await this.sendFCMPushNotification(
          targetUserId,
          senderName,
          message,
          chatId
        );

        if (pushResult.success) {
          console.log('✅ FCM Push notification sent successfully');
          return pushResult;
        } else {
          console.log('🔄 FCM failed, falling back to toast');
          return this.showMobileToastNotification(senderName, message, chatId);
        }
      } else {
        // Desktop - Browser notifications
        return this.sendDesktopNotification(senderName, message, chatId);
      }
    } catch (error) {
      console.error('❌ Notification error:', error);
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
    try {
      console.log('🚀 Sending FCM push to user:', targetUserId);
      
      const response = await fetch('/api/send-push-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId,
          title: `💬 ${senderName}`,
          body: message,
          data: { chatId, type: 'message' },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ FCM API Response:', result);
      
      return { 
        success: true, 
        type: 'push',
        messageId: result.messageId 
      };

    } catch (error: any) {
      console.error('❌ FCM Push Error:', error);
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
    try {
      if (!('Notification' in window)) {
        console.log('❌ Desktop: Notifications not supported');
        return this.showToastNotification(senderName, message, chatId);
      }

      if (Notification.permission === 'denied') {
        console.log('❌ Desktop: Notifications denied by user');
        return this.showToastNotification(senderName, message, chatId);
      }

      if (Notification.permission === 'default') {
        console.log('🔔 Desktop: Requesting notification permission');
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('❌ Desktop: Permission not granted');
          return this.showToastNotification(senderName, message, chatId);
        }
      }

      console.log('✅ Desktop: Showing browser notification');
      const notification = new Notification(`💬 ${senderName}`, {
        body: message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: chatId,
        requireInteraction: true,
      });

      notification.onclick = () => {
        console.log('📍 Desktop: Notification clicked, navigating to chat');
        window.location.href = `/chat/${chatId}`;
        notification.close();
      };

      setTimeout(() => {
        notification.close();
      }, 7000);

      return { success: true, type: 'desktop' };

    } catch (error) {
      console.error('❌ Desktop notification error:', error);
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
    
    console.log('📱 Showing mobile toast notification');
    
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
          console.log('📍 Mobile toast clicked, navigating to chat');
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

    console.log('🔄 Showing fallback toast notification');

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
    const deviceType = DeviceUtils.isMobile() ? '📱 Mobile' : '💻 Desktop';
    console.log(`${deviceType} Device Detected`);

    if (DeviceUtils.isMobile() && userId) {
      console.log('🚀 Testing FCM initialization...');
      await this.initializeFCM(userId);
    }

    return this.sendNotification(
      'Test User',
      'This is a test notification! ' + new Date().toLocaleTimeString(),
      userId || 'test-user',
      'test-chat'
    );
  }
}