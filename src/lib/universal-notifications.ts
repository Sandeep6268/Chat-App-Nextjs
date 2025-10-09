// lib/universal-notifications.ts - FIXED VERSION
import { DeviceUtils } from './device-utils';
import toast from 'react-hot-toast';

export class UniversalNotificationService {
  // Main notification function
  static async sendNotification(
    senderName: string, 
    message: string, 
    targetUserId: string, 
    chatId: string
  ) {
    if (DeviceUtils.isMobile()) {
      return this.sendMobileNotification(senderName, message, chatId);
    } else {
      return this.sendDesktopNotification(senderName, message, chatId);
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
        return this.showToastNotification(senderName, message, chatId);
      }

      if (Notification.permission === 'denied') {
        return this.showToastNotification(senderName, message, chatId);
      }

      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          return this.showToastNotification(senderName, message, chatId);
        }
      }

      const notification = new Notification(`💬 ${senderName}`, {
        body: message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: chatId,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.location.href = `/chat/${chatId}`;
        notification.close();
      };

      setTimeout(() => notification.close(), 7000);

      return { success: true, type: 'desktop' };

    } catch (error) {
      return this.showToastNotification(senderName, message, chatId);
    }
  }

  // Mobile notifications (Toast + Sound + Vibration)
  private static async sendMobileNotification(
    senderName: string, 
    message: string, 
    chatId: string
  ) {
    try {
      // 1. Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }

      // 2. Play sound if needed (optional)
      this.playNotificationSound();

      // 3. Show toast notification
      return this.showMobileToastNotification(senderName, message, chatId);

    } catch (error) {
      console.log('Mobile notification failed:', error);
      return this.showToastNotification(senderName, message, chatId);
    }
  }

  // Mobile toast without JSX - SIMPLIFIED
  private static showMobileToastNotification(
    senderName: string, 
    message: string, 
    chatId: string
  ) {
    const truncatedMessage = message.length > 50 ? message.substring(0, 50) + '...' : message;
    
    // Create simple HTML string instead of JSX
    const toastContent = `
      <div onclick="window.location.href='/chat/${chatId}'" style="cursor: pointer;">
        <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">
          ${senderName}
        </div>
        <div style="color: #374151; font-size: 14px; margin-bottom: 4px;">
          ${truncatedMessage}
        </div>
        <div style="color: #2563EB; font-size: 12px; font-weight: 500;">
          💬 Tap to open chat
        </div>
      </div>
    `;

    return toast.success(toastContent, {
      duration: 6000,
      position: 'top-center',
      style: {
        background: 'white',
        color: 'black',
        border: '2px solid #3B82F6',
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        minWidth: '300px',
        maxWidth: '90vw',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      },
      icon: '💬',
    });
  }

  // Fallback toast notification - SIMPLIFIED
  private static showToastNotification(
    senderName: string, 
    message: string, 
    chatId: string
  ) {
    const truncatedMessage = message.length > 60 ? message.substring(0, 60) + '...' : message;

    const toastContent = `
      <div onclick="window.location.href='/chat/${chatId}'" style="cursor: pointer;">
        <div style="font-weight: 600; color: #111827;">
          ${senderName}
        </div>
        <div style="color: #374151; font-size: 14px; margin-top: 4px;">
          ${truncatedMessage}
        </div>
        <div style="color: #2563EB; font-size: 12px; margin-top: 4px;">
          Click to open
        </div>
      </div>
    `;

    toast.success(toastContent, {
      duration: 5000,
      position: DeviceUtils.isMobile() ? 'top-center' : 'top-right',
      style: {
        background: 'white',
        color: 'black',
        border: '2px solid #3B82F6',
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        minWidth: DeviceUtils.isMobile() ? '300px' : '350px',
      },
    });

    return { success: true, type: 'toast' };
  }

  // Play notification sound (optional)
  private static playNotificationSound() {
    try {
      // You can add a notification sound here
      // const audio = new Audio('/sounds/notification.mp3');
      // audio.play().catch(() => {});
    } catch (error) {
      // Silent fail for sound
    }
  }

  // Test function
  static async testNotifications() {
    if (DeviceUtils.isMobile()) {
      alert(`📱 Mobile Device Detected\nYou'll see toast notifications`);
    } else {
      alert(`💻 Desktop Device Detected\nYou'll see browser notifications`);
    }

    return this.sendNotification(
      'Test User',
      'This is a test notification to check what you see on your device!',
      'test-user',
      'test-chat'
    );
  }
}