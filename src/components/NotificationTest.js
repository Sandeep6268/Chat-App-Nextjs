'use client';
import { useState } from 'react';

export default function NotificationTest() {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const sendTestNotification = async () => {
    if (!message.trim()) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          url: window.location.href,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Notification sent successfully!');
        setMessage('');
      } else {
        alert('Failed to send notification: ' + data.error);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Error sending notification');
    } finally {
      setIsSending(false);
    }
  };

  const checkSubscription = async () => {
    if (typeof window.OneSignal !== 'undefined') {
      const isSubscribed = await window.OneSignal.User.pushSubscription.isSubscribed();
      alert(`Push subscription status: ${isSubscribed ? 'Subscribed' : 'Not subscribed'}`);
    } else {
      alert('OneSignal not initialized yet');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Test OneSignal Notifications</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Test Message:
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter test notification message"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={sendTestNotification}
            disabled={isSending || !message.trim()}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isSending ? 'Sending...' : 'Send Test Notification'}
          </button>

          <button
            onClick={checkSubscription}
            className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
          >
            Check Subscription
          </button>
        </div>

        <div className="text-sm text-gray-600">
          <p>• Make sure to allow notifications when prompted</p>
          <p>• Click "Check Subscription" to verify push status</p>
        </div>
      </div>
    </div>
  );
}