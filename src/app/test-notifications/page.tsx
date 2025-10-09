import NotificationTest from '../components/NotificationTest';

export default function TestNotifications() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          OneSignal Notification Test
        </h1>
        <NotificationTest />
        
        <div className="mt-8 text-center text-gray-600">
          <p>This is a demo page to test OneSignal push notifications.</p>
          <p>Once everything works correctly, we'll integrate this into your chat app.</p>
        </div>
      </div>
    </div>
  );
}