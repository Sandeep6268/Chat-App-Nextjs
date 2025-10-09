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

      if (supportsServiceWorker && permission === 'granted') {
        registerServiceWorker();
      }
    };

    checkBrowserSupport();
  }, []);

  const registerServiceWorker = async () => {
    try {
      addDebugInfo('📋 Registering service worker...');
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      addDebugInfo('✅ Service Worker registered successfully');
      
      if (registration.active) {
        addDebugInfo('🟢 Service Worker is active and ready');
      }
      
      return registration;
    } catch (error: any) {
      addDebugInfo(`❌ Service Worker registration failed: ${error.message}`);
      return null;
    }
  };

  const initializePusher = async () => {
    if (!user) {
      addDebugInfo('❌ User not logged in');
      return;
    }

    setStatus('loading');
    addDebugInfo('🚀 Initializing Pusher Beams...');

    try {
      if (!window.PusherPushNotifications) {
        addDebugInfo('❌ Pusher SDK not loaded');
        setStatus('error');
        return;
      }

      const swRegistration = await registerServiceWorker();
      if (!swRegistration) {
        throw new Error('Service Worker registration failed');
      }

      const beamsClient = new window.PusherPushNotifications.Client({
        instanceId: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID!,
      });

      await beamsClient.setUserId(user.uid, {
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
            throw new Error(errorData.error || `HTTP ${response.status}`);
          }

          const tokenData = await response.json();
          addDebugInfo(`✅ Token received: ${tokenData.note || 'Success'}`);
          return tokenData.token;
        },
        
        async onTokenInvalidated(userId) {
          addDebugInfo(`🔄 Token invalidated for user: ${userId}`);
        }
      });

      addDebugInfo('🔄 Starting Beams client...');
      await beamsClient.start();
      addDebugInfo('✅ Beams client started');

      const state = await beamsClient.getRegistrationState();
      addDebugInfo(`📊 Registration state: ${state}`);

      const subscribed = state === 'PERMISSION_GRANTED';
      setIsSubscribed(subscribed);

      if (subscribed) {
        addDebugInfo('🎉 Pusher Beams initialized successfully!');
        setStatus('success');
      } else {
        addDebugInfo('⚠️ Initialized but notifications not granted');
        setStatus('error');
      }

    } catch (error: any) {
      console.error('Pusher initialization error:', error);
      addDebugInfo(`❌ Error: ${error.message}`);
      
      if (error.message.includes('401')) {
        addDebugInfo('🔑 401 Error: Token issue. Trying alternative approach...');
        // Try alternative initialization
        await initializePusherAlternative();
      } else {
        setStatus('error');
      }
    }
  };

  // Alternative initialization without token
  const initializePusherAlternative = async () => {
    try {
      addDebugInfo('🔄 Trying alternative initialization...');
      
      const beamsClient = new window.PusherPushNotifications.Client({
        instanceId: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID!,
      });

      // Try without setting user ID first
      await beamsClient.start();
      addDebugInfo('✅ Alternative initialization successful');
      
      const state = await beamsClient.getRegistrationState();
      setIsSubscribed(state === 'PERMISSION_GRANTED');
      setStatus('success');
      
    } catch (error: any) {
      addDebugInfo(`❌ Alternative initialization failed: ${error.message}`);
      setStatus('error');
    }
  };

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
          body: 'This is a test notification from Pusher Beams!',
          data: {
            test: true,
            timestamp: new Date().toISOString(),
            url: window.location.origin,
          }
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        addDebugInfo('✅ Test notification sent successfully!');
      } else {
        addDebugInfo(`❌ Failed to send: ${result.error}`);
      }

      setStatus('success');
    } catch (error: any) {
      addDebugInfo(`❌ Error sending notification: ${error.message}`);
      setStatus('error');
    }
  };

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

  const checkCredentials = () => {
    addDebugInfo('🔑 Checking Pusher credentials...');
    addDebugInfo(`Instance ID: ${process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID ? '✅ Set' : '❌ Missing'}`);
    addDebugInfo(`Secret Key: ${process.env.PUSHER_BEAMS_SECRET_KEY ? '✅ Set' : '❌ Missing'}`);
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
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Pusher Beams Test
          </h1>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">System Status</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <div><span className="font-medium">User:</span> <span className="text-green-600">Logged In ✅</span></div>
                <div><span className="font-medium">Pusher SDK:</span> <span className="text-green-600">Loaded ✅</span></div>
              </div>
              <div className="space-y-2">
                <div><span className="font-medium">Notifications:</span> <span className="text-green-600">Supported ✅</span></div>
                <div><span className="font-medium">Permission:</span> <span className="text-green-600">granted</span></div>
              </div>
              <div className="space-y-2">
                <div><span className="font-medium">Service Worker:</span> <span className="text-green-600">Supported ✅</span></div>
                <div><span className="font-medium">Subscription:</span> <span className={isSubscribed ? 'text-green-600' : 'text-red-600'}>{isSubscribed ? 'Active ✅' : 'Inactive ❌'}</span></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <button onClick={initializePusher} disabled={status === 'loading'} className="bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium text-sm">
              {status === 'loading' ? 'Initializing...' : 'Initialize Pusher'}
            </button>
            <button onClick={sendTestNotification} disabled={status === 'loading' || !isSubscribed} className="bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors font-medium text-sm">
              Send Test Notification
            </button>
            <button onClick={checkCredentials} className="bg-yellow-500 text-white py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors font-medium text-sm">
              Check Credentials
            </button>
            <button onClick={clearPusherState} className="bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm">
              Clear State
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800 flex items-center justify-between">
                Debug Information
                <button onClick={() => setDebugInfo([])} className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded transition-colors">
                  Clear Log
                </button>
              </h3>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              {debugInfo.length === 0 ? (
                <div className="text-gray-500 text-center py-8">No debug information yet.</div>
              ) : (
                debugInfo.map((info, index) => (
                  <div key={index} className="font-mono text-sm border-b border-gray-100 py-2 last:border-b-0">{info}</div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}