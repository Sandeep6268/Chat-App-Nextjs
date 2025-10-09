// components/TestNotificationFinal.tsx - ENHANCED DEBUGGING
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function TestNotificationFinal() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Ready to test...');
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);

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

      // Check browser
      info.browserSupport = typeof window !== 'undefined';
      info.notificationSupport = 'Notification' in window;
      info.permission = Notification.permission;
      info.isHTTPS = window.location.protocol === 'https:';
      info.url = window.location.href;

      // Check user
      info.user = user ? `✅ ${user.email}` : '❌ Not logged in';

      setDebugInfo(info);

    } catch (error) {
      console.error('Environment check error:', error);
    }
  };

  // Test 1: Send to specific user
  const sendToSpecificUser = async () => {
    if (!user) {
      setStatus('❌ Please login first');
      return;
    }

    try {
      setLoading(true);
      setStatus('Sending to specific user...');

      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Specific User Test 🔔',
          message: 'This notification is sent specifically to you via user ID',
          userId: user.uid,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('✅ Sent to specific user! Check notifications.');
        addToHistory('Specific User', result);
      } else {
        throw new Error(result.error || 'Failed to send');
      }
    } catch (error: any) {
      setStatus(`❌ Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test 2: Send to all users (broadcast)
  const sendToAllUsers = async () => {
    try {
      setLoading(true);
      setStatus('Sending to all users...');

      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Broadcast Test 📢',
          message: 'This is a broadcast notification to all users',
          // No userId = broadcast to all
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('✅ Broadcast sent! Check notifications.');
        addToHistory('Broadcast', result);
      } else {
        throw new Error(result.error || 'Failed to send');
      }
    } catch (error: any) {
      setStatus(`❌ Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Check browser notification directly
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
        body: 'This is a direct browser notification (not from OneSignal)',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setStatus('✅ Browser notification sent! Do you see it?');
      addToHistory('Browser Direct', { success: true });
    } catch (error: any) {
      setStatus(`❌ Browser notification failed: ${error.message}`);
    }
  };

  // Test 4: Check OneSignal delivery status
  const checkDeliveryStatus = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/check-notification?notificationId=${notificationId}`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Delivery check error:', error);
      return null;
    }
  };

  const addToHistory = (type: string, result: any) => {
    const entry = {
      type,
      timestamp: new Date().toLocaleTimeString(),
      result: result.data || result,
      success: result.success
    };
    setNotificationHistory(prev => [entry, ...prev.slice(0, 4)]); // Keep last 5
  };

  // Reset notification permission
  const resetPermission = async () => {
    try {
      // This is a hack to reset permissions for testing
      if (navigator.permissions && navigator.permissions.query) {
        const permission = await navigator.permissions.query({ name: 'notifications' as PermissionName });
        console.log('Notification permission state:', permission.state);
      }
      
      setStatus('ℹ️ To reset permissions completely, close and reopen browser');
    } catch (error) {
      console.error('Reset permission error:', error);
    }
  };

  // Test different scenarios
  const runAllTests = async () => {
    setLoading(true);
    setNotificationHistory([]);
    
    const tests = [
      { name: 'Browser Direct', func: testBrowserNotification },
      { name: 'Specific User', func: sendToSpecificUser },
      { name: 'Broadcast', func: sendToAllUsers },
    ];

    for (const test of tests) {
      setStatus(`Running: ${test.name}`);
      await test.func();
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
    }

    setStatus('✅ All tests completed! Check results below.');
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto mt-8 border-2 border-blue-200">
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">
        🔔 NOTIFICATION DEBUGGER
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

      {/* Debug Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Environment Check:</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Server API Key:</strong> {debugInfo.serverCheck?.hasApiKey ? '✅ Present' : '❌ Missing'}</p>
            <p><strong>App ID:</strong> {debugInfo.serverCheck?.hasAppId ? '✅ Present' : '❌ Missing'}</p>
            <p><strong>Browser Support:</strong> {debugInfo.browserSupport ? '✅ Yes' : '❌ No'}</p>
          </div>
          <div>
            <p><strong>Notification Permission:</strong> {debugInfo.permission === 'granted' ? '✅ Granted' : '❌ Not granted'}</p>
            <p><strong>HTTPS:</strong> {debugInfo.isHTTPS ? '✅ Yes' : '❌ No'}</p>
            <p><strong>User:</strong> {debugInfo.user}</p>
          </div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={sendToSpecificUser}
          disabled={loading || !user}
          className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          Test 1: Send to Me
        </button>

        <button
          onClick={sendToAllUsers}
          disabled={loading}
          className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          Test 2: Send to All
        </button>

        <button
          onClick={testBrowserNotification}
          disabled={loading}
          className="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
        >
          Test 3: Browser Direct
        </button>

        <button
          onClick={runAllTests}
          disabled={loading || !user}
          className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          Run All Tests
        </button>
      </div>

      {/* Notification History */}
      {notificationHistory.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Test Results:</h3>
          <div className="space-y-2">
            {notificationHistory.map((entry, index) => (
              <div key={index} className={`p-3 rounded border ${
                entry.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{entry.type}</span>
                  <span className="text-sm text-gray-500">{entry.timestamp}</span>
                </div>
                <div className="text-sm mt-1">
                  {entry.success ? '✅ Success' : '❌ Failed'}
                  {entry.result?.id && (
                    <span className="text-xs text-gray-600 ml-2">ID: {entry.result.id}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Troubleshooting Guide */}
      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-3">🔧 TROUBLESHOOTING CHECKLIST</h3>
        
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-yellow-700">1. OneSignal Dashboard Check</h4>
            <p className="text-sm text-yellow-600">
              • Login to OneSignal → Your App → Delivery & Analytics<br/>
              • Are notifications showing as delivered?<br/>
              • Check if your user is registered in OneSignal
            </p>
          </div>

          <div>
            <h4 className="font-medium text-yellow-700">2. Browser Check</h4>
            <p className="text-sm text-yellow-600">
              • Press F12 → Application tab → Service Workers<br/>
              • Check if OneSignal service worker is active<br/>
              • Clear site data and retry
            </p>
          </div>

          <div>
            <h4 className="font-medium text-yellow-700">3. Quick Fixes</h4>
            <p className="text-sm text-yellow-600">
              • Try in Incognito/Private window<br/>
              • Try different browser (Chrome, Firefox)<br/>
              • Check browser notification settings
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={resetPermission}
            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
          >
            Reset Permissions
          </button>
          <button
            onClick={checkEnvironment}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            Refresh Check
          </button>
        </div>
      </div>
    </div>
  );
}