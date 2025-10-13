import { NextRequest, NextResponse } from 'next/server';

interface NotificationRequest {
  token: string;
  title?: string;
  body?: string;
  data?: Record<string, string>;
}

interface FCMResponse {
  success: boolean;
  message?: string;
  messageId?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<FCMResponse>> {
  try {
    const { token, title, body, data }: NotificationRequest = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    if (!process.env.FIREBASE_SERVER_KEY) {
      console.error('❌ FIREBASE_SERVER_KEY is missing');
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
        icon: '/icon.png',
        click_action: window.location.origin
      },
      data: {
        ...data,
        type: 'mobile-test',
        url: window.location.origin
      },
      content_available: true,
      priority: 'high' as const,
      webpush: {
        headers: {
          Urgency: 'high'
        },
        notification: {
          icon: '/icon.png',
          badge: '/badge.png'
        }
      }
    };

    console.log('📤 Sending mobile test notification to:', token.substring(0, 20) + '...');

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${process.env.FIREBASE_SERVER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    console.log('📩 FCM Mobile Test Response:', result);

    if (result.success === 1) {
      return NextResponse.json({
        success: true,
        message: 'Mobile test notification sent successfully',
        messageId: result.results?.[0]?.message_id
      });
    } else {
      const errorMessage = result.results?.[0]?.error || 'Unknown FCM error';
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ Mobile test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}