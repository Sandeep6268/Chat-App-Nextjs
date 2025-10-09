// lib/universal-notifications.ts
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

      // 3. Show custom toast notification
      return this.showMobileToastNotification(senderName, message, chatId);

    } catch (error) {
      console.log('Mobile notification failed:', error);
      return this.showToastNotification(senderName, message, chatId);
    }
  }

  // Custom mobile toast with better UI
  private static showMobileToastNotification(
    senderName: string, 
    message: string, 
    chatId: string
  ) {
    return toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex border-2 border-blue-300 mobile-notification`}
          onClick={() => {
            window.location.href = `/chat/${chatId}`;
            toast.dismiss(t.id);
          }}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {senderName[0]?.toUpperCase()}
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {senderName}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {message.length > 50 ? message.substring(0, 50) + '...' : message}
                </p>
                <p className="mt-1 text-xs text-blue-600 font-medium">
                  💬 Tap to open chat
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toast.dismiss(t.id);
              }}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-500"
            >
              ✕
            </button>
          </div>
        </div>
      ),
      {
        duration: 6000,
        position: 'top-center',
      }
    );
  }

  // Fallback toast notification
  private static showToastNotification(
    senderName: string, 
    message: string, 
    chatId: string
  ) {
    toast.success(
      <div 
        className="flex flex-col cursor-pointer"
        onClick={() => {
          window.location.href = `/chat/${chatId}`;
        }}
      >
        <span className="font-semibold text-gray-900">{senderName}</span>
        <span className="text-gray-700 text-sm mt-1">
          {message.length > 60 ? message.substring(0, 60) + '...' : message}
        </span>
        <span className="text-blue-600 text-xs mt-1">Click to open</span>
      </div>,
      {
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
      }
    );

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