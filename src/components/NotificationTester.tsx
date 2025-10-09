// components/NotificationTester.tsx - MANUAL TEST COMPONENT
'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { ChatNotificationService } from '@/lib/chat-notification-service';

export default function NotificationTester() {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');

  const testNotification = async () => {
    if (!user) {
      console.log('❌ No user logged in');
      return;
    }

    setTesting(true);
    console.log('🧪 Starting notification test...');

    try {
      const testUserId = targetUserId || user.uid; // Send to self if no target
      
      console.log('📤 Sending test notification to:', testUserId);
      
      const result = await ChatNotificationService.sendMessageNotification(
        testUserId,
        'Test Sender',
        'This is a test notification message! 🚀',
        'test-chat-123'
      );

      console.log('✅ Test notification result:', result);
      alert(`Test notification sent! Check logs for details.`);
      
    } catch (error) {
      console.error('❌ Test notification failed:', error);
      alert('Test failed! Check logs for error.');
    } finally {
      setTesting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border">
      <h3 className="font-semibold mb-2">🧪 Notification Tester</h3>
      
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Target User ID (empty = self)"
          value={targetUserId}
          onChange={(e) => setTargetUserId(e.target.value)}
          className="w-full p-2 border rounded text-sm"
        />
        
        <button
          onClick={testNotification}
          disabled={testing}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
        >
          {testing ? 'Sending...' : 'Send Test Notification'}
        </button>
        
        <div className="text-xs text-gray-500">
          Current User: {user.uid.substring(0, 8)}...
        </div>
      </div>
    </div>
  );
}