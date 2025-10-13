// app/api/fcm-mobile-test/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface NotificationRequest {
  token: string;
  title?: string;
  body?: string;
  data?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const { token, title, body, data }: NotificationRequest = await request.json();

    // Validation
    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Token is required' 
        },
        { status: 400 }
      );
    }

    if (!process.env.FIREBASE_SERVER_KEY) {
      console.error('❌ FIREBASE_SERVER_KEY is missing');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Server configuration error' 
        },
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
        url: typeof window !== 'undefined' ? window.location.origin : 'https://chat-app-nextjs-gray-eta.vercel.app'
      },
      content_available: true,
      priority: 'high' as const,
      webpush: {
        headers: {
          Urgency: 'high'
        }
      }
    };

    console.log('📤 Sending FCM message to:', token.substring(0, 20) + '...');

    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${process.env.FIREBASE_SERVER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const fcmResult = await fcmResponse.json();

    console.log('📩 FCM Response:', fcmResult);

    // FCM response handling
    if (fcmResult.success === 1 || fcmResult.message_id) {
      return NextResponse.json({
        success: true,
        message: 'Notification sent successfully',
        messageId: fcmResult.message_id || fcmResult.results?.[0]?.message_id
      });
    } else {
      const errorMessage = fcmResult.results?.[0]?.error || fcmResult.error || 'Unknown FCM error';
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ FCM API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}

// Add OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}