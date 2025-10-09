// components/TestNotificationButton.tsx - TEMPORARY DEBUG COMPONENT
'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { ChatNotificationService } from '@/lib/chat-notification-service';

export default function TestNotificationButton() {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);

  const testNotification = async () => {
    if (!user) return;
    
    setTesting(true);
    console.log('🧪 [TEST] Testing notification system...');

    try {
      const result = await ChatNotificationService.sendMessageNotification(
        user.uid, // Send to yourself for testing
        'Test User',
        'This is a test notification from the chat app!',
        'test-chat-id'
      );

      console.log('🧪 [TEST] Notification test result:', result);
      alert('Test notification sent! Check console for details.');
    } catch (error) {
      console.error('🧪 [TEST] Notification test failed:', error);
      alert('Test failed! Check console for error.');
    } finally {
      setTesting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={testNotification}
        disabled={testing}
        className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-red-600 disabled:opacity-50"
      >
        {testing ? 'Testing...' : 'Test Notification'}
      </button>
    </div>
  );
}