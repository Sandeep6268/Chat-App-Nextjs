// app/api/send-notification/route.ts - SIMPLIFIED VERSION
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token, notification, data } = await request.json();

    console.log('📤 Sending notification request received');

    if (!token) {
      return NextResponse.json(
        { error: 'FCM token is required' },
        { status: 400 }
      );
    }

    // Use fetch to send notification (simpler approach)
    const FCM_URL = 'https://fcm.googleapis.com/fcm/send';
    
    const message = {
      to: token,
      notification: {
        title: notification?.title || 'New Message',
        body: notification?.body || 'You have a new message',
        icon: '/icons/icon-192x192.png',
        click_action: data?.click_action || process.env.NEXT_PUBLIC_APP_URL
      },
      data: data || {},
    };

    const response = await fetch(FCM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${process.env.NEXT_PUBLIC_FIREBASE_SERVER_KEY || 'YOUR_SERVER_KEY'}`,
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`FCM error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ FCM notification sent successfully:', result);

    return NextResponse.json({ 
      success: true, 
      messageId: result 
    });
  } catch (error: any) {
    console.error('❌ Error sending notification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send notification' },
      { status: 500 }
    );
  }
}