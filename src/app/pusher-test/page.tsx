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
    console.log(info);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  // Initialize Pusher Beams - SIMPLE VERSION
  const initializePusher = async () => {
    if (!user) {
      addDebugInfo('❌ User not logged in');
      return;
    }

    setStatus('loading');
    addDebugInfo('🚀 Starting Pusher Beams...');

    try {
      // Check if Pusher SDK is loaded
      if (!window.PusherPushNotifications) {
        addDebugInfo('❌ Pusher SDK not loaded');
        setStatus('error');
        return;
      }

      // Register service worker
      addDebugInfo('📋 Registering service worker...');
      await navigator.serviceWorker.register('/service-worker.js');
      addDebugInfo('✅ Service Worker registered');

      // Create beams client
      const beamsClient = new window.PusherPushNotifications.Client({
        instanceId: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID!,
      });

      // Start beams client (without user ID first)
      addDebugInfo('🔄 Starting Beams client...');
      await beamsClient.start();
      addDebugInfo('✅ Beams client started');

      // Check subscription state
      const state = await beamsClient.getRegistrationState();
      addDebugInfo(`📊 Registration state: ${state}`);

      if (state === 'PERMISSION_GRANTED') {
        setIsSubscribed(true);
        addDebugInfo('🎉 Pusher Beams ready! You can receive notifications.');
        setStatus('success');
      } else {
        addDebugInfo('⚠️ Notifications permission not granted');
        setStatus('error');
      }

    } catch (error: any) {
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
          body: 'This is a test notification from your chat app!',
          data: {
            url: window.location.origin,
            type: 'test'
          }
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        addDebugInfo('✅ Notification sent successfully!');
        addDebugInfo(`📨 Response: ${JSON.stringify(result)}`);
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
      }
      setDebugInfo([]);
      setIsSubscribed(false);
      setStatus('idle');
      addDebugInfo('🧹 Everything cleared');
    } catch (error: any) {
      addDebugInfo(`❌ Clear error: ${error.message}`);
    }
  };

  // Check current status
  const checkStatus = async () => {
    if (!window.PusherPushNotifications) {
      addDebugInfo('❌ Pusher SDK not available');
      return;
    }

    try {
      const beamsClient = new window.PusherPushNotifications.Client({
        instanceId: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID!,
      });
      
      const state = await beamsClient.getRegistrationState();
      addDebugInfo(`📊 Current status: ${state}`);
      setIsSubscribed(state === 'PERMISSION_GRANTED');
    } catch (error: any) {
      addDebugInfo(`❌ Status check failed: ${error.message}`);
    }
  };

  // Initial setup
  useEffect(() => {
    addDebugInfo('🔔 Welcome to Pusher Beams Test');
    addDebugInfo(`📱 Instance ID: ${process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID}`);
    addDebugInfo(`👤 User: ${user ? 'Logged in' : 'Not logged in'}`);
  }, [user]);

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
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 mb-8">
          {/* Status Card */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Current Status</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">User:</span> {user ? '✅ Logged In' : '❌ Not Logged In'}</div>
              <div><span className="font-medium">Subscription:</span> {isSubscribed ? '✅ Active' : '❌ Inactive'}</div>
              <div><span className="font-medium">Permission:</span> {Notification.permission === 'granted' ? '✅ Granted' : '❌ Not Granted'}</div>
              <div><span className="font-medium">Pusher SDK:</span> {typeof window.PusherPushNotifications !== 'undefined' ? '✅ Loaded' : '❌ Not Loaded'}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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
              Send Test
            </button>

            <button
              onClick={checkStatus}
              className="bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600 transition-colors font-medium"
            >
              Check Status
            </button>

            <button
              onClick={clearAll}
              className="bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
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
              {debugInfo.map((info, index) => (
                <div key={index} className="text-sm border-b border-gray-100 py-2 font-mono">
                  {info}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Simple Instructions */}
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Simple Steps to Test:</h3>
          <ol className="space-y-2 text-gray-600">
            <li>1. Click <strong>"Initialize Pusher"</strong> - This sets up everything</li>
            <li>2. Allow notifications when browser asks</li>
            <li>3. Click <strong>"Send Test"</strong> - Send a test notification</li>
            <li>4. Check if notification appears on your device</li>
          </ol>
        </div>
      </div>
    </div>
  );
}