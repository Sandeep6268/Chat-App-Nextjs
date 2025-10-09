// app/test-notifications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { notificationService } from '@/lib/notifications';

export default function TestNotificationsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string>('Checking...');
  const [oneSignalReady, setOneSignalReady] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (typeof window !== 'undefined') {
        // Check OneSignal
        if (window.OneSignal) {
          setOneSignalReady(true);
          const permission = await notificationService.getPermissionStatus();
          setStatus(`OneSignal Ready - Permission: ${permission}`);
        } else {
          setOneSignalReady(false);
          setStatus('OneSignal not loaded');
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleEnableNotifications = async () => {
    try {
      const granted = await notificationService.requestPermission();
      setStatus(granted ? '✅ Notifications enabled!' : '❌ Notifications blocked');
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  const handleTestNotification = async () => {
    if (!user) {
      setStatus('❌ Please login first');
      return;
    }

    try {
      setStatus('Sending test notification...');
      await notificationService.sendTestNotification(
        'Test Notification 🔔',
        'This is a test notification from your chat app!',
        user.uid
      );
      setStatus('✅ Test notification sent! Check your notifications.');
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Notification Test</h1>
        
        <div className="space-y-4">
          <div className="p-3 bg-gray-100 rounded">
            <p><strong>Status:</strong> {status}</p>
            <p><strong>OneSignal:</strong> {oneSignalReady ? '✅ Ready' : '❌ Not Ready'}</p>
            <p><strong>User:</strong> {user ? `✅ ${user.email}` : '❌ Not logged in'}</p>
          </div>

          <button
            onClick={handleEnableNotifications}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Enable Notifications
          </button>

          <button
            onClick={handleTestNotification}
            disabled={!user}
            className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            Send Test Notification
          </button>

          <div className="text-sm text-gray-600 mt-4">
            <p><strong>Note:</strong> Make sure:</p>
            <ul className="list-disc list-inside mt-2">
              <li>OneSignal App ID is configured</li>
              <li>API Key is correct</li>
              <li>Browser allows notifications</li>
              <li>You're using HTTPS</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}