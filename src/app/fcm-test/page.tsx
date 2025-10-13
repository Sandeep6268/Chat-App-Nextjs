'use client';
import dynamic from "next/dynamic";

const FCMTestInitializer = dynamic(
  () => import("./FCMTestInitializer"),
  { ssr: false }
);

export default function FCMTestPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
      <h1 className="text-2xl font-bold mb-4">🔥 FCM Push Test Page</h1>
      <p className="text-gray-400 mb-6">
        Mobile browser pe open karo aur button click karo. Sirf push notification ayegi.
      </p>
      <FCMTestInitializer />
    </main>
  );
}
