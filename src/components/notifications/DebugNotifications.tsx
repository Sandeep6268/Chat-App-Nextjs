// components/notifications/DebugNotifications.tsx - FIXED
'use client';

import { useState, useEffect } from 'react';
import { notificationService } from '@/lib/notifications';
import { useAuth } from '@/components/auth/AuthProvider';

export default function DebugNotifications() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  const refreshDebugInfo = async () => {
    setLoading(true);
    try {
      const permission = await notificationService.getPermission();
      const userId = await notificationService.getUserId();
      
      // Server-side environment variables check via API
      const envCheck = await fetch('/api/env-check').then(res => res.json());
      
      setDebugInfo({
        permission,
        userId,
        oneSignalReady: typeof window !== 'undefined' && window.OneSignal && window.OneSignal.Initialized,
        appId: envCheck.hasAppId ? '✅ Set' : '❌ Missing',
        apiKey: envCheck.hasApiKey ? '✅ Set' : '❌ Missing',
        user: user ? `✅ ${user.uid}` : '❌ Not logged in',
        timestamp: new Date().toLocaleTimeString(),
        envCheck // Include full env check for debugging
      });
    } catch (error) {
      console.error('Debug error:', error);
      // Fallback to client-side check
      setDebugInfo(prev => ({
        ...prev,
        appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ? '✅ Set' : '❌ Missing',
        apiKey: '❓ Checking...',
        timestamp: new Date().toLocaleTimeString(),
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDebugInfo();
  }, [user]);

  const handleEnableNotifications = async () => {
    setLoading(true);
    setMessage('');
    try {
      const granted = await notificationService.requestPermission();
      if (granted) {
        setMessage('✅ Notifications enabled successfully!');
      } else {
        setMessage('❌ Failed to enable notifications. Please check browser settings.');
      }
      await refreshDebugInfo();
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
      const result = await notificationService.sendTestNotification(
        'Test Notification 🔔',
        'This is a test notification from your chat app!',
        user.uid
      );
      
      if (result.data?.errors) {
        setMessage(`⚠️ Notification sent but delivery issues: ${result.data.errors.join(', ')}`);
      } else {
        setMessage('✅ Test notification sent! Check your browser notifications.');
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
      refreshDebugInfo();
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-8 border">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Notification Debug Panel</h3>
      
      {message && (
        <div className={`p-3 rounded mb-4 ${
          message.includes('✅') ? 'bg-green-100 border border-green-400 text-green-800' : 
          message.includes('❌') ? 'bg-red-100 border border-red-400 text-red-800' :
          'bg-yellow-100 border border-yellow-400 text-yellow-800'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-3 mb-4">
        <button
          onClick={handleEnableNotifications}
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? 'Processing...' : '🔔 Enable Notifications'}
        </button>
        
        <button
          onClick={handleTestNotification}
          disabled={loading || !user}
          className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors font-medium"
        >
          Send Test Notification
        </button>

        <button
          onClick={refreshDebugInfo}
          disabled={loading}
          className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 transition-colors"
        >
          Refresh Debug Info
        </button>
      </div>

      <div className="bg-gray-50 p-4 rounded border">
        <h4 className="font-medium mb-3 text-gray-700">Debug Information:</h4>
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
}