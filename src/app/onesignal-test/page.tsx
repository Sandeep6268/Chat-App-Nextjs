// app/onesignal-test/page.tsx
'use client';
import { useState, useEffect } from 'react';
import OneSignal from 'react-onesignal';
import ServiceWorkerSetup from '@/components/ServiceWorkerSetup';

export default function OneSignalTestPage() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [testTitle, setTestTitle] = useState('Test Message 💬');
  const [testMessage, setTestMessage] = useState('This is a test push notification!');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    checkOneSignalStatus();
  }, []);

  const checkOneSignalStatus = async () => {
    try {
      // Check if OneSignal is available
      if (typeof OneSignal !== 'undefined') {
        const subscribed = await OneSignal.isPushNotificationsEnabled();
        setIsSubscribed(subscribed);
        
        const userid = await OneSignal.getUserId();
        setUserId(userid);
        setInitialized(true);
      }
    } catch (error) {
      console.error('OneSignal status check failed:', error);
    }
  };

  const subscribeToNotifications = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      // First, register for push notifications
      await OneSignal.registerForPushNotifications();
      
      // Then enable subscription
      await OneSignal.setSubscription(true);
      
      // Check status after a delay
      setTimeout(checkOneSignalStatus, 2000);
      
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to subscribe. Please check browser permissions.');
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromNotifications = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      await OneSignal.setSubscription(false);
      setIsSubscribed(false);
    } catch (error) {
      console.error('Unsubscribe error:', error);
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
        alert(`✅ Notification sent successfully!\nID: ${data.notificationId}`);
      } else {
        alert(`❌ Failed to send: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Request failed: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const sendToAllUsers = async () => {
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
          // No userId = send to all subscribed users
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Notification sent to all users!\nID: ${data.notificationId}`);
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Request failed: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ServiceWorkerSetup />
      
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            OneSignal Push Test
          </h1>
          <p className="text-gray-600">
            Fixed service worker issues - Should work now
          </p>
          <div className={`inline-block px-3 py-1 rounded-full text-sm mt-2 ${
            initialized ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {initialized ? '✅ Initialized' : '🔄 Initializing...'}
          </div>
        </div>

        {/* Subscription Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            1. Enable Push Notifications
          </h2>
          
          {!isSubscribed ? (
            <button
              onClick={subscribeToNotifications}
              disabled={loading || !initialized}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? '⏳ Processing...' : '🔔 Enable Push Notifications'}
            </button>
          ) : (
            <button
              onClick={unsubscribeFromNotifications}
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? '⏳ Processing...' : '🔕 Disable Notifications'}
            </button>
          )}

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Status:</strong> 
                <span className={isSubscribed ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                  {isSubscribed ? '✅ Subscribed' : '❌ Not Subscribed'}
                </span>
              </div>
              <div>
                <strong>Initialized:</strong> 
                <span className={initialized ? 'text-green-600 ml-2' : 'text-yellow-600 ml-2'}>
                  {initialized ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
            
            {userId && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Your User ID:</p>
                <code className="text-xs break-all text-blue-600">{userId}</code>
              </div>
            )}
          </div>
        </div>

        {/* Test Notification Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            2. Send Test Notifications
          </h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={sendTestNotification}
              disabled={sending || !isSubscribed}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 transition-colors"
            >
              {sending ? 'Sending...' : '📱 Send to Me'}
            </button>

            <button
              onClick={sendToAllUsers}
              disabled={sending}
              className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 transition-colors"
            >
              {sending ? 'Sending...' : '🌍 Send to All Users'}
            </button>
          </div>

          {!isSubscribed && (
            <p className="text-orange-600 text-sm mt-3 text-center">
              ⚠️ Please enable notifications first to test personal notifications
            </p>
          )}
        </div>

        {/* Troubleshooting Section */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 mb-3">Troubleshooting</h3>
          <ul className="text-sm text-yellow-700 space-y-2">
            <li>• Allow notifications when browser prompts</li>
            <li>• Make sure you're using HTTPS</li>
            <li>• Refresh page if initialization fails</li>
            <li>• Check browser console for detailed errors</li>
          </ul>
        </div>
      </div>
    </div>
  );
}