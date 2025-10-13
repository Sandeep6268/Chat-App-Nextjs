// app/api/fcm-mobile-test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token, title, body, data } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    if (!process.env.FIREBASE_SERVER_KEY) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const message = {
      to: token,
      notification: {
        title: title || '📱 Mobile Test Notification',
        body: body || 'This is a test from FCM Mobile Tester',
        icon: '/icon.png'
      },
      data: {
        ...data,
        type: 'mobile-test',
        url: 'https://chat-app-nextjs-gray-eta.vercel.app' // Hardcode karo
      },
      content_available: true,
      priority: 'high' as const
    };

    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${process.env.FIREBASE_SERVER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const fcmResult = await fcmResponse.json();

    if (fcmResult.success === 1) {
      return NextResponse.json({
        success: true,
        message: 'Notification sent successfully',
        messageId: fcmResult.results?.[0]?.message_id
      });
    } else {
      const errorMessage = fcmResult.results?.[0]?.error || 'Unknown FCM error';
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}