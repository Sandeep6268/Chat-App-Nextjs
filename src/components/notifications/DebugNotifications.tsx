// components/notifications/DebugNotifications.tsx - FIXED
'use client';

import { useState, useEffect } from 'react';
import { notificationService } from '@/lib/notifications';
import { useAuth } from '@/components/auth/AuthProvider';

export default function DebugNotifications() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('checking...');
  const [notificationPermission, setNotificationPermission] = useState<string>('checking...');
  const { user } = useAuth();

  useEffect(() => {
    // Safe check for browser APIs
    const checkStatus = async () => {
      if (typeof window !== 'undefined') {
        // Update permission status
        setNotificationPermission(Notification.permission);
        
        // Check OneSignal subscription
        if (window.OneSignal) {
          try {
            const isSubscribed = await window.OneSignal.isPushNotificationsEnabled();
            setSubscriptionStatus(isSubscribed ? '✅ Subscribed' : '❌ Not Subscribed');
          } catch (error) {
            setSubscriptionStatus('❓ Unknown');
          }
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleEnableNotifications = async () => {
    setLoading(true);
    setMessage('');
    try {
      if (typeof window !== 'undefined' && window.OneSignal) {
        await window.OneSignal.showSlidedownPrompt();
        setMessage('✅ Notification prompt shown! Please allow notifications.');
      } else {
        setMessage('❌ OneSignal not loaded yet');
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!user) {
      setMessage('❌ Please login first');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await notificationService.sendNotification(
        'Test Notification 🔔',
        'This is a test notification from your chat app!',
        user.uid
      );
      setMessage('✅ Test notification sent! Check your browser notifications.');
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubscribe = async () => {
    if (typeof window !== 'undefined' && window.OneSignal) {
      try {
        await window.OneSignal.registerForPushNotifications();
        setMessage('🔔 Manual subscription requested!');
      } catch (error) {
        setMessage('❌ Manual subscription failed');
      }
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-8 border">
      <h3 className="text-lg font-semibold mb-4">Notification Test</h3>
      
      {message && (
        <div className={`p-3 rounded mb-4 ${
          message.includes('✅') ? 'bg-green-100 text-green-800' : 
          message.includes('🔔') ? 'bg-blue-100 text-blue-800' : 
          'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={handleEnableNotifications}
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : '🔔 Enable Notifications'}
        </button>
        
        <button
          onClick={handleManualSubscribe}
          disabled={loading}
          className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
        >
          Manual Subscribe
        </button>

        <button
          onClick={handleTestNotification}
          disabled={loading || !user}
          className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          Send Test Notification
        </button>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded text-sm space-y-2">
        <p><strong>Status:</strong> {user ? '✅ Logged in' : '❌ Not logged in'}</p>
        <p><strong>OneSignal:</strong> {typeof window !== 'undefined' && window.OneSignal ? '✅ Loaded' : '❌ Loading...'}</p>
        <p><strong>Subscription:</strong> {subscriptionStatus}</p>
        <p><strong>Permission:</strong> {notificationPermission}</p>
      </div>

      {subscriptionStatus.includes('❌') && (
        <div className="mt-3 p-3 bg-yellow-100 border border-yellow-400 rounded">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Not Subscribed:</strong> Click "Enable Notifications" and allow browser notifications to receive alerts.
          </p>
        </div>
      )}
    </div>
  );
}