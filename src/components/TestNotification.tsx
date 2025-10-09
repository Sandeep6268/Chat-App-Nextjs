// components/TestNotification.tsx
'use client';

import { useState } from 'react';
import { notificationService } from '@/lib/notifications';
import { useAuth } from '@/components/auth/AuthProvider';

export default function TestNotification() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      await notificationService.requestPermission();
      alert('Notification permission requested!');
    } catch (error) {
      console.error('Error:', error);
      alert('Error enabling notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!user) {
      alert('Please login first');
      return;
    }

    setLoading(true);
    try {
      await notificationService.sendTestNotification(
        'Test Message 🔔',
        'This is a test notification from your chat app!',
        user.uid
      );
      alert('Test notification sent! Check your browser notifications.');
    } catch (error) {
      console.error('Error:', error);
      alert('Error sending test notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-8">
      <h3 className="text-lg font-semibold mb-4">Test Notifications</h3>
      
      <div className="space-y-3">
        <button
          onClick={handleEnableNotifications}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Loading...' : 'Enable Notifications'}
        </button>
        
        <button
          onClick={handleSendTest}
          disabled={loading || !user}
          className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Sending...' : 'Send Test Notification'}
        </button>
      </div>

      {!user && (
        <p className="text-sm text-gray-600 mt-3 text-center">
          Please login to send test notifications
        </p>
      )}
    </div>
  );
}