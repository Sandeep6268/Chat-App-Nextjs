// app/pusher-test/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';

declare global {
  interface Window {
    PusherPushNotifications?: any;
  }
}

export default function PusherTestPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [browserInfo, setBrowserInfo] = useState({
    notificationSupport: false,
    serviceWorkerSupport: false,
    permission: 'default',
    pusherLoaded: false
  });

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  // Check browser support on client side only
  useEffect(() => {
    const checkBrowserSupport = () => {
      const supportsNotifications = 'Notification' in window;
      const supportsServiceWorker = 'serviceWorker' in navigator;
      const permission = supportsNotifications ? Notification.permission : 'not-supported';
      const pusherLoaded = typeof window.PusherPushNotifications !== 'undefined';
      
      setBrowserInfo({
        notificationSupport: supportsNotifications,
        serviceWorkerSupport: supportsServiceWorker,
        permission,
        pusherLoaded
      });

      addDebugInfo(`🌐 Browser: ${navigator.userAgent}`);
      addDebugInfo(`🔔 Notification support: ${supportsNotifications ? 'Yes' : 'No'}`);
      addDebugInfo(`📱 Service Worker: ${supportsServiceWorker ? 'Supported' : 'Not supported'}`);
      addDebugInfo(`🔐 Notification permission: ${permission}`);
      addDebugInfo(`📦 Pusher SDK: ${pusherLoaded ? 'Loaded' : 'Not loaded'}`);

      // Auto-register service worker if supported
      if (supportsServiceWorker && permission === 'granted') {
        registerServiceWorker();
      }
    };

    checkBrowserSupport();
  }, []);

  // Register service worker
  const registerServiceWorker = async () => {
    try {
      addDebugInfo('📋 Registering service worker...');
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      addDebugInfo('✅ Service Worker registered successfully');
      
      // Check if service worker is active
      if (registration.active) {
        addDebugInfo('🟢 Service Worker is active and ready');
      }
      
      return registration;
    } catch (error: any) {
      addDebugInfo(`❌ Service Worker registration failed: ${error.message}`);
      return null;
    }
  };

  // Initialize Pusher Beams with CORRECT token provider
  const initializePusher = async () => {
    if (!user) {
      addDebugInfo('❌ User not logged in');
      return;
    }

    if (!browserInfo.notificationSupport) {
      addDebugInfo('❌ Browser does not support notifications');
      return;
    }

    setStatus('loading');
    addDebugInfo('🚀 Initializing Pusher Beams...');

    try {
      // Check if Pusher is available
      if (!window.PusherPushNotifications) {
        addDebugInfo('❌ Pusher SDK not loaded');
        setStatus('error');
        return;
      }

      // Register service worker first
      const swRegistration = await registerServiceWorker();
      if (!swRegistration) {
        throw new Error('Service Worker registration failed');
      }

      // Create beams client
      const beamsClient = new window.PusherPushNotifications.Client({
        instanceId: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID!,
      });

      // CORRECTED: Set up proper token provider
      beamsClient.setUserId(user.uid, {
        async fetchToken(userId) {
          addDebugInfo(`🔐 Fetching token for user: ${userId}`);
          
          const response = await fetch('/api/pusher/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to get token');
          }

          const tokenData = await response.json();
          addDebugInfo('✅ Token received successfully');
          
          return tokenData.token;
        },
        
        async onTokenInvalidated(userId) {
          addDebugInfo(`🔄 Token invalidated for user: ${userId}`);
          // You can re-fetch token here if needed
        }
      });

      // Start beams client
      await beamsClient.start();
      addDebugInfo('✅ Beams client started');

      // Check subscription state
      const state = await beamsClient.getRegistrationState();
      addDebugInfo(`📊 Registration state: ${state}`);

      setIsSubscribed(state === 'PERMISSION_GRANTED');
      setStatus('success');
      
      if (state === 'PERMISSION_GRANTED') {
        addDebugInfo('🎉 Pusher Beams initialized successfully! Ready to receive notifications.');
        
        // Get device info
        const deviceId = await beamsClient.getDeviceId();
        addDebugInfo(`📱 Device ID: ${deviceId}`);
      } else {
        addDebugInfo('⚠️ Pusher initialized but notifications not granted');
      }

    } catch (error: any) {
      console.error('Pusher initialization error:', error);
      addDebugInfo(`❌ Error: ${error.message}`);
      setStatus('error');
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    if (!user) return;

    setStatus('loading');
    addDebugInfo('📤 Sending test notification...');

    try {
      const response = await fetch('/api/pusher/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          title: 'Test Notification 🎉',
          body: 'This is a test notification from Pusher Beams! Click to open the chat app.',
          data: {
            test: true,
            timestamp: new Date().toISOString(),
            url: window.location.origin,
            type: 'test_notification'
          }
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        addDebugInfo('✅ Test notification sent successfully!');
        addDebugInfo(`📨 Notification ID: ${result.result.publishId}`);
        
        // Show local notification for immediate feedback
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Test Sent ✅', {
            body: 'Notification sent to Pusher. Check your device.',
            icon: '/icons/icon-192x192.png'
          });
        }
      } else {
        addDebugInfo(`❌ Failed to send: ${result.error}`);
      }

      setStatus('success');
    } catch (error: any) {
      addDebugInfo(`❌ Error sending notification: ${error.message}`);
      setStatus('error');
    }
  };

  // Clear state
  const clearPusherState = async () => {
    try {
      if (window.PusherPushNotifications) {
        const beamsClient = new window.PusherPushNotifications.Client({
          instanceId: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID!,
        });
        
        await beamsClient.clearAllState();
        addDebugInfo('🧹 Pusher state cleared');
        setIsSubscribed(false);
        setStatus('idle');
      }
    } catch (error: any) {
      addDebugInfo(`❌ Error clearing state: ${error.message}`);
    }
  };

  // Request notification permission manually
  const requestPermission = async () => {
    if (!browserInfo.notificationSupport) {
      addDebugInfo('❌ Notifications not supported in this browser');
      return;
    }

    try {
      addDebugInfo('🔔 Requesting notification permission...');
      const permission = await Notification.requestPermission();
      
      setBrowserInfo(prev => ({ ...prev, permission }));
      addDebugInfo(`✅ Permission result: ${permission}`);
      
      if (permission === 'granted') {
        // Register service worker and re-initialize Pusher
        await registerServiceWorker();
        setTimeout(() => initializePusher(), 1000);
      }
    } catch (error: any) {
      addDebugInfo(`❌ Error requesting permission: ${error.message}`);
    }
  };

  // Stop Pusher Beams
  const stopPusher = async () => {
    try {
      if (window.PusherPushNotifications) {
        const beamsClient = new window.PusherPushNotifications.Client({
          instanceId: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID!,
        });
        
        await beamsClient.stop();
        addDebugInfo('🛑 Pusher Beams stopped');
        setIsSubscribed(false);
      }
    } catch (error: any) {
      addDebugInfo(`❌ Error stopping Pusher: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
              ← Back to Chat
            </button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Pusher Beams Test
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Test push notifications with Pusher Beams before integrating into your chat app
          </p>
        </div>

        {/* Main Test Container */}
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 mb-8">
          {/* User Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">System Status</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <div>
                  <span className="font-medium">User:</span>{' '}
                  {user ? (
                    <span className="text-green-600">Logged In ✅</span>
                  ) : (
                    <span className="text-red-600">Not Logged In ❌</span>
                  )}
                </div>
                <div>
                  <span className="font-medium">Pusher SDK:</span>{' '}
                  <span className={browserInfo.pusherLoaded ? 'text-green-600' : 'text-red-600'}>
                    {browserInfo.pusherLoaded ? 'Loaded ✅' : 'Not Loaded ❌'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Notifications:</span>{' '}
                  <span className={browserInfo.notificationSupport ? 'text-green-600' : 'text-red-600'}>
                    {browserInfo.notificationSupport ? 'Supported ✅' : 'Not Supported ❌'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Permission:</span>{' '}
                  <span className={
                    browserInfo.permission === 'granted' ? 'text-green-600' : 
                    browserInfo.permission === 'denied' ? 'text-red-600' : 'text-yellow-600'
                  }>
                    {browserInfo.permission}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Service Worker:</span>{' '}
                  <span className={browserInfo.serviceWorkerSupport ? 'text-green-600' : 'text-red-600'}>
                    {browserInfo.serviceWorkerSupport ? 'Supported ✅' : 'Not Supported ❌'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Subscription:</span>{' '}
                  <span className={isSubscribed ? 'text-green-600' : 'text-red-600'}>
                    {isSubscribed ? 'Active ✅' : 'Inactive ❌'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            <button
              onClick={initializePusher}
              disabled={status === 'loading' || !user || !browserInfo.pusherLoaded}
              className="bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium text-sm"
            >
              {status === 'loading' ? 'Initializing...' : 'Initialize Pusher'}
            </button>

            <button
              onClick={sendTestNotification}
              disabled={status === 'loading' || !isSubscribed || browserInfo.permission !== 'granted'}
              className="bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors font-medium text-sm"
            >
              Send Test Notification
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={clearPusherState}
                className="bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm"
              >
                Clear State
              </button>
              <button
                onClick={stopPusher}
                className="bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors font-medium text-sm"
              >
                Stop Beams
              </button>
            </div>
          </div>

          {/* Debug Information */}
          <div className="border border-gray-200 rounded-lg">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800 flex items-center justify-between">
                Debug Information
                <button
                  onClick={() => setDebugInfo([])}
                  className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded transition-colors"
                >
                  Clear Log
                </button>
              </h3>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              {debugInfo.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  No debug information yet. Click "Initialize Pusher" to start.
                </div>
              ) : (
                debugInfo.map((info, index) => (
                  <div key={index} className="font-mono text-sm border-b border-gray-100 py-2 last:border-b-0">
                    {info}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Testing Steps</h3>
            <ol className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0">1</span>
                <span>Make sure you're logged in to your chat app</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0">2</span>
                <span>Click "Initialize Pusher" to set up push notifications</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0">3</span>
                <span>Allow browser notifications when prompted</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0">4</span>
                <span>Click "Send Test Notification" to verify it works</span>
              </li>
            </ol>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Troubleshooting</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center">
                <span className="text-yellow-500 mr-2">⚠️</span>
                If "Initialize Pusher" fails, try "Clear State" and restart
              </li>
              <li className="flex items-center">
                <span className="text-yellow-500 mr-2">⚠️</span>
                Make sure notifications are allowed in browser settings
              </li>
              <li className="flex items-center">
                <span className="text-yellow-500 mr-2">⚠️</span>
                Check that service worker is registered (see debug log)
              </li>
              <li className="flex items-center">
                <span className="text-yellow-500 mr-2">⚠️</span>
                Try refreshing the page if issues persist
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}