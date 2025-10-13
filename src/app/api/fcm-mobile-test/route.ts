// app/api/fcm-mobile-test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token, title, body } = await request.json();

    // FIREBASE_SERVER_KEY check karo
    const serverKey = process.env.FIREBASE_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json({
        success: false,
        error: "Server key missing"
      });
    }

    // Real FCM call
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${serverKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title: title || "📱 Test Notification",
          body: body || "This is a real push notification!",
          icon: "/icon.png",
          click_action: "https://chat-app-nextjs-gray-eta.vercel.app"
        },
        data: {
          type: "test",
          timestamp: new Date().toISOString()
        },
        priority: "high"
      }),
    });

    const result = await fcmResponse.json();
    
    if (result.success === 1) {
      return NextResponse.json({
        success: true,
        message: "Push notification sent successfully!",
        fcmResult: result
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.results?.[0]?.error || "FCM delivery failed"
      });
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}