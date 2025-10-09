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

  // Initialize Pusher Beams
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

      // Set up token provider with proper error handling
      await beamsClient.setUserId(user.uid, {
        async fetchToken(userId) {
          addDebugInfo(`🔐 Fetching token for user: ${userId}`);
          
          try {
            const response = await fetch('/api/pusher/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userId }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const tokenData = await response.json();
            
            if (!tokenData.token) {
              throw new Error('No token received from server');
            }

            addDebugInfo('✅ Token received successfully');
            return tokenData.token;
            
          } catch (error: any) {
            addDebugInfo(`❌ Token fetch error: ${error.message}`);
            throw error;
          }
        },
        
        async onTokenInvalidated(userId) {
          addDebugInfo(`🔄 Token invalidated for user: ${userId}`);
        }
      });

      // Start beams client
      addDebugInfo('🔄 Starting Beams client...');
      await beamsClient.start();
      addDebugInfo('✅ Beams client started');

      // Check subscription state
      const state = await beamsClient.getRegistrationState();
      addDebugInfo(`📊 Registration state: ${state}`);

      const subscribed = state === 'PERMISSION_GRANTED';
      setIsSubscribed(subscribed);

      if (subscribed) {
        addDebugInfo('🎉 Pusher Beams initialized successfully! Ready to receive notifications.');
        
        // Get device info
        const deviceId = await beamsClient.getDeviceId();
        addDebugInfo(`📱 Device ID: ${deviceId}`);
        
        setStatus('success');
      } else {
        addDebugInfo('⚠️ Pusher initialized but notifications permission not granted');
        addDebugInfo('💡 Tip: Make sure notifications are allowed in browser settings');
        setStatus('error');
      }

    } catch (error: any) {
      console.error('Pusher initialization error:', error);
      addDebugInfo(`❌ Error: ${error.message}`);
      
      // More specific error messages
      if (error.message.includes('401')) {
        addDebugInfo('🔑 401 Error: Token authentication failed. Check Pusher credentials.');
      } else if (error.message.includes('JWT')) {
        addDebugInfo('🔑 JWT Error: Invalid token format. Server token generation issue.');
      }
      
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
        addDebugInfo(`📨 Notification ID: ${result.result?.publishId || 'Unknown'}`);
        
        // Show local notification for immediate feedback
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Test Sent ✅', {
            body: 'Notification sent to Pusher. Check your device.',
            icon: '/icons/icon-192x192.png'
          });
        }
      } else {
        addDebugInfo(`❌ Failed to send: ${result.error}`);
        
        if (result.error?.includes('401')) {
          addDebugInfo('🔑 401 Error: Check Pusher Secret Key configuration');
        }
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
        setStatus('idle');
      }
    } catch (error: any) {
      addDebugInfo(`❌ Error stopping Pusher: ${error.message}`);
    }
  };

  // Check Pusher credentials
  const checkCredentials = () => {
    addDebugInfo('🔑 Checking Pusher credentials...');
    addDebugInfo(`Instance ID: ${process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID ? '✅ Set' : '❌ Missing'}`);
    addDebugInfo(`Secret Key: ${process.env.PUSHER_BEAMS_SECRET_KEY ? '✅ Set' : '❌ Missing'}`);
    
    if (!process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID || !process.env.PUSHER_BEAMS_SECRET_KEY) {
      addDebugInfo('❌ Pusher credentials missing. Check environment variables.');
    } else {
      addDebugInfo('✅ Pusher credentials configured');
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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

            <button
              onClick={checkCredentials}
              className="bg-yellow-500 text-white py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors font-medium text-sm"
            >
              Check Credentials
            </button>

            <button
              onClick={clearPusherState}
              className="bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm"
            >
              Clear State
            </button>
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

        {/* Troubleshooting Section */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Common Issues & Solutions</h3>
            <div className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-1">401 Unauthorized Error</h4>
                <p className="text-red-700 text-sm">
                  This means Pusher can't verify your token. Solutions:
                </p>
                <ul className="text-red-700 text-sm mt-1 space-y-1 list-disc list-inside">
                  <li>Check if Pusher Beams Secret Key is correct</li>
                  <li>Verify Instance ID matches your Pusher dashboard</li>
                  <li>Ensure server-side token generation is working</li>
                </ul>
              </div>
              
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-1">Permission Issues</h4>
                <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside">
                  <li>Make sure browser notifications are allowed</li>
                  <li>Check if service worker is properly registered</li>
                  <li>Try in incognito mode to rule out extensions</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Verification Steps</h3>
            <ol className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0">1</span>
                <span>Click "Check Credentials" to verify environment variables</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0">2</span>
                <span>Click "Initialize Pusher" and check debug logs</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0">3</span>
                <span>If 401 error appears, check Pusher dashboard settings</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0">4</span>
                <span>Once initialized, send test notification</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}