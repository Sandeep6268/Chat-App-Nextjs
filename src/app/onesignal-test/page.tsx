// app/onesignal-test/page.tsx
'use client';

import { useState } from 'react';
import NotificationTester from '@/components/onesignal/NotificationTester';
import Link from 'next/link';

export default function OneSignalTestPage() {
  const [activeTab, setActiveTab] = useState<'demo' | 'integration'>('demo');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
              ← Back to Chat
            </button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            OneSignal Push Notification Test
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Test push notifications before integrating into your main chat application
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-inner">
            <button
              onClick={() => setActiveTab('demo')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'demo'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🧪 Demo Test
            </button>
            <button
              onClick={() => setActiveTab('integration')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'integration'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🔗 Integration Guide
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'demo' ? (
          <div className="max-w-4xl mx-auto">
            <NotificationTester />
            
            {/* Additional Test Info */}
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">What to Test</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>✅ Browser notification permission</li>
                  <li>✅ Push notification delivery</li>
                  <li>✅ Notification click navigation</li>
                  <li>✅ Different browsers (Chrome, Firefox, Safari)</li>
                  <li>✅ Mobile device testing</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">Expected Behavior</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>🔔 System notification should appear</li>
                  <li>🖱️ Clicking notification should navigate to app</li>
                  <li>📱 Should work on mobile devices</li>
                  <li>⚡ Notifications should be near-instant</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Integration Guide</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">1. Update ChatSidebar Notification Logic</h3>
                <p className="text-gray-600 mb-3">
                  Replace the current notification logic in ChatSidebar.tsx with OneSignal:
                </p>
                <pre className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`// In ChatSidebar.tsx - Updated notification function
const sendOneSignalNotification = async (senderName: string, message: string, targetUserId: string) => {
  try {
    // Get target user's OneSignal player ID from Firestore
    const userDoc = await getDoc(doc(firestore, 'users', targetUserId));
    const userData = userDoc.data();
    const playerId = userData?.oneSignalPlayerId;
    
    if (playerId) {
      await OneSignalService.sendChatNotification(
        playerId,
        senderName,
        message,
        chat.id
      );
    }
  } catch (error) {
    console.error('OneSignal notification failed:', error);
  }
};`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">2. Update ChatWindow Notification Logic</h3>
                <p className="text-gray-600">
                  Similar updates needed in ChatWindow.tsx for real-time message notifications.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">3. Environment Variables</h3>
                <p className="text-gray-600 mb-2">
                  Make sure these are set in your Vercel project:
                </p>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <code className="text-sm">
                    NEXT_PUBLIC_ONESIGNAL_APP_ID=da31d02e-4dc3-414b-b788-b1cb441a7738<br/>
                    ONESIGNAL_REST_API_KEY=os_v2_app_3iy5alsnynauxn4iwhfuigtxhb26v2tf243ebxee5accglxhhgtbk4watlihrh6yhn5xx5izvcgc3dnl5mjgx2gzblaxhrl65pjsdtq
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}