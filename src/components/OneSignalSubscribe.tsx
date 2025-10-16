// components/OneSignalSubscribe.tsx
'use client';
import { useState, useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { isSubscribed, getOneSignalUserId } from '@/lib/onesignal';

export default function OneSignalSubscribe() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const subscribed = await OneSignal.isPushNotificationsEnabled();
      setIsSubscribed(subscribed);
      
      const userid = await OneSignal.getUserId();
      setUserId(userid);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const subscribeToNotifications = async () => {
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
        
        // Check status after subscription
        setTimeout(checkSubscriptionStatus, 1000);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Error managing notifications');
    } finally {
      setLoading(false);
    }
  };

  const manualPrompt = async () => {
    try {
      await OneSignal.showSlidedownPrompt();
      setTimeout(checkSubscriptionStatus, 2000);
    } catch (error) {
      console.error('Prompt error:', error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-800">Push Notifications</h3>
      
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={subscribeToNotifications}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
            isSubscribed 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-green-500 hover:bg-green-600'
          } disabled:opacity-50`}
        >
          {loading ? '⏳ Processing...' : 
           isSubscribed ? '🔕 Disable Notifications' : '🔔 Enable Notifications'}
        </button>

        <button
          onClick={manualPrompt}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          🎯 Show Permission Prompt
        </button>
      </div>

      {/* Status Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg w-full">
        <p className="text-sm text-gray-600">
          <strong>Status:</strong> {isSubscribed ? '✅ Subscribed' : '❌ Not Subscribed'}
        </p>
        {userId && (
          <p className="text-sm text-gray-600 break-all">
            <strong>User ID:</strong> {userId}
          </p>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center">
        You'll receive push notifications for new messages
      </p>
    </div>
  );
}