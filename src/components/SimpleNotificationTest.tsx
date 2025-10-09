// components/SimpleNotificationTest.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function SimpleNotificationTest() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Ready to test...');

  // Test direct API call
  const sendTestNotification = async () => {
    if (!user) {
      setStatus('❌ Please login first');
      return;
    }

    try {
      setLoading(true);
      setStatus('Sending test notification via API...');

      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Direct API Test 🔔',
          message: 'This notification is sent via direct API call to OneSignal',
          userId: user.uid,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('✅ Notification sent to OneSignal API!');
        console.log('API Response:', result);
        
        // Check if it was actually delivered
        if (result.data?.id) {
          setStatus(prev => prev + ` Notification ID: ${result.data.id}`);
        }
      } else {
        throw new Error(result.error || 'API request failed');
      }
    } catch (error: any) {
      console.error('Notification error:', error);
      setStatus(`❌ Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test browser notification
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
        badge: '/icons/icon-72x72.png'
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

  // Check service worker
  const checkServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      setStatus('❌ Service Workers not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration) {
        setStatus('✅ Service Worker registered');
        console.log('Service Worker:', registration);
      } else {
        setStatus('❌ No Service Worker registered');
      }
    } catch (error) {
      setStatus('❌ Service Worker check failed');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-4 border border-blue-200">
      <h3 className="text-lg font-semibold mb-4 text-blue-600">🔔 Simple Notification Test</h3>
      
      <div className="space-y-3">
        <button
          onClick={sendTestNotification}
          disabled={loading || !user}
          className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          Send Test via OneSignal API
        </button>

        <button
          onClick={testBrowserNotification}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Test Browser Notification
        </button>

        <button
          onClick={checkServiceWorker}
          className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
        >
          Check Service Worker
        </button>

        <div className="p-3 bg-gray-50 rounded border">
          <p className="text-sm text-gray-700">
            <strong>Status:</strong> {status}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            User: {user ? user.email : 'Not logged in'}
          </p>
        </div>
      </div>
    </div>
  );
}