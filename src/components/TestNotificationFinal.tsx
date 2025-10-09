// components/TestNotificationFinal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

// OneSignal types
declare global {
  interface Window {
    OneSignal: any;
  }
}

export default function TestNotificationFinal() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Checking environment...');
  const [debugInfo, setDebugInfo] = useState<any>({});

  // Check environment and OneSignal status
  useEffect(() => {
    checkEnvironment();
  }, [user]);

  const checkEnvironment = async () => {
    const info: any = {};

    try {
      // Check environment variables
      info.appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ? '✅ Present' : '❌ Missing';
      info.apiKey = process.env.ONESIGNAL_REST_API_KEY ? '✅ Present' : '❌ Missing';
      
      if (process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
        info.appIdValue = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID.substring(0, 10) + '...';
      }
      
      if (process.env.ONESIGNAL_REST_API_KEY) {
        info.apiKeyLength = process.env.ONESIGNAL_REST_API_KEY.length;
        info.apiKeyPrefix = process.env.ONESIGNAL_REST_API_KEY.substring(0, 10) + '...';
      }

      // Check browser support
      info.browserSupport = typeof window !== 'undefined' ? '✅ Supported' : '❌ Not in browser';
      
      if (typeof window !== 'undefined') {
        info.notificationSupport = 'Notification' in window ? '✅ Supported' : '❌ Not supported';
        info.oneSignalLoaded = window.OneSignal ? '✅ Loaded' : '❌ Not loaded';
        
        if (window.OneSignal) {
          const permission = await window.OneSignal.Notifications?.getPermission();
          info.permission = permission || 'unknown';
        } else {
          info.permission = Notification.permission;
        }
      }

      // Check user
      info.user = user ? `✅ ${user.email}` : '❌ Not logged in';

      setDebugInfo(info);
      setStatus('Environment check completed');

    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  // Initialize OneSignal
  const initializeOneSignal = async () => {
    if (typeof window === 'undefined') {
      setStatus('❌ Not in browser environment');
      return;
    }

    if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
      setStatus('❌ OneSignal App ID missing');
      return;
    }

    try {
      setLoading(true);
      setStatus('Initializing OneSignal...');

      // Load OneSignal SDK if not loaded
      if (!window.OneSignal) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
          script.async = true;
          
          script.onload = () => {
            console.log('✅ OneSignal SDK loaded');
            resolve(true);
          };
          
          script.onerror = () => {
            reject(new Error('Failed to load OneSignal SDK'));
          };
          
          document.head.appendChild(script);
        });
      }

      // Initialize OneSignal
      window.OneSignal = window.OneSignal || [];
      
      window.OneSignal.push(function() {
        window.OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: false,
          },
        });

        console.log('✅ OneSignal initialized');

        // Set external user ID
        if (user?.uid) {
          window.OneSignal.setExternalUserId(user.uid);
          console.log('👤 External user ID set:', user.uid);
        }

        setStatus('✅ OneSignal initialized successfully!');
      });

    } catch (error: any) {
      console.error('OneSignal initialization error:', error);
      setStatus(`❌ Initialization failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Request notification permission
  const requestPermission = async () => {
    try {
      setLoading(true);
      setStatus('Requesting permission...');

      if (window.OneSignal) {
        const permission = await window.OneSignal.Notifications.requestPermission();
        setStatus(permission === 'granted' ? '✅ Permission granted!' : '❌ Permission denied');
      } else {
        // Fallback to browser API
        const permission = await Notification.requestPermission();
        setStatus(permission === 'granted' ? '✅ Permission granted!' : '❌ Permission denied');
      }

      await checkEnvironment();
    } catch (error: any) {
      setStatus(`❌ Permission error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Send test notification via API
  const sendTestNotification = async () => {
    if (!user) {
      setStatus('❌ Please login first');
      return;
    }

    try {
      setLoading(true);
      setStatus('Sending test notification...');

      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Notification 🔔',
          message: 'This is a test notification from the chat app!',
          userId: user.uid,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('✅ Test notification sent! Check your notifications.');
        console.log('Notification result:', result);
      } else {
        throw new Error(result.error || 'Failed to send notification');
      }
    } catch (error: any) {
      console.error('Send notification error:', error);
      setStatus(`❌ Failed to send: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Send test notification to specific user (for chat testing)
  const sendChatTestNotification = async () => {
    if (!user) {
      setStatus('❌ Please login first');
      return;
    }

    try {
      setLoading(true);
      setStatus('Sending chat test notification...');

      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Message 💬',
          message: 'You have a new message in the chat app!',
          userId: user.uid, // Send to yourself for testing
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('✅ Chat test notification sent!');
        console.log('Chat notification result:', result);
      } else {
        throw new Error(result.error || 'Failed to send chat notification');
      }
    } catch (error: any) {
      console.error('Chat notification error:', error);
      setStatus(`❌ Failed to send: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto mt-8 border-2 border-blue-200">
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">
        🔔 Notification Test Panel
      </h2>

      {/* Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Status:</h3>
        <p className={`text-sm ${status.includes('✅') ? 'text-green-600' : status.includes('❌') ? 'text-red-600' : 'text-blue-600'}`}>
          {status}
        </p>
      </div>

      {/* Debug Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Information:</h3>
        <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-40">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={initializeOneSignal}
          disabled={loading}
          className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Loading...' : '1. Initialize OneSignal'}
        </button>

        <button
          onClick={requestPermission}
          disabled={loading || !debugInfo.oneSignalLoaded?.includes('✅')}
          className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          2. Request Permission
        </button>

        <button
          onClick={sendTestNotification}
          disabled={loading || !user}
          className="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
        >
          3. Send Test Notification
        </button>

        <button
          onClick={sendChatTestNotification}
          disabled={loading || !user}
          className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          4. Send Chat Test
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-semibold mb-2">Testing Instructions:</h3>
        <ol className="list-decimal list-inside text-sm space-y-1">
          <li>Click "Initialize OneSignal" first</li>
          <li>Then "Request Permission" - allow in browser popup</li>
          <li>Click "Send Test Notification" to test</li>
          <li>Check browser notifications and OneSignal dashboard</li>
        </ol>
      </div>

      {/* Environment Check */}
      <div className="mt-4 text-center">
        <button
          onClick={checkEnvironment}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
        >
          Refresh Status
        </button>
      </div>
    </div>
  );
}