// components/notifications/DebugNotifications.tsx - FINAL
'use client';

import { useState, useEffect } from 'react';
import { notificationService } from '@/lib/notifications';
import { useAuth } from '@/components/auth/AuthProvider';

export default function DebugNotifications() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  const handleEnableNotifications = async () => {
    setLoading(true);
    setMessage('');
    try {
      // Use browser's native notification API
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          setMessage('✅ Notifications enabled! You can now receive alerts.');
        } else {
          setMessage('❌ Notifications blocked. Please enable in browser settings.');
        }
      } else {
        setMessage('❌ Browser does not support notifications');
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
      setMessage('✅ Test notification sent! Check your browser notifications.');
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
        <p><strong>Permission:</strong> {Notification.permission}</p>
      </div>
    </div>
  );
}