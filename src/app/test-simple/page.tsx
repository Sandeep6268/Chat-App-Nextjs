// app/test-simple/page.tsx
'use client';

import SimpleNotificationSubscribe from '@/components/SimpleNotificationSubscribe';
import SimpleNotificationTest from '@/components/SimpleNotificationTest';

export default function TestSimplePage() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Simple Notification Test
        </h1>
        
        <SimpleNotificationSubscribe />
        <SimpleNotificationTest />
        
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-2">How This Works:</h3>
          <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
            <li>Click "Subscribe to Push Notifications" first</li>
            <li>Allow browser permissions when prompted</li>
            <li>Then test notifications with the buttons below</li>
            <li>Check OneSignal dashboard for delivery status</li>
          </ol>
        </div>
      </div>
    </div>
  );
}