// components/TestNotification.tsx
'use client';

import { notificationService } from '@/lib/notifications';

export default function TestNotification() {
  const requestPermission = async () => {
    await notificationService.requestNotificationPermission();
  };

  const sendTest = async () => {
    await notificationService.sendTestNotification(
      'Test Message',
      'This is a test notification from your chat app!'
    );
  };

  return (
    <div className="p-4 space-y-2">
      <button 
        onClick={requestPermission}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Enable Notifications
      </button>
      <button 
        onClick={sendTest}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        Send Test
      </button>
    </div>
  );
}