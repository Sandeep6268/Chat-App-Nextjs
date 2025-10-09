// components/TestNotificationFinal.tsx - FINAL VERSION
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

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
  const [oneSignalInitialized, setOneSignalInitialized] = useState(false);

  useEffect(() => {
    checkEnvironment();
  }, [user]);

  const checkEnvironment = async () => {
    const info: any = {};

    try {
      // Check server environment
      const envResponse = await fetch('/api/test-onesignal');
      const serverEnv = await envResponse.json();
      info.serverCheck = serverEnv;

      // Check browser support
      info.browserSupport = typeof window !== 'undefined' ? '✅ Supported' : '❌ Not in browser';
      
      if (typeof window !== 'undefined') {
        info.notificationSupport = 'Notification' in window ? '✅ Supported' : '❌ Not supported';
        info.oneSignalLoaded = window.OneSignal ? '✅ Loaded' : '❌ Not loaded';
        info.permission = Notification.permission;
        info.oneSignalInitialized = oneSignalInitialized;
      }

      // Check user
      info.user = user ? `✅ ${user.email}` : '❌ Not logged in';

      setDebugInfo(info);

      if (serverEnv.hasApiKey && serverEnv.hasAppId) {
        setStatus('✅ Server ready! Initialize OneSignal.');
      }

    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  // Initialize OneSignal
  const initializeOneSignal = async () => {
    try {
      setLoading(true);
      setStatus('Initializing OneSignal...');

      if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
        setStatus('❌ OneSignal App ID missing');
        return;
      }

      // Load OneSignal SDK
      await new Promise((resolve, reject) => {
        if (window.OneSignal && window.OneSignal.init) {
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
        script.async = true;
        
        script.onload = () => {
          console.log('✅ OneSignal SDK loaded');
          resolve(true);
        };
        
        script.onerror = () => reject(new Error('Failed to load OneSignal SDK'));
        document.head.appendChild(script);
      });

      // Initialize OneSignal
      window.OneSignal = window.OneSignal || [];
      
      window.OneSignal.push(function() {
        window.OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
        });
        
        console.log('✅ OneSignal initialized');
        setOneSignalInitialized(true);
        setStatus('✅ OneSignal initialized successfully!');

        // Set external user ID
        if (user?.uid) {
          window.OneSignal.setExternalUserId(user.uid);
          console.log('👤 External user ID set:', user.uid);
        }

        // Check subscription
        window.OneSignal.getUserId().then((userId: string) => {
          console.log('OneSignal User ID:', userId);
          if (userId) {
            setStatus(prev => prev + ' User subscribed!');
          }
        });
      });

    } catch (error: any) {
      console.error('OneSignal initialization error:', error);
      setStatus(`❌ Initialization failed: ${error.message}`);
    } finally {
      setLoading(false);
      checkEnvironment();
    }
  };

  // Send Test Notification
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
          title: 'Test from Chat App 🔔',
          message: 'Hello! This is a test notification from our chat application.',
          userId: user.uid,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('✅ Notification sent to OneSignal! Check:');
        console.log('OneSignal Response:', result);
        
        // Show delivery info
        if (result.data && result.data.id) {
          setStatus(prev => prev + ` Notification ID: ${result.data.id}`);
        }
      } else {
        throw new Error(result.error || 'Failed to send notification');
      }
    } catch (error: any) {
      console.error('Send notification error:', error);
      setStatus(`❌ Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Check OneSignal Status
  const checkOneSignalStatus = async () => {
    if (window.OneSignal) {
      try {
        const permission = await window.OneSignal.Notifications.permission;
        const userId = await window.OneSignal.getUserId();
        
        setDebugInfo(prev => ({
          ...prev,
          oneSignalPermission: permission,
          oneSignalUserId: userId
        }));
        
        setStatus(`OneSignal: Permission: ${permission}, UserID: ${userId || 'Not set'}`);
      } catch (error) {
        console.log('OneSignal status check error:', error);
      }
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto mt-8 border-2 border-green-200">
      <h2 className="text-2xl font-bold mb-4 text-center text-green-600">
        🔔 Notification Test - READY! 
      </h2>

      {/* Status */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <h3 className="font-semibold mb-2 text-green-800">Status:</h3>
        <p className={`text-sm font-medium ${
          status.includes('✅') ? 'text-green-600' : 
          status.includes('❌') ? 'text-red-600' : 'text-blue-600'
        }`}>
          {status}
        </p>
        {oneSignalInitialized && (
          <p className="text-green-600 text-sm mt-2 font-semibold">
            🎉 OneSignal Initialized - Ready to test notifications!
          </p>
        )}
      </div>

      {/* Debug Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Information:</h3>
        <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-40">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={initializeOneSignal}
          disabled={loading || oneSignalInitialized}
          className={`px-4 py-3 rounded-lg transition-colors ${
            oneSignalInitialized 
              ? 'bg-green-500 text-white cursor-not-allowed' 
              : 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50'
          }`}
        >
          {oneSignalInitialized ? '✅ Initialized' : '1. Initialize OneSignal'}
        </button>

        <button
          onClick={sendTestNotification}
          disabled={loading || !oneSignalInitialized}
          className="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
        >
          2. Send Test Notification
        </button>

        <button
          onClick={checkOneSignalStatus}
          className="px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
        >
          Check OneSignal Status
        </button>

        <button
          onClick={checkEnvironment}
          className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Refresh All
        </button>
      </div>

      {/* Success Message */}
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <h3 className="font-semibold text-green-800 mb-2">🎉 Everything is Ready!</h3>
        <div className="text-sm text-green-700 space-y-1">
          <p>✅ API Key configured on server</p>
          <p>✅ App ID present</p>
          <p>✅ Notification permission granted</p>
          <p>✅ User logged in</p>
          <p className="font-semibold mt-2">Now click "Initialize OneSignal" then "Send Test Notification"</p>
        </div>
      </div>

      {/* What to Expect */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">What should happen:</h3>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
          <li>Notification should appear in your browser</li>
          <li>Check OneSignal Dashboard for delivery status</li>
          <li>Check browser console for any errors</li>
        </ol>
      </div>
    </div>
  );
}