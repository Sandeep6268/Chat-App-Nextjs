// app/onesignal-test/page.tsx
'use client';
import { useState, useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalTestPage() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testTitle, setTestTitle] = useState('Test Message 💬');
  const [testMessage, setTestMessage] = useState('This is a test push notification!');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    initializeAndCheckStatus();
  }, []);

  const initializeAndCheckStatus = async () => {
    try {
      // Check if OneSignal is available
      if (window.OneSignal) {
        const subscribed = await OneSignal.isPushNotificationsEnabled();
        setIsSubscribed(subscribed);
        
        const userid = await OneSignal.getUserId();
        setUserId(userid);
      }
    } catch (error) {
      console.error('Status check error:', error);
    }
  };

  const toggleSubscription = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      if (isSubscribed) {
        await OneSignal.setSubscription(false);
        setIsSubscribed(false);
      } else {
        await OneSignal.registerForPushNotifications();
        await OneSignal.setSubscription(true);
        setTimeout(initializeAndCheckStatus, 1000);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Error managing notifications');
    } finally {
      setLoading(false);
    }
  };

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
          userId: userId // Send to current user
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Notification sent! ID: ${data.notificationId}`);
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            OneSignal Test
          </h1>
          <p className="text-gray-600">
            Fixed version - No service worker errors
          </p>
        </div>

        {/* Subscription Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">1. Enable Notifications</h2>
          
          <button
            onClick={toggleSubscription}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
              isSubscribed 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            } disabled:opacity-50`}
          >
            {loading ? '⏳ Processing...' : 
             isSubscribed ? '🔕 Disable Notifications' : '🔔 Enable Notifications'}
          </button>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm">
              <strong>Status:</strong> {isSubscribed ? '✅ Subscribed' : '❌ Not Subscribed'}
            </p>
            {userId && (
              <p className="text-sm break-all mt-2">
                <strong>User ID:</strong> {userId}
              </p>
            )}
          </div>
        </div>

        {/* Test Notification Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">2. Send Test</h2>
          
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Notification title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Notification message"
              />
            </div>
          </div>

          <button
            onClick={sendTestNotification}
            disabled={sending || !isSubscribed}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50"
          >
            {sending ? 'Sending...' : '🚀 Send Test Notification'}
          </button>

          {!isSubscribed && (
            <p className="text-orange-600 text-sm mt-2">
              ⚠️ Please enable notifications first
            </p>
          )}
        </div>

        {/* Debug Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Debug Info</h3>
          <p className="text-sm text-yellow-700">
            App ID: da31d02e-4dc3-414b-b788-b1cb441a7738
          </p>
          <p className="text-sm text-yellow-700">
            API Key: 26v2tf243ebxee5accglxhhgt
          </p>
        </div>
      </div>
    </div>
  );
}