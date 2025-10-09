// components/notifications/DebugNotifications.tsx
'use client';

import { useState, useEffect } from 'react';
import { notificationService } from '@/lib/notifications';
import { useAuth } from '@/components/auth/AuthProvider';

export default function DebugNotifications() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const refreshDebugInfo = async () => {
    setLoading(true);
    try {
      const permission = await notificationService.getPermission();
      const userId = await notificationService.getUserId();
      
      setDebugInfo({
        permission,
        userId,
        oneSignalReady: typeof window !== 'undefined' && window.OneSignal && window.OneSignal.Initialized,
        appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ? '✅ Set' : '❌ Missing',
        apiKey: process.env.ONESIGNAL_REST_API_KEY ? '✅ Set' : '❌ Missing',
        user: user ? `✅ ${user.uid}` : '❌ Not logged in',
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error('Debug error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDebugInfo();
  }, [user]);

  const handleTestNotification = async () => {
    if (!user) {
      alert('Please login first');
      return;
    }

    setLoading(true);
    try {
      await notificationService.sendTestNotification(
        'Test Notification 🔔',
        'This is a test notification from your chat app!',
        user.uid
      );
      alert('Test notification sent! Check console for details.');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
      refreshDebugInfo();
    }
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg max-w-md mx-auto mt-8">
      <h3 className="text-lg font-semibold mb-4">Notification Debug</h3>
      
      <div className="space-y-3 mb-4">
        <button
          onClick={refreshDebugInfo}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh Debug Info'}
        </button>
        
        <button
          onClick={handleTestNotification}
          disabled={loading || !user}
          className="w-full px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
        >
          Send Test Notification
        </button>
      </div>

      <div className="bg-white p-4 rounded border">
        <h4 className="font-medium mb-2">Debug Information:</h4>
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      {debugInfo.permission === 'default' && (
        <div className="mt-3 p-3 bg-yellow-100 border border-yellow-400 rounded">
          <p className="text-sm text-yellow-800">
            ⚠️ Notification permission not granted. Click "Enable Notifications" first.
          </p>
        </div>
      )}
    </div>
  );
}