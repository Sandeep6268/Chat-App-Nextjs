'use client';

import { useState, useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalTestPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [customUserId, setCustomUserId] = useState<string>('');
  const [tags, setTags] = useState<Record<string, string>>({});
  const [notificationTitle, setNotificationTitle] = useState('Test Notification');
  const [notificationMessage, setNotificationMessage] = useState('This is a test notification from OneSignal!');

  useEffect(() => {
    const checkOneSignalStatus = async () => {
      try {
        const currentUserId = await OneSignal.getUserId();
        const subscription = await OneSignal.User.PushSubscription.getOptedIn();
        const permission = Notification.permission;

        setUserId(currentUserId);
        setIsSubscribed(subscription);
        setNotificationPermission(permission);

        // Get current tags
        const currentTags = await OneSignal.User.getTags();
        setTags(currentTags || {});
      } catch (error) {
        console.error('Error checking OneSignal status:', error);
      }
    };

    // Check status after a delay to ensure OneSignal is initialized
    const timer = setTimeout(checkOneSignalStatus, 2000);
    return () => clearTimeout(timer);
  }, []);

  const requestPermission = async () => {
    try {
      await OneSignal.Notifications.requestPermission();
      const permission = Notification.permission;
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        const subscription = await OneSignal.User.PushSubscription.getOptedIn();
        setIsSubscribed(subscription);
        const currentUserId = await OneSignal.getUserId();
        setUserId(currentUserId);
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const showSlidedownPrompt = async () => {
    try {
      await OneSignal.showSlidedownPrompt();
    } catch (error) {
      console.error('Error showing slidedown prompt:', error);
    }
  };

  const setCustomId = async () => {
    if (customUserId.trim()) {
      try {
        await OneSignal.setExternalUserId(customUserId);
        alert(`Custom User ID set to: ${customUserId}`);
        setCustomUserId('');
      } catch (error) {
        console.error('Error setting custom user ID:', error);
      }
    }
  };

  const removeCustomId = async () => {
    try {
      await OneSignal.removeExternalUserId();
      alert('Custom User ID removed');
    } catch (error) {
      console.error('Error removing custom user ID:', error);
    }
  };

  const addTag = async () => {
    const key = prompt('Enter tag key:');
    const value = prompt('Enter tag value:');
    
    if (key && value) {
      try {
        await OneSignal.User.addTag(key, value);
        const currentTags = await OneSignal.User.getTags();
        setTags(currentTags || {});
        alert(`Tag ${key}=${value} added successfully`);
      } catch (error) {
        console.error('Error adding tag:', error);
      }
    }
  };

  const removeTag = async () => {
    const key = prompt('Enter tag key to remove:');
    
    if (key) {
      try {
        await OneSignal.User.removeTag(key);
        const currentTags = await OneSignal.User.getTags();
        setTags(currentTags || {});
        alert(`Tag ${key} removed successfully`);
      } catch (error) {
        console.error('Error removing tag:', error);
      }
    }
  };

  const sendTestNotification = async () => {
    try {
      const response = await fetch('/api/onesignal/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: notificationTitle,
          message: notificationMessage,
          userId: userId,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Test notification sent successfully!');
      } else {
        alert('Failed to send notification: ' + result.error);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Error sending test notification');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          OneSignal Push Notification Test
        </h1>

        {/* Status Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="space-y-2">
            <p><strong>User ID:</strong> {userId || 'Not available'}</p>
            <p><strong>Subscription Status:</strong> {isSubscribed ? 'Subscribed' : 'Not Subscribed'}</p>
            <p><strong>Notification Permission:</strong> {notificationPermission}</p>
            <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
          </div>
        </div>

        {/* Permission Section */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Permission Management</h2>
          <div className="space-y-2">
            <button
              onClick={requestPermission}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
            >
              Request Notification Permission
            </button>
            <button
              onClick={showSlidedownPrompt}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
            >
              Show Slidedown Prompt
            </button>
          </div>
        </div>

        {/* Custom User ID Section */}
        <div className="mb-6 p-4 bg-purple-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Custom User ID</h2>
          <div className="space-y-2">
            <input
              type="text"
              value={customUserId}
              onChange={(e) => setCustomUserId(e.target.value)}
              placeholder="Enter custom user ID"
              className="w-full p-2 border border-gray-300 rounded"
            />
            <div className="flex space-x-2">
              <button
                onClick={setCustomId}
                className="flex-1 bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 transition-colors"
              >
                Set Custom ID
              </button>
              <button
                onClick={removeCustomId}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
              >
                Remove Custom ID
              </button>
            </div>
          </div>
        </div>

        {/* Tags Section */}
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Tags Management</h2>
          <div className="space-y-2">
            <div className="flex space-x-2 mb-2">
              <button
                onClick={addTag}
                className="flex-1 bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition-colors"
              >
                Add Tag
              </button>
              <button
                onClick={removeTag}
                className="flex-1 bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 transition-colors"
              >
                Remove Tag
              </button>
            </div>
            {Object.keys(tags).length > 0 && (
              <div>
                <h3 className="font-semibold">Current Tags:</h3>
                <pre className="bg-white p-2 rounded border">
                  {JSON.stringify(tags, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Test Notification Section */}
        <div className="p-4 bg-green-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Notification</h2>
          <div className="space-y-2">
            <input
              type="text"
              value={notificationTitle}
              onChange={(e) => setNotificationTitle(e.target.value)}
              placeholder="Notification Title"
              className="w-full p-2 border border-gray-300 rounded"
            />
            <textarea
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              placeholder="Notification Message"
              className="w-full p-2 border border-gray-300 rounded"
              rows={3}
            />
            <button
              onClick={sendTestNotification}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
            >
              Send Test Notification
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Testing Instructions:</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click "Request Notification Permission" to enable push notifications</li>
            <li>Use "Show Slidedown Prompt" for the native OneSignal prompt</li>
            <li>Set a custom user ID to identify this device</li>
            <li>Add tags for targeted notifications</li>
            <li>Send a test notification to see if it works</li>
            <li>Check browser console for detailed logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}