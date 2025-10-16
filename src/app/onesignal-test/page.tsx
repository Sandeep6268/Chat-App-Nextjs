// app/onesignal-test/page.tsx
'use client';
import { useState } from 'react';
import OneSignalSubscribe from '@/components/OneSignalSubscribe';

export default function OneSignalTestPage() {
  const [testTitle, setTestTitle] = useState('Test Message');
  const [testMessage, setTestMessage] = useState('This is a test notification');
  const [sending, setSending] = useState(false);

  const sendTestNotification = async () => {
    if (sending) return;
    
    setSending(true);
    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: testTitle,
          message: testMessage,
          // Send to all subscribed users
          userId: null
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Test notification sent!');
      } else {
        alert('❌ Failed: ' + data.error);
      }
    } catch (error) {
      alert('❌ Error sending notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold mb-2">OneSignal Test</h1>
          <p className="text-gray-600">Push notifications made simple</p>
        </div>

        <OneSignalSubscribe />

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Send Test</h2>
          
          <div className="space-y-3 mb-4">
            <input
              type="text"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="Title"
              className="w-full border rounded-lg px-3 py-2"
            />
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Message"
              rows={3}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <button
            onClick={sendTestNotification}
            disabled={sending}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Test Notification'}
          </button>
        </div>
      </div>
    </div>
  );
}