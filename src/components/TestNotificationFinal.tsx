// components/TestNotificationFinal.tsx - UPDATED
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

  // Check environment and OneSignal status
  useEffect(() => {
    checkEnvironment();
    
    // OneSignal ready listener
    if (typeof window !== 'undefined') {
      window.OneSignal = window.OneSignal || [];
      
      // Check if OneSignal is already loaded
      const checkOneSignal = setInterval(() => {
        if (window.OneSignal && typeof window.OneSignal.init === 'function') {
          setOneSignalInitialized(true);
          setStatus('✅ OneSignal SDK Ready');
          clearInterval(checkOneSignal);
        }
      }, 1000);

      return () => clearInterval(checkOneSignal);
    }
  }, [user]);

  const checkEnvironment = async () => {
    const info: any = {};

    try {
      // Check environment variables
      info.appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ? '✅ Present' : '❌ Missing';
      info.apiKey = process.env.ONESIGNAL_REST_API_KEY ? '✅ Present' : '❌ Missing';
      
      if (process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
        info.appIdValue = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
      }
      
      // Check browser support
      info.browserSupport = typeof window !== 'undefined' ? '✅ Supported' : '❌ Not in browser';
      
      if (typeof window !== 'undefined') {
        info.notificationSupport = 'Notification' in window ? '✅ Supported' : '❌ Not supported';
        info.oneSignalLoaded = window.OneSignal ? '✅ Loaded' : '❌ Not loaded';
        info.permission = Notification.permission;
      }

      // Check user
      info.user = user ? `✅ ${user.email}` : '❌ Not logged in';

      setDebugInfo(info);

    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  // Simple OneSignal Initialization
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

      // Simple initialization
      window.OneSignal = window.OneSignal || [];
      
      // Initialize with basic config
      window.OneSignal.push(function() {
        window.OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
        });
        
        console.log('OneSignal initialized');
        setOneSignalInitialized(true);
        setStatus('✅ OneSignal initialized!');
        
        // Set user ID if available
        if (user?.uid) {
          window.OneSignal.setExternalUserId(user.uid);
        }
      });

    } catch (error: any) {
      console.error('OneSignal initialization error:', error);
      setStatus(`❌ Initialization failed: ${error.message}`);
    } finally {
      setLoading(false);
      checkEnvironment();
    }
  };

  // Simple Permission Request
  const requestPermission = async () => {
    try {
      setLoading(true);
      setStatus('Requesting permission...');

      // Use browser's native Notification API
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        setStatus('✅ Browser permission granted!');
        
        // Try to initialize OneSignal after permission
        if (!oneSignalInitialized) {
          await initializeOneSignal();
        }
      } else {
        setStatus('❌ Permission denied by user');
      }

    } catch (error: any) {
      setStatus(`❌ Permission error: ${error.message}`);
    } finally {
      setLoading(false);
      checkEnvironment();
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

      // First check if API key is available
      const envCheck = await fetch('/api/test-onesignal');
      const envResult = await envCheck.json();
      
      console.log('Environment check:', envResult);

      if (!envResult.hasApiKey) {
        setStatus('❌ API Key missing on server. Check Vercel environment variables.');
        return;
      }

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

  // Check API Key Status
  const checkApiKey = async () => {
    try {
      setLoading(true);
      setStatus('Checking API key...');
      
      const response = await fetch('/api/test-onesignal');
      const result = await response.json();
      
      console.log('API Key check:', result);
      
      if (result.hasApiKey) {
        setStatus('✅ API Key is configured on server!');
      } else {
        setStatus('❌ API Key missing on server. Check Vercel environment variables.');
      }
      
      setDebugInfo(prev => ({ ...prev, serverCheck: result }));
      
    } catch (error: any) {
      setStatus(`❌ Check failed: ${error.message}`);
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
        {oneSignalInitialized && (
          <p className="text-green-600 text-sm mt-1">✅ OneSignal Initialized</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={checkApiKey}
          disabled={loading}
          className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
        >
          🔑 Check API Key
        </button>

        <button
          onClick={initializeOneSignal}
          disabled={loading}
          className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Loading...' : '1. Initialize OneSignal'}
        </button>

        <button
          onClick={requestPermission}
          disabled={loading}
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
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-semibold mb-2">🚨 IMPORTANT FIXES NEEDED:</h3>
        <ol className="list-decimal list-inside text-sm space-y-2">
          <li>
            <strong>API Key Missing:</strong> Vercel mein <code>ONESIGNAL_REST_API_KEY</code> add karo
          </li>
          <li>
            <strong>Steps:</strong> Vercel Dashboard → Settings → Environment Variables
          </li>
          <li>
            <strong>Value:</strong> <code>os_v2_app_3iy5alsnynauxn4iwhfuigtxhb26v2tf243ebxee5accglxhhgtbk4watlihrh6yhn5xx5izvcgc3dnl5mjgx2gzblaxhrl65pjsdtq</code>
          </li>
          <li>Redeploy karo after adding environment variable</li>
        </ol>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 text-center space-x-2">
        <button
          onClick={checkEnvironment}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
        >
          Refresh Status
        </button>
        <button
          onClick={checkApiKey}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
        >
          Check Server API Key
        </button>
      </div>
    </div>
  );
}