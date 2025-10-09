// components/NotificationTester.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function NotificationTester() {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);

  const testNotification = async () => {
    if (!user) {
      alert('Please login first');
      return;
    }

    setTesting(true);
    try {
      // Test 1: Check permission
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Please allow notifications in browser settings');
          return;
        }
      }

      // Test 2: Send test notification
      const response = await fetch('/api/pusher/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          title: 'Test Notification ✅',
          body: 'If you see this, push notifications are working!',
          data: { url: window.location.origin, test: true }
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('✅ Test notification sent! Check your device.');
      } else {
        alert('❌ Test failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('❌ Test failed with error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border">
      <h3 className="font-bold mb-2">🔔 Test Notifications</h3>
      <button 
        onClick={testNotification}
        disabled={testing}
        className="bg-blue-500 text-white px-3 py-2 rounded disabled:opacity-50"
      >
        {testing ? 'Testing...' : 'Send Test'}
      </button>
    </div>
  );
}