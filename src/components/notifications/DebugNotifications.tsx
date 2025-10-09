// components/notifications/DebugNotifications.tsx - FIXED
'use client';

import { useState, useEffect } from 'react';
import { notificationService } from '@/lib/notifications';
import { useAuth } from '@/components/auth/AuthProvider';

export default function DebugNotifications() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [oneSignalReady, setOneSignalReady] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<string>('checking...');
  const { user } = useAuth();

  useEffect(() => {
    // Safe check for browser APIs
    const checkStatus = () => {
      if (typeof window !== 'undefined') {
        // Safely check notification permission
        if ('Notification' in window) {
          setNotificationPermission(Notification.permission);
        }
        
        // Check OneSignal
        if (window.OneSignal) {
          setOneSignalReady(true);
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleEnableNotifications = async () => {
    setLoading(true);
    setMessage('');
    try {
      if (oneSignalReady && window.OneSignal.showSlidedownPrompt) {
        window.OneSignal.showSlidedownPrompt();
        setMessage('✅ Notification prompt shown!');
      } else {
        // Fallback to browser API
        const granted = await notificationService.requestPermission();
        setMessage(granted ? '✅ Notifications enabled!' : '❌ Notifications blocked');
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
      await notificationService.sendTestNotification(
        'Test Notification 🔔',
        'This is a test notification from your chat app!',
        user.uid
      );
      setMessage('✅ Test notification sent!');
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-8 border">
      <h3 className="text-lg font-semibold mb-4">Notification Test</h3>
      
      {message && (
        <div className={`p-3 rounded mb-4 ${
          message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
          onClick={handleTestNotification}
          disabled={loading || !user}
          className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          Send Test Notification
        </button>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
        <p><strong>Status:</strong> {user ? '✅ Logged in' : '❌ Not logged in'}</p>
        <p><strong>OneSignal:</strong> {oneSignalReady ? '✅ Ready' : '⏳ Loading...'}</p>
        <p><strong>Permission:</strong> {notificationPermission}</p>
      </div>
    </div>
  );
}