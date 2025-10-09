'use client';

import { useEffect, useState } from 'react';
import { auth, firestore } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'; // ✅ Fixed imports
import { NotificationService } from '@/lib/notifications';
import { requestNotificationPermission } from '@/lib/firebase/client';

export default function DebugPage() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [testMessage, setTestMessage] = useState('Hello from testing!');

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    // Redirect to home if not in development
    // if (process.env.NODE_ENV === 'production' && !window.location.href.includes('localhost')) {
    //   window.location.href = '/';
    //   return;
    // }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        addLog(`✅ User logged in: ${user.email} (${user.uid})`);
      } else {
        addLog('❌ No user logged in');
      }
    });

    // Load users and chats
    const loadData = async () => {
      try {
        addLog('📖 Loading Firestore data...');
        
        const usersSnapshot = await getDocs(collection(firestore, 'users'));
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
        addLog(`✅ Loaded ${usersData.length} users`);

        const chatsSnapshot = await getDocs(collection(firestore, 'chats'));
        const chatsData = chatsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setChats(chatsData);
        addLog(`✅ Loaded ${chatsData.length} chats`);
      } catch (error) {
        addLog(`❌ Error loading data: ${error}`);
      }
    };

    loadData();

    return () => unsubscribe();
  }, []);

  const requestNotifications = async () => {
    try {
      addLog('🔔 Requesting notification permission...');
      const token = await requestNotificationPermission();
      if (token) {
        setFcmToken(token);
        addLog(`✅ FCM Token received: ${token.substring(0, 50)}...`);
        
        // Save token to user profile
        if (user) {
          await NotificationService.saveUserFCMToken(user.uid, token);
          addLog('✅ FCM token saved to user profile');
        }
      } else {
        addLog('❌ Failed to get FCM token - permission denied');
      }
    } catch (error) {
      addLog(`❌ Error requesting notifications: ${error}`);
    }
  };

  const saveTokenManually = async () => {
    if (!user || !fcmToken) {
      addLog('❌ No user or FCM token available');
      return;
    }

    try {
      addLog('💾 Manually saving FCM token...');
      
      // Direct Firestore call
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(fcmToken),
        updatedAt: new Date(),
      });
      
      addLog('✅ FCM token manually saved!');
      
      // Refresh user data
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      addLog(`📱 User FCM tokens: ${userData?.fcmTokens?.length || 0} tokens`);
      
    } catch (error) {
      addLog(`❌ Error manually saving token: ${error}`);
    }
  };

  const sendTestNotification = async () => {
    if (!user) {
      addLog('❌ Please login first to send test notification');
      return;
    }

    try {
      addLog('🚀 Sending test notification...');
      
      await NotificationService.sendNewMessageNotification({
        recipientId: user.uid, // Send to yourself
        senderName: 'Test Bot',
        messageText: testMessage,
        chatId: 'test-chat-id',
        senderId: 'test-bot'
      });

      addLog('✅ Test notification sent! Check your notifications');
    } catch (error) {
      addLog(`❌ Error sending test notification: ${error}`);
    }
  };

  const sendUnreadNotification = async () => {
    if (!user) {
      addLog('❌ Please login first to send unread notification');
      return;
    }

    try {
      addLog('📊 Sending unread count notification...');
      
      await NotificationService.sendUnreadCountNotification({
        recipientId: user.uid,
        senderName: 'System',
        chatId: 'test-chat-id'
      });

      addLog('✅ Unread count notification sent!');
    } catch (error) {
      addLog(`❌ Error sending unread notification: ${error}`);
    }
  };

  const testNotificationAPI = async () => {
    if (!user) {
      addLog('❌ Please login first');
      return;
    }

    try {
      addLog('🔍 Testing notification API directly...');
      
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: user.uid,
          senderName: 'API Test',
          messageText: 'This is a direct API test',
          chatId: 'test-chat-123',
          senderId: 'api-test',
          type: 'new_message'
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        addLog(`❌ API Error: ${result.error}`);
      } else {
        addLog(`✅ API Success: ${JSON.stringify(result)}`);
      }
      
    } catch (error) {
      addLog(`❌ API Call Failed: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('🗑️ Logs cleared');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-green-600">🔥 Firebase Debug Dashboard</h1>
      
      {/* Project Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Current Firebase Project</h2>
        <pre className="bg-white p-4 rounded border">
          {JSON.stringify({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.substring(0, 20) + '...'
          }, null, 2)}
        </pre>
      </div>

      {/* Notification Test Section */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">🔔 Notification Testing</h2>
        
        <div className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <button 
              onClick={requestNotifications}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Request Notification Permission
            </button>

            <button 
              onClick={sendTestNotification}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Send Test Message Notification
            </button>

            <button 
              onClick={sendUnreadNotification}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              Send Unread Count Notification
            </button>

            <button 
              onClick={saveTokenManually}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
              disabled={!fcmToken}
            >
              Save Token Manually
            </button>

            <button 
              onClick={testNotificationAPI}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Test API Directly
            </button>

            <button 
              onClick={clearLogs}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Clear Logs
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Test Message:
            </label>
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter test message..."
            />
          </div>

          {fcmToken && (
            <div className="p-3 bg-yellow-50 rounded">
              <strong>FCM Token:</strong>
              <div className="text-xs break-all mt-1">{fcmToken}</div>
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">👤 Current User</h2>
        <pre className="bg-white p-4 rounded border max-h-40 overflow-auto">
          {user ? JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            emailVerified: user.emailVerified
          }, null, 2) : 'No user logged in'}
        </pre>
      </div>

      {/* Data Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-red-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">👥 All Users ({users.length})</h2>
          <pre className="bg-white p-4 rounded border max-h-60 overflow-auto text-xs">
            {JSON.stringify(users, null, 2)}
          </pre>
        </div>

        <div className="p-4 bg-indigo-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">💬 All Chats ({chats.length})</h2>
          <pre className="bg-white p-4 rounded border max-h-60 overflow-auto text-xs">
            {JSON.stringify(chats, null, 2)}
          </pre>
        </div>
      </div>

      {/* Logs Section */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">📝 Console Logs</h2>
        <div className="bg-black text-green-400 p-4 rounded max-h-80 overflow-auto font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet. Perform some actions to see logs here.</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}