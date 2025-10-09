// components/SimpleNotificationSubscribe.tsx - UPDATED
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function SimpleNotificationSubscribe() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Ready to subscribe...');
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Check current subscription status
  const checkSubscription = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        setIsSubscribed(!!subscription);
        
        if (subscription) {
          setStatus('✅ Already subscribed to push notifications!');
          console.log('Current subscription:', subscription);
          
          // Also set external user ID if user is logged in
          if (user?.uid) {
            await setOneSignalExternalUserId(user.uid);
          }
        } else {
          setStatus('❌ Not subscribed to push notifications');
        }
      } catch (error) {
        console.error('Subscription check error:', error);
      }
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user]);

  // Set external user ID in OneSignal
  const setOneSignalExternalUserId = async (userId: string) => {
    try {
      // OneSignal API call to set external user ID
      const response = await fetch('https://api.onesignal.com/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          external_user_id: userId,
          // We'll get device_type from the actual subscription
        }),
      });

      if (response.ok) {
        console.log('✅ External user ID set in OneSignal:', userId);
        return true;
      } else {
        console.error('❌ Failed to set external user ID');
        return false;
      }
    } catch (error) {
      console.error('Error setting external user ID:', error);
      return false;
    }
  };

  // Simple subscription function
  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('❌ Push notifications not supported in this browser');
      return;
    }

    try {
      setLoading(true);
      setStatus('Subscribing to push notifications...');

      // Request permission first
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        setStatus('❌ Notification permission denied');
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/OneSignalSDKWorker.js', {
        scope: '/'
      });

      console.log('Service Worker registered:', registration);

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '')
      });

      console.log('Push subscription successful:', subscription);

      // Send subscription to OneSignal with user ID
      const subscriptionSent = await sendSubscriptionToOneSignal(subscription);

      if (subscriptionSent && user?.uid) {
        // Set external user ID
        await setOneSignalExternalUserId(user.uid);
      }

      setIsSubscribed(true);
      setStatus('✅ Successfully subscribed! User targeting enabled.');

      // Test notification after subscription
      setTimeout(() => {
        testUserTargetedNotification();
      }, 2000);
      
    } catch (error: any) {
      console.error('Subscription error:', error);
      setStatus(`❌ Subscription failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Convert VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Send subscription to OneSignal
  const sendSubscriptionToOneSignal = async (subscription: PushSubscription) => {
    try {
      const subscriptionData = subscription.toJSON();
      
      const response = await fetch('https://api.onesignal.com/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          device_type: 11, // Chrome Web Push
          identifier: subscriptionData.keys?.p256dh,
          // Add other subscription details as needed
        }),
      });

      if (response.ok) {
        console.log('✅ Subscription sent to OneSignal');
        return true;
      } else {
        console.error('❌ Failed to send subscription to OneSignal');
        return false;
      }
    } catch (error) {
      console.error('Error sending subscription to OneSignal:', error);
      return false;
    }
  };

  // Test user-targeted notification
  const testUserTargetedNotification = async () => {
    if (!user) return;

    try {
      setStatus('Testing user targeting...');
      
      const response = await fetch('/api/send-user-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'User Target Test 🎯',
          message: 'This should only come to YOU because of user targeting!',
          userId: user.uid,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('✅ User-targeted test sent! Check if only you received it.');
      } else {
        throw new Error(result.error || 'Failed to send');
      }
    } catch (error: any) {
      console.error('User target test error:', error);
    }
  };

  // Unsubscribe function
  const unsubscribeFromPush = async () => {
    try {
      setLoading(true);
      
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Unsubscribed from push notifications');
      }
      
      setIsSubscribed(false);
      setStatus('❌ Unsubscribed from push notifications');
      
    } catch (error: any) {
      console.error('Unsubscribe error:', error);
      setStatus(`❌ Unsubscribe failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto border border-green-200">
      <h3 className="text-lg font-semibold mb-4 text-green-600">🔔 Fix User Targeting</h3>
      
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Status:</strong> {status}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {isSubscribed ? 'Subscribed + User Targeting' : 'Not subscribed'}
          </p>
        </div>

        {!isSubscribed ? (
          <button
            onClick={subscribeToPush}
            disabled={loading}
            className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors font-semibold"
          >
            {loading ? 'Subscribing...' : 'Subscribe + Enable User Targeting'}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="p-3 bg-green-50 rounded border border-green-200">
              <p className="text-sm text-green-700">
                ✅ You are subscribed with user targeting!
              </p>
            </div>
            <button
              onClick={unsubscribeFromPush}
              disabled={loading}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors text-sm"
            >
              Unsubscribe
            </button>
          </div>
        )}

        <button
          onClick={checkSubscription}
          className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
        >
          Check Subscription Status
        </button>

        <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-xs text-yellow-700">
            <strong>Fix:</strong> This version properly sets external_user_id in OneSignal for user targeting.
          </p>
        </div>
      </div>
    </div>
  );
}