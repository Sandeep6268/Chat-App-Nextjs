// components/NotificationTester.tsx
'use client';

import { useState } from 'react';
import { UniversalNotificationService, DeviceUtils } from '@/lib/universal-notifications';

export default function NotificationTester() {
  const [testing, setTesting] = useState(false);

  const testNotifications = async () => {
    setTesting(true);
    try {
      await UniversalNotificationService.testNotifications();
    } catch (error) {
      alert('Test failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-50">
      <h3 className="font-bold mb-2">
        {DeviceUtils.isMobile() ? '📱' : '💻'} Test Notifications
      </h3>
      <p className="text-xs text-gray-600 mb-2">
        {DeviceUtils.isMobile() 
          ? 'You will see toast notifications' 
          : 'You will see browser notifications'
        }
      </p>
      <button 
        onClick={testNotifications}
        disabled={testing}
        className="bg-blue-500 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
      >
        {testing ? 'Testing...' : 'Send Test'}
      </button>
    </div>
  );
}