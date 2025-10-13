'use client';
import dynamic from "next/dynamic";

const FCMTestInitializer = dynamic(
  () => import("./FCMTestInitializer"),
  { ssr: false }
);

export default function FCMTestPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
      <h1 className="text-2xl font-bold mb-4">🔥 FCM Mobile Test Page</h1>
      <p className="text-gray-400 mb-6">
        Use this page to test Firebase push notifications on your mobile browser.
      </p>
      <FCMTestInitializer />
    </main>
  );
}
