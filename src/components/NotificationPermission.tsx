'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationPermission() {
  const { 
    notificationPermission, 
    requestPermission, 
    isFCMSupported,
    fcmToken 
  } = useNotifications();
  
  const [isLoading, setIsLoading] = useState(false);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        console.log('✅ Notifications enabled successfully');
      } else {
        console.log('❌ Notifications permission denied');
      }
    } catch (error) {
      console.error('❌ Error enabling notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isFCMSupported) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
        <p className="text-yellow-800 text-sm">
          🔔 Push notifications are not supported in your browser.
        </p>
      </div>
    );
  }

  if (notificationPermission === 'denied') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
        <p className="text-red-800 text-sm">
          🔕 Notifications are blocked. Please enable them in your browser settings.
        </p>
      </div>
    );
  }

  if (notificationPermission === 'granted' && fcmToken) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
        <p className="text-green-800 text-sm flex items-center">
          <span className="mr-2">✅</span>
          Notifications are enabled
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-blue-800 text-sm font-medium">
            🔔 Enable push notifications
          </p>
          <p className="text-blue-600 text-xs mt-1">
            Get notified when you receive new messages
          </p>
        </div>
        <button
          onClick={handleEnableNotifications}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {isLoading ? 'Enabling...' : 'Enable'}
        </button>
      </div>
    </div>
  );
}