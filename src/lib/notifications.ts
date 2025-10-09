// lib/notifications.ts
export class NotificationService {
  private static instance: NotificationService;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Check if OneSignal is available
  private isOneSignalAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.OneSignal;
  }

  // Get current user's OneSignal ID
  async getOneSignalUserId(): Promise<string | null> {
    if (!this.isOneSignalAvailable()) return null;

    try {
      return await window.OneSignal.getUserId();
    } catch (error) {
      console.error('Error getting OneSignal user ID:', error);
      return null;
    }
  }

  // Check notification permission
  async getNotificationPermission(): Promise<NotificationPermission> {
    if (!this.isOneSignalAvailable()) return 'default';

    try {
      return await window.OneSignal.getNotificationPermission();
    } catch (error) {
      console.error('Error getting notification permission:', error);
      return 'default';
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<void> {
    if (!this.isOneSignalAvailable()) return;

    try {
      await window.OneSignal.showSlidedownPrompt();
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }

  // Send test notification (for testing)
  async sendTestNotification(title: string, message: string): Promise<void> {
    if (!this.isOneSignalAvailable()) return;

    try {
      // This would typically be done from your backend
      // For testing, you can use OneSignal dashboard
      console.log('📤 Test notification:', { title, message });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  // Subscribe to notification events
  subscribeToNotifications(callbacks: {
    onNotificationDisplay?: (event: any) => void;
    onNotificationClick?: (event: any) => void;
    onNotificationDismiss?: (event: any) => void;
  }) {
    if (!this.isOneSignalAvailable()) return;

    try {
      if (callbacks.onNotificationDisplay) {
        window.OneSignal.on('notificationDisplay', callbacks.onNotificationDisplay);
      }
      if (callbacks.onNotificationClick) {
        window.OneSignal.on('notificationClick', callbacks.onNotificationClick);
      }
      if (callbacks.onNotificationDismiss) {
        window.OneSignal.on('notificationDismiss', callbacks.onNotificationDismiss);
      }
    } catch (error) {
      console.error('Error subscribing to notification events:', error);
    }
  }

  // Unsubscribe from notification events
  unsubscribeFromNotifications() {
    if (!this.isOneSignalAvailable()) return;

    try {
      window.OneSignal.off('notificationDisplay');
      window.OneSignal.off('notificationClick');
      window.OneSignal.off('notificationDismiss');
    } catch (error) {
      console.error('Error unsubscribing from notification events:', error);
    }
  }
}

export const notificationService = NotificationService.getInstance();