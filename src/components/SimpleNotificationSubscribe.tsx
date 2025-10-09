// components/SimpleNotificationSubscribe.tsx
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
  }, []);

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

      // Send subscription to your server (simplified - we'll use OneSignal API directly)
      await sendSubscriptionToServer(subscription);

      setIsSubscribed(true);
      setStatus('✅ Successfully subscribed! You will now receive notifications.');

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

  // Send subscription to server (simplified - we'll use direct API)
  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    try {
      // For now, we'll just log it since we're using OneSignal API directly
      console.log('Push subscription details:', {
        endpoint: subscription.endpoint,
        keys: subscription.toJSON().keys
      });
      
      setStatus('✅ Push subscription created! Testing notification...');
      
      // Test notification after subscription
      setTimeout(() => {
        testNotificationAfterSubscribe();
      }, 2000);
      
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  };

  // Test notification after successful subscription
  const testNotificationAfterSubscribe = async () => {
    if (!user) return;

    try {
      setStatus('Sending test notification...');
      
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Welcome to Notifications! 🎉',
          message: 'This is your first push notification. You are now subscribed!',
          userId: user.uid,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('✅ Test notification sent! Check your notifications.');
      } else {
        throw new Error(result.error || 'Failed to send test');
      }
    } catch (error: any) {
      console.error('Test notification error:', error);
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
      <h3 className="text-lg font-semibold mb-4 text-green-600">🔔 Simple Push Subscription</h3>
      
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Status:</strong> {status}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {isSubscribed ? 'Subscribed' : 'Not subscribed'}
          </p>
        </div>

        {!isSubscribed ? (
          <button
            onClick={subscribeToPush}
            disabled={loading}
            className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors font-semibold"
          >
            {loading ? 'Subscribing...' : 'Subscribe to Push Notifications'}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="p-3 bg-green-50 rounded border border-green-200">
              <p className="text-sm text-green-700">
                ✅ You are subscribed to push notifications!
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
            <strong>Note:</strong> This uses browser's native Push API instead of OneSignal SDK.
            More reliable and fewer errors.
          </p>
        </div>
      </div>
    </div>
  );
}