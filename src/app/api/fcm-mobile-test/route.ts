// app/api/fcm-mobile-test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token, title, body } = await request.json();

    if (!process.env.FIREBASE_SERVER_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: "Server key missing" 
      });
    }

    // Actual FCM call
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${process.env.FIREBASE_SERVER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title: title || "📱 Test Notification",
          body: body || "This is a push notification test",
          icon: "/icon.png"
        },
        priority: "high"
      }),
    });

    const result = await fcmResponse.json();
    
    if (result.success === 1) {
      return NextResponse.json({
        success: true,
        message: "Push notification sent!"
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.results?.[0]?.error || "FCM failed"
      });
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}