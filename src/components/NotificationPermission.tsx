'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationPermission() {
  const { 
    fcmToken, 
    notificationPermission, 
    requestPermission, 
    testPushNotification,
    isFCMSupported 
  } = useNotifications();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showTestButton, setShowTestButton] = useState(false);

  useEffect(() => {
    // Show test button after 3 seconds if permissions are granted
    if (notificationPermission === 'granted' && fcmToken) {
      const timer = setTimeout(() => {
        setShowTestButton(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notificationPermission, fcmToken]);

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

  const handleTestNotification = async () => {
    const success = await testPushNotification(
      'Test Push Notification 🔔',
      'Yeh test push notification hai! Kaam kar raha hai! 🎉'
    );
    
    if (success) {
      console.log('✅ Test notification sent successfully');
    } else {
      console.log('❌ Failed to send test notification');
    }
  };

  if (!isFCMSupported) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg m-4">
        <p className="text-yellow-800 text-sm text-center">
          🔔 Push notifications are not supported in your browser.
        </p>
      </div>
    );
  }

  if (notificationPermission === 'denied') {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg m-4">
        <p className="text-red-800 text-sm text-center">
          🔕 Notifications are blocked. Please enable them in your browser settings.
        </p>
      </div>
    );
  }

  if (notificationPermission === 'granted' && fcmToken) {
    return (
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg m-4">
        <div className="flex flex-col items-center space-y-2">
          <p className="text-green-800 text-sm flex items-center">
            <span className="mr-2">✅</span>
            Push notifications are enabled
          </p>
          {showTestButton && (
            <button
              onClick={handleTestNotification}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm font-medium transition-colors"
            >
              Test Push Notification
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg m-4">
      <div className="flex flex-col items-center space-y-3 text-center">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-2xl">🔔</span>
        </div>
        <div>
          <p className="text-blue-800 text-sm font-medium">
            Enable Push Notifications
          </p>
          <p className="text-blue-600 text-xs mt-1">
            Get notified when you receive new messages
          </p>
        </div>
        <button
          onClick={handleEnableNotifications}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Enabling...' : 'Enable Notifications'}
        </button>
      </div>
    </div>
  );
}