// components/OneSignalSubscribe.tsx
'use client';
import { useState, useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalSubscribe() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const subscribed = await OneSignal.isPushNotificationsEnabled();
      setIsSubscribed(subscribed);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const toggleSubscription = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      if (isSubscribed) {
        // Unsubscribe
        await OneSignal.setSubscription(false);
        setIsSubscribed(false);
      } else {
        // Subscribe
        await OneSignal.registerForPushNotifications();
        await OneSignal.setSubscription(true);
        
        // Check status after a delay
        setTimeout(checkSubscription, 1000);
      }
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  const showPrompt = async () => {
    try {
      await OneSignal.showSlidedownPrompt();
    } catch (error) {
      console.error('Prompt error:', error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Push Notifications</h3>
      
      <div className="space-y-3">
        <button
          onClick={toggleSubscription}
          disabled={loading}
          className={`w-full py-2 px-4 rounded-lg font-medium ${
            isSubscribed 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          } disabled:opacity-50`}
        >
          {loading ? 'Processing...' : 
           isSubscribed ? '🔕 Disable Notifications' : '🔔 Enable Notifications'}
        </button>

        <button
          onClick={showPrompt}
          className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
        >
          Show Permission Prompt
        </button>
      </div>

      <div className="mt-4 p-3 bg-gray-100 rounded-lg">
        <p className="text-sm">
          Status: <strong>{isSubscribed ? '✅ Subscribed' : '❌ Not Subscribed'}</strong>
        </p>
      </div>
    </div>
  );
}