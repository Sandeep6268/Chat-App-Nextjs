// components/PusherDebugger.tsx - ADD THIS
'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function PusherDebugger() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testEverything = async () => {
    if (!user) {
      addLog('❌ User not logged in');
      return;
    }

    addLog('🧪 Starting comprehensive test...');

    // 1. Check service worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        addLog('✅ Service Worker registered');
        addLog(`📁 Service Worker scope: ${registration.scope}`);
      } else {
        addLog('❌ No Service Worker found');
      }
    } else {
      addLog('❌ Service Workers not supported');
    }

    // 2. Check notification permission
    const permission = Notification.permission;
    addLog(`🔔 Notification permission: ${permission}`);

    if (permission !== 'granted') {
      addLog('⚠️ Requesting notification permission...');
      const newPermission = await Notification.requestPermission();
      addLog(`🔔 New permission: ${newPermission}`);
    }

    // 3. Test local notification
    if (Notification.permission === 'granted') {
      new Notification('Local Test ✅', {
        body: 'If you see this, browser notifications work!',
        icon: '/icons/icon-192x192.png',
        tag: 'test'
      });
      addLog('✅ Local notification sent');
    }

    // 4. Test Pusher notification
    try {
      addLog('📤 Sending Pusher test...');
      const response = await fetch('/api/pusher/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          title: 'Pusher Test 🎯',
          body: 'This is a Pusher beams test!',
          data: { url: window.location.origin, test: true }
        })
      });

      const result = await response.json();
      if (response.ok) {
        addLog('✅ Pusher test sent successfully');
        addLog(`📨 Publish ID: ${result.result?.publishId}`);
      } else {
        addLog(`❌ Pusher test failed: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`❌ Pusher test error: ${error.message}`);
    }
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-xl border max-w-md max-h-96 overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">🔧 Pusher Debugger</h3>
        <div className="space-x-2">
          <button 
            onClick={testEverything}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Test All
          </button>
          <button 
            onClick={clearLogs}
            className="bg-gray-500 text-white px-2 py-1 rounded text-xs"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="text-xs space-y-1 max-h-64 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-gray-500">Click "Test All" to start debugging</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="border-b border-gray-100 py-1 font-mono">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}