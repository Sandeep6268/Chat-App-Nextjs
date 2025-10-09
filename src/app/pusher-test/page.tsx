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
    permission: 'default' as NotificationPermission | 'not-supported',
    pusherLoaded: false
  });

  const addDebugInfo = (info: string) => {
    console.log(info);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  // Check browser support
  useEffect(() => {
    const checkBrowserSupport = () => {
      const supportsNotifications = typeof window !== 'undefined' && 'Notification' in window;
      const supportsServiceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
      const permission = supportsNotifications ? Notification.permission : 'not-supported';
      const pusherLoaded = typeof window !== 'undefined' && typeof window.PusherPushNotifications !== 'undefined';
      
      setBrowserInfo({
        notificationSupport: supportsNotifications,
        serviceWorkerSupport: supportsServiceWorker,
        permission,
        pusherLoaded
      });

      addDebugInfo(`🌐 Browser check completed`);
      addDebugInfo(`🔔 Notification permission: ${permission}`);
      addDebugInfo(`📦 Pusher SDK: ${pusherLoaded ? 'Loaded ✅' : 'Not loaded ❌'}`);
    };

    checkBrowserSupport();
  }, []);

  // CORRECTED: Check if user is properly subscribed
  const checkSubscriptionStatus = async (beamsClient: any) => {
    try {
      const state = await beamsClient.getRegistrationState();
      addDebugInfo(`📊 Registration state: ${state}`);
      
      // CORRECTED: Check for all possible "granted" states
      const isGranted = [
        'PERMISSION_GRANTED',
        'PERMISSION_GRANTED_REGISTERED_WITH_BEAMS',
        'PERMISSION_GRANTED_NOT_REGISTERED_WITH_BEAMS'
      ].includes(state);
      
      setIsSubscribed(isGranted);
      return isGranted;
    } catch (error) {
      addDebugInfo(`❌ Error checking subscription: ${error}`);
      return false;
    }
  };

  // Initialize Pusher Beams - FIXED VERSION
  const initializePusher = async () => {
    if (!user) {
      addDebugInfo('❌ User not logged in');
      return;
    }

    if (!browserInfo.pusherLoaded) {
      addDebugInfo('❌ Pusher SDK not loaded');
      return;
    }

    setStatus('loading');
    addDebugInfo('🚀 Starting Pusher Beams...');

    try {
      // Register service worker
      if (browserInfo.serviceWorkerSupport) {
        addDebugInfo('📋 Registering service worker...');
        await navigator.serviceWorker.register('/service-worker.js');
        addDebugInfo('✅ Service Worker registered');
      }

      // Create beams client
      const beamsClient = new window.PusherPushNotifications.Client({
        instanceId: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID!,
      });

      // Start beams client
      addDebugInfo('🔄 Starting Beams client...');
      await beamsClient.start();
      addDebugInfo('✅ Beams client started');

      // CORRECTED: Check subscription status properly
      const isGranted = await checkSubscriptionStatus(beamsClient);

      if (isGranted) {
        addDebugInfo('🎉 Pusher Beams ready! You can receive notifications.');
        setStatus('success');
        
        // Get device info
        try {
          const deviceId = await beamsClient.getDeviceId();
          addDebugInfo(`📱 Device ID: ${deviceId}`);
        } catch (error) {
          addDebugInfo(`ℹ️ Could not get device ID: ${error}`);
        }
      } else {
        addDebugInfo('❌ Notifications not granted. Please allow notifications.');
        setStatus('error');
      }

    } catch (error: any) {
      addDebugInfo(`❌ Error: ${error.message}`);
      setStatus('error');
    }
  };

  // Send test notification - FIXED
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
          body: 'This is a test notification from your chat app! Click to open.',
          data: {
            url: typeof window !== 'undefined' ? window.location.origin : '',
            type: 'test',
            timestamp: new Date().toISOString()
          }
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        addDebugInfo('✅ Notification sent successfully!');
        addDebugInfo(`📨 Notification ID: ${result.result?.publishId || 'Sent'}`);
        
        // Show local success notification
        if (browserInfo.permission === 'granted') {
          new Notification('Test Sent ✅', {
            body: 'Check if push notification arrived',
            icon: '/icons/icon-192x192.png'
          });
        }
      } else {
        addDebugInfo(`❌ Failed: ${result.error}`);
      }

      setStatus('success');
    } catch (error: any) {
      addDebugInfo(`❌ Error: ${error.message}`);
      setStatus('error');
    }
  };

  // Clear everything
  const clearAll = async () => {
    try {
      if (window.PusherPushNotifications) {
        const beamsClient = new window.PusherPushNotifications.Client({
          instanceId: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID!,
        });
        await beamsClient.clearAllState();
        addDebugInfo('🧹 Pusher state cleared');
      }
      setDebugInfo([]);
      setIsSubscribed(false);
      setStatus('idle');
    } catch (error: any) {
      addDebugInfo(`❌ Clear error: ${error.message}`);
    }
  };

  // Check current status - FIXED
  const checkStatus = async () => {
    if (!window.PusherPushNotifications) {
      addDebugInfo('❌ Pusher SDK not available');
      return;
    }

    try {
      const beamsClient = new window.PusherPushNotifications.Client({
        instanceId: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID!,
      });
      
      await checkSubscriptionStatus(beamsClient);
      addDebugInfo('🔍 Status check completed');
    } catch (error: any) {
      addDebugInfo(`❌ Status check failed: ${error.message}`);
    }
  };

  // Manual permission request
  const requestPermission = async () => {
    if (!browserInfo.notificationSupport) {
      addDebugInfo('❌ Notifications not supported');
      return;
    }

    try {
      addDebugInfo('🔔 Requesting notification permission...');
      const permission = await Notification.requestPermission();
      
      setBrowserInfo(prev => ({ ...prev, permission }));
      addDebugInfo(`✅ Permission result: ${permission}`);
      
      if (permission === 'granted') {
        // Re-initialize after permission granted
        setTimeout(() => initializePusher(), 1000);
      }
    } catch (error: any) {
      addDebugInfo(`❌ Permission request failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
              ← Back to Chat
            </button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Pusher Beams Test</h1>
          <p className="text-gray-600">Test push notifications with Pusher Beams</p>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 mb-8">
          {/* Status Card */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Current Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="font-medium">User:</span> {user ? '✅ Logged In' : '❌ Not Logged In'}</div>
              <div><span className="font-medium">Subscription:</span> {isSubscribed ? '✅ Active' : '❌ Inactive'}</div>
              <div><span className="font-medium">Permission:</span> {browserInfo.permission === 'granted' ? '✅ Granted' : '❌ Not Granted'}</div>
              <div><span className="font-medium">Pusher SDK:</span> {browserInfo.pusherLoaded ? '✅ Loaded' : '❌ Not Loaded'}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <button
              onClick={initializePusher}
              disabled={status === 'loading' || !user || !browserInfo.pusherLoaded}
              className="bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium text-sm"
            >
              {status === 'loading' ? 'Initializing...' : 'Initialize Pusher'}
            </button>

            <button
              onClick={sendTestNotification}
              disabled={status === 'loading' || !isSubscribed}
              className="bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors font-medium text-sm"
            >
              Send Test
            </button>

            <button
              onClick={requestPermission}
              disabled={browserInfo.permission === 'granted'}
              className="bg-yellow-500 text-white py-3 px-4 rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors font-medium text-sm"
            >
              Request Permission
            </button>

            <button
              onClick={checkStatus}
              className="bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600 transition-colors font-medium text-sm"
            >
              Check Status
            </button>

            <button
              onClick={clearAll}
              className="bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm"
            >
              Clear All
            </button>
          </div>

          {/* Debug Info */}
          <div className="border border-gray-200 rounded-lg">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Debug Information</h3>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              {debugInfo.length === 0 ? (
                <div className="text-gray-500 text-center py-8">Click buttons above to start testing</div>
              ) : (
                debugInfo.map((info, index) => (
                  <div key={index} className="text-sm border-b border-gray-100 py-2 font-mono">
                    {info}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Troubleshooting Guide */}
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Troubleshooting Guide</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">If "Send Test" button is disabled:</h4>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>• Click "Initialize Pusher" first</li>
                <li>• Allow notifications when browser asks</li>
                <li>• If permission was denied earlier, click "Request Permission"</li>
                <li>• Check that subscription status shows "Active"</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Common Issues:</h4>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>• Clear browser cache and cookies</li>
                <li>• Try in incognito mode</li>
                <li>• Check browser notification settings</li>
                <li>• Use "Clear All" to reset everything</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


