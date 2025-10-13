// fcm-test/FCMTestInitializer.tsx
'use client';
import { useEffect, useState } from "react";
import { messaging, getToken, onMessage } from "@/app/fcm-test/firebase-config";

export default function FCMTestInitializer() {
  const [token, setToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    const registerFCM = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const currentToken = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          });
          setToken(currentToken);
          console.log("✅ FCM Token:", currentToken);
        } else {
          console.warn("🚫 Notification permission denied");
        }
      } catch (err) {
        console.error("❌ FCM error:", err);
      }
    };

    registerFCM();

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("📩 Message received:", payload);
      setNotification(payload.notification);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-gray-900 text-white mt-4">
      <h2 className="text-lg font-bold mb-2">🔔 FCM Mobile Test</h2>
      <p>Token:</p>
      <textarea
        readOnly
        value={token || "Requesting..."}
        className="w-full h-24 p-2 text-sm bg-gray-800 border rounded"
      />
      {notification && (
        <div className="mt-3 p-2 bg-green-700 rounded">
          <h3 className="font-semibold">📨 Notification:</h3>
          <p>Title: {notification.title}</p>
          <p>Body: {notification.body}</p>
        </div>
      )}
      <button
  className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
  onClick={async () => {
    if (!token) return alert("Token not ready");

    const res = await fetch("/fcm-test/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        title: "Test Notification",
        body: "This is a FCM test message from your mobile page",
      }),
    });

    const data = await res.json();
    console.log("Notification send response:", data);
  }}
>
  Send Test Notification
</button>

    </div>
  );
}
