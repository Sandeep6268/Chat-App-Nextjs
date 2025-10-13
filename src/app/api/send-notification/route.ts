// path: src/app/api/send-notification/route.ts
import admin from "firebase-admin";
import { NextResponse } from "next/server";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.token) {
      return NextResponse.json({ success: false, error: "No FCM token found" }, { status: 400 });
    }

    const message = {
      token: body.token,
      notification: {
        title: body.notification.title.substring(0, 100),
        body: body.notification.body.substring(0, 200),
      },
      webpush: {
        fcm_options: {
          link: body.data?.click_action || process.env.NEXT_PUBLIC_APP_URL,
        },
        headers: {
          Urgency: "high",
        },
        notification: {
          title: body.notification.title,
          body: body.notification.body,
          icon: "/icon.png",
          data: body.data,
        },
      },
      data: {
        chatId: body.data?.chatId || "",
        senderName: body.data?.senderName || "",
        message: body.data?.message || "",
      },
    };

    const response = await admin.messaging().send(message);
    return NextResponse.json({ success: true, messageId: response });
  } catch (error: any) {
    console.error("❌ Send Notification Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
