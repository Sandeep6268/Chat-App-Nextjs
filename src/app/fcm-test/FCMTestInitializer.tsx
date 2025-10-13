'use client';
import { useEffect, useState } from "react";
import { messaging, getToken, onMessage } from "@/app/fcm-test/firebase-config";

export default function FCMTestInitializer() {
  const [token, setToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any>(null);
  const [sending, setSending] = useState(false);

  // FCM token request
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

  // Button click: send test notification
  const sendTestNotification = async () => {
    if (!token) return alert("Token not ready yet!");
    setSending(true);

    try {
      const res = await fetch("/fcm-test/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          title: "Test Notification 🔔",
          body: "This is a manual FCM test message.",
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Server error:", text);
        alert("Failed to send notification. Check console.");
        setSending(false);
        return;
      }

      const data = await res.json();
      console.log("Notification sent:", data);
      alert("Notification sent! Check your device.");
    } catch (err) {
      console.error(err);
      alert("Error sending notification. See console.");
    }

    setSending(false);
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-900 text-white mt-4 w-full max-w-md">
      <h2 className="text-lg font-bold mb-2">🔔 FCM Mobile Test</h2>

      <p>Token:</p>
      <textarea
        readOnly
        value={token || "Requesting..."}
        className="w-full h-24 p-2 text-sm bg-gray-800 border rounded mb-4"
      />

      <button
        onClick={sendTestNotification}
        disabled={!token || sending}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 mb-4"
      >
        {sending ? "Sending..." : "Send Test Notification"}
      </button>

      {notification && (
        <div className="mt-3 p-2 bg-green-700 rounded">
          <h3 className="font-semibold">📨 Notification Received:</h3>
          <p>Title: {notification.title}</p>
          <p>Body: {notification.body}</p>
        </div>
      )}
    </div>
  );
}
