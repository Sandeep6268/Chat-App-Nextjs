import Navigation from '@/components/Navigation';

export default function Home() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Welcome to Chat App
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Test OneSignal push notifications with the demo page
          </p>
          <div className="space-y-4">
            <a
              href="/onesignal-test"
              className="inline-block bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Go to OneSignal Test Page
            </a>
          </div>
        </div>
      </div>
    </>
  );
}