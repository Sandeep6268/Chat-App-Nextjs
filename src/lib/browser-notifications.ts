// lib/browser-notifications.ts - SIMPLE BROWSER NOTIFICATIONS
export class BrowserNotificationService {
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('❌ This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('❌ Notifications are blocked by user');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  static async showMessageNotification(
    senderName: string, 
    message: string, 
    chatId: string
  ): Promise<void> {
    const hasPermission = await this.requestPermission();
    
    if (!hasPermission) {
      console.log('❌ No permission for notifications');
      return;
    }

    // Create notification
    const notification = new Notification(`💬 New message from ${senderName}`, {
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: chatId, // Group notifications by chat
      requireInteraction: true,
      silent: false,
    });

    // Handle click
    notification.onclick = () => {
      window.focus();
      window.location.href = `/chat/${chatId}`;
      notification.close();
    };

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
  }

  static async showTestNotification(): Promise<void> {
    const hasPermission = await this.requestPermission();
    
    if (!hasPermission) {
      alert('Please allow notifications to test');
      return;
    }

    new Notification('Test Notification ✅', {
      body: 'Browser notifications are working!',
      icon: '/icons/icon-192x192.png',
      requireInteraction: true,
    });
  }
}