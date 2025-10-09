// components/TestNotificationFinal.tsx - WITH CONFIG CHECK
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function TestNotificationFinal() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Checking configuration...');
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [appConfig, setAppConfig] = useState<any>(null);

  useEffect(() => {
    checkOneSignalConfig();
    checkEnvironment();
  }, [user]);
const checkSubscriptionStatus = async () => {
  if (window.OneSignal) {
    try {
      const userId = await window.OneSignal.getUserId();
      const isSubscribed = !!userId;
      
      setDebugInfo(prev => ({
        ...prev, 
        oneSignalSubscribed: isSubscribed,
        oneSignalUserId: userId
      }));
      
      if (isSubscribed) {
        setStatus('✅ Subscribed to OneSignal! Notifications should work.');
      } else {
        setStatus('❌ NOT subscribed to OneSignal. Subscribe first!');
      }
    } catch (error) {
      console.error('Subscription check error:', error);
    }
  }
};
  const checkOneSignalConfig = async () => {
    try {
      const response = await fetch('/api/check-onesignal-config');
      const result = await response.json();
      
      if (response.ok) {
        setAppConfig(result.app);
        setDebugInfo(prev => ({ ...prev, appConfig: result.app }));
        setStatus(`✅ App Config Loaded: ${result.app.name}`);
      } else {
        setStatus(`❌ Config Error: ${result.error}`);
      }
    } catch (error: any) {
      setStatus(`❌ Config Check Failed: ${error.message}`);
    }
  };

  const checkEnvironment = async () => {
    const info: any = {};

    try {
      // Check server environment
      const envResponse = await fetch('/api/test-onesignal');
      const serverEnv = await envResponse.json();
      info.serverCheck = serverEnv;

      // Check browser
      info.browserSupport = typeof window !== 'undefined';
      info.notificationSupport = 'Notification' in window;
      info.permission = Notification.permission;
      info.isHTTPS = window.location.protocol === 'https:';

      // Check user
      info.user = user ? `✅ ${user.email}` : '❌ Not logged in';

      setDebugInfo(info);

    } catch (error) {
      console.error('Environment check error:', error);
    }
  };

  // Test with different targeting methods
  const testWithSegments = async () => {
    try {
      setLoading(true);
      setStatus('Sending to "All Users" segment...');

      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Segment Test 🎯',
          message: 'This is sent to All Users segment',
          // No userId = uses included_segments: ['All']
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('✅ Sent to All Users segment! Check OneSignal dashboard.');
        console.log('Segment test result:', result);
      } else {
        throw new Error(result.error || 'Failed to send');
      }
    } catch (error: any) {
      setStatus(`❌ Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testWithUserTargeting = async () => {
    if (!user) {
      setStatus('❌ Please login first');
      return;
    }

    try {
      setLoading(true);
      setStatus('Sending with user targeting...');

      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'User Target Test 👤',
          message: 'This is specifically targeted to you',
          userId: user.uid,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('✅ User-targeted sent! Check notifications.');
        console.log('User target result:', result);
      } else {
        throw new Error(result.error || 'Failed to send');
      }
    } catch (error: any) {
      setStatus(`❌ Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testBrowserNotification = () => {
    if (!('Notification' in window)) {
      setStatus('❌ Browser does not support notifications');
      return;
    }

    if (Notification.permission !== 'granted') {
      setStatus('❌ Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification('Browser Test 🔔', {
        body: 'This is a direct browser notification',
        icon: '/icons/icon-192x192.png',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setStatus('✅ Browser notification sent!');
    } catch (error: any) {
      setStatus(`❌ Browser notification failed: ${error.message}`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto mt-8 border-2 border-blue-200">
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">
        🔔 ONE SIGNAL DELIVERY FIX
      </h2>

      {/* Status */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold mb-2 text-blue-800">Status:</h3>
        <p className={`text-sm font-medium ${
          status.includes('✅') ? 'text-green-600' : 
          status.includes('❌') ? 'text-red-600' : 'text-blue-600'
        }`}>
          {status}
        </p>
      </div>

      {/* App Configuration */}
      {appConfig && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="font-semibold mb-2 text-green-800">OneSignal App Config:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>App Name:</strong> {appConfig.name}</p>
              <p><strong>Web Origin:</strong> {appConfig.chrome_web_origin}</p>
            </div>
            <div>
              <p><strong>Site Name:</strong> {appConfig.site_name}</p>
              <p><strong>Registered Users:</strong> {appConfig.players_count}</p>
            </div>
          </div>
        </div>
      )}

      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={testWithSegments}
          disabled={loading}
          className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          Test 1: Send to All Segment
        </button>
        <button
  onClick={checkSubscriptionStatus}
  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
>
  Check Subscription Status
</button>
        <button
          onClick={testWithUserTargeting}
          disabled={loading || !user}
          className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          Test 2: Send to Specific User
        </button>

        <button
          onClick={testBrowserNotification}
          disabled={loading}
          className="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
        >
          Test 3: Browser Direct
        </button>
      </div>

      {/* Debug Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Information:</h3>
        <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-40">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      {/* Critical Fix Instructions */}
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <h3 className="font-semibold text-red-800 mb-3">🚨 CRITICAL FIXES NEEDED</h3>
        
        <div className="space-y-2 text-sm text-red-700">
          <p><strong>Problem:</strong> Notifications sending but not delivering</p>
          <p><strong>Solution:</strong> Check these OneSignal settings:</p>
          <ol className="list-decimal list-inside ml-4">
            <li>Go to OneSignal Dashboard → Your App → Settings</li>
            <li>Check <strong>Web Push platform configuration</strong></li>
            <li>Verify <strong>Site URL</strong> matches your domain</li>
            <li>Ensure <strong>Default Icon</strong> is set</li>
            <li>Check if any users are <strong>registered/subscribed</strong></li>
          </ol>
          <p className="mt-2">
            <strong>Registered Users Count:</strong> {appConfig?.players_count || 0}<br/>
            If this is 0, no one has subscribed to notifications yet!
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={checkOneSignalConfig}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Refresh App Config
          </button>
          <button
            onClick={checkEnvironment}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}