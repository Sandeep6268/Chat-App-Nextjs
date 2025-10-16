// app/onesignal-test/page.tsx
'use client';
import { useState, useEffect } from 'react';
import OneSignalSubscribe from '@/components/OneSignalSubscribe';
import { getOneSignalUserId } from '@/lib/onesignal';

export default function OneSignalTestPage() {
  const [testTitle, setTestTitle] = useState('Test Message 💬');
  const [testMessage, setTestMessage] = useState('This is a test push notification from OneSignal!');
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user ID
    const fetchUserId = async () => {
      const id = await getOneSignalUserId();
      setUserId(id);
    };
    
    fetchUserId();
  }, []);

  const sendTestNotification = async (toAll: boolean = false) => {
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
          userId: toAll ? null : userId, // Send to current user or all
          data: {
            chatId: 'test-chat-123',
            type: 'test_notification',
            timestamp: new Date().toISOString()
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Test notification sent successfully! (ID: ${data.notificationId})`);
      } else {
        alert('❌ Failed to send notification: ' + data.error);
      }
    } catch (error) {
      console.error('Error sending test:', error);
      alert('❌ Error sending test notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            OneSignal Push Notifications
          </h1>
          <p className="text-gray-600">
            Test push notifications with OneSignal - Better delivery & features
          </p>
        </div>

        {/* Subscription Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <OneSignalSubscribe />
        </div>

        {/* Test Notification Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Send Test Notifications
          </h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notification Title
              </label>
              <input
                type="text"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter notification title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notification Message
              </label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter notification message"
              />
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => sendTestNotification(false)}
              disabled={sending || !userId}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
            >
              {sending ? 'Sending...' : '📱 Send to Me'}
            </button>

            <button
              onClick={() => sendTestNotification(true)}
              disabled={sending}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
            >
              {sending ? 'Sending...' : '🌍 Send to All Users'}
            </button>
          </div>

          {!userId && (
            <p className="text-orange-600 text-sm mt-3">
              ⚠️ Please enable notifications first to get your user ID
            </p>
          )}
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            OneSignal Features
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="space-y-2">
              <p>✅ High delivery rates</p>
              <p>✅ Cross-platform (Web, iOS, Android)</p>
              <p>✅ Rich notifications with images</p>
              <p>✅ Delivery analytics</p>
            </div>
            <div className="space-y-2">
              <p>✅ User segmentation</p>
              <p>✅ A/B testing</p>
              <p>✅ Automated messages</p>
              <p>✅ Free tier available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}