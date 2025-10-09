// components/SubscribeToNotifications.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

declare global {
  interface Window {
    OneSignal: any;
  }
}

export default function SubscribeToNotifications() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [oneSignalReady, setOneSignalReady] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
    
    // Check every 2 seconds if OneSignal is ready
    const interval = setInterval(() => {
      if (window.OneSignal) {
        setOneSignalReady(true);
        checkSubscriptionStatus();
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [user]);

  const checkSubscriptionStatus = async () => {
    if (window.OneSignal) {
      try {
        const userId = await window.OneSignal.getUserId();
        setIsSubscribed(!!userId);
        
        if (userId) {
          console.log('✅ User subscribed to OneSignal. ID:', userId);
        }
      } catch (error) {
        console.error('Subscription check error:', error);
      }
    }
  };

  const subscribeToNotifications = async () => {
    if (!window.OneSignal) {
      alert('OneSignal not loaded. Please refresh the page.');
      return;
    }

    try {
      // Method 1: Try slidedown prompt
      if (window.OneSignal.Slidedown) {
        window.OneSignal.Slidedown.promptPush();
      } 
      // Method 2: Direct subscription
      else {
        const permission = await window.OneSignal.Notifications.requestPermission();
        
        if (permission === 'granted') {
          console.log('✅ Notification permission granted');
          
          // Set external user ID
          if (user?.uid) {
            await window.OneSignal.setExternalUserId(user.uid);
          }
          
          await checkSubscriptionStatus();
        } else {
          alert('Please allow notifications to receive chat messages.');
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Error subscribing to notifications. Please try again.');
    }
  };

  const unsubscribeFromNotifications = async () => {
    if (window.OneSignal) {
      try {
        await window.OneSignal.setSubscription(false);
        setIsSubscribed(false);
        console.log('❌ User unsubscribed from OneSignal');
      } catch (error) {
        console.error('Unsubscribe error:', error);
      }
    }
  };

  if (!oneSignalReady) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Loading notification service...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">🔔 Notification Subscription</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Status: {isSubscribed ? '✅ Subscribed' : '❌ Not Subscribed'}</p>
            <p className="text-sm text-gray-600">
              {isSubscribed 
                ? 'You will receive chat notifications' 
                : 'Subscribe to receive chat notifications'
              }
            </p>
          </div>
        </div>

        {!isSubscribed ? (
          <button
            onClick={subscribeToNotifications}
            className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            Subscribe to Notifications
          </button>
        ) : (
          <div className="space-y-2">
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-700 text-sm">
                ✅ You are subscribed to notifications. You will receive chat messages.
              </p>
            </div>
            <button
              onClick={unsubscribeFromNotifications}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              Unsubscribe
            </button>
          </div>
        )}

        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-700 text-xs">
            <strong>Note:</strong> You need to subscribe to receive OneSignal notifications. 
            Browser notifications will work without subscription, but chat notifications won't.
          </p>
        </div>
      </div>
    </div>
  );
}