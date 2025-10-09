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

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  // Initialize Pusher Beams
  const initializePusher = async () => {
    if (!user) {
      addDebugInfo('❌ User not logged in');
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

      // Create beams client
      const beamsClient = new window.PusherPushNotifications.Client({
        instanceId: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID!,
      });

      // Get device ID
      const deviceId = await beamsClient.getDeviceId();
      addDebugInfo(`📱 Device ID: ${deviceId}`);

      // Start beams client
      await beamsClient.start();
      addDebugInfo('✅ Beams client started');

      // Get token from server
      const tokenResponse = await fetch('/api/pusher/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get token');
      }

      const { token } = await tokenResponse.json();
      addDebugInfo('✅ Token received from server');

      // Set user ID
      await beamsClient.setUserId(user.uid, token);
      addDebugInfo(`✅ User ID set: ${user.uid}`);

      // Check subscription state
      const state = await beamsClient.getRegistrationState();
      addDebugInfo(`📊 Registration state: ${state}`);

      setIsSubscribed(state === 'PERMISSION_GRANTED');
      setStatus('success');
      addDebugInfo('🎉 Pusher Beams initialized successfully!');

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
          body: 'This is a test notification from Pusher Beams!',
          data: {
            test: true,
            timestamp: new Date().toISOString(),
            url: window.location.origin
          }
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        addDebugInfo('✅ Test notification sent successfully!');
        addDebugInfo(`📨 Response: ${JSON.stringify(result)}`);
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
      }
    } catch (error: any) {
      addDebugInfo(`❌ Error clearing state: ${error.message}`);
    }
  };

  // Check browser support
  useEffect(() => {
    addDebugInfo(`🌐 Browser: ${navigator.userAgent}`);
    addDebugInfo(`🔔 Notification permission: ${Notification.permission}`);
    addDebugInfo(`📱 Service Worker: ${'serviceWorker' in navigator ? 'Supported' : 'Not supported'}`);
  }, []);

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
            <h3 className="font-semibold text-gray-800 mb-2">User Information</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Status:</span>{' '}
                {user ? (
                  <span className="text-green-600">Logged In ✅</span>
                ) : (
                  <span className="text-red-600">Not Logged In ❌</span>
                )}
              </div>
              <div>
                <span className="font-medium">User ID:</span>{' '}
                <code className="bg-gray-100 px-2 py-1 rounded">
                  {user?.uid || 'Not available'}
                </code>
              </div>
              <div>
                <span className="font-medium">Browser Permission:</span>{' '}
                <span className={
                  Notification.permission === 'granted' ? 'text-green-600' : 
                  Notification.permission === 'denied' ? 'text-red-600' : 'text-yellow-600'
                }>
                  {Notification.permission}
                </span>
              </div>
              <div>
                <span className="font-medium">Pusher Subscription:</span>{' '}
                <span className={isSubscribed ? 'text-green-600' : 'text-red-600'}>
                  {isSubscribed ? 'Subscribed ✅' : 'Not Subscribed ❌'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={initializePusher}
              disabled={status === 'loading' || !user}
              className="bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium"
            >
              {status === 'loading' ? 'Initializing...' : 'Initialize Pusher'}
            </button>

            <button
              onClick={sendTestNotification}
              disabled={status === 'loading' || !isSubscribed}
              className="bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors font-medium"
            >
              Send Test Notification
            </button>

            <button
              onClick={clearPusherState}
              className="bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
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
            <h3 className="text-xl font-bold text-gray-800 mb-4">Expected Results</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                Pusher Beams should initialize successfully
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                Browser should show notification permission prompt
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                Test notification should appear on your device
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                Debug information should show each step's status
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}