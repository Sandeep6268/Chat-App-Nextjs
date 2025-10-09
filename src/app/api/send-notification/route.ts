// app/api/send-notification/route.ts - FINAL WORKING VERSION
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, message, userId, chatId, url } = await request.json();

    console.log('📨 Notification Request:', { title, message, userId });

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
      throw new Error('OneSignal App ID missing');
    }
    if (!process.env.ONESIGNAL_REST_API_KEY) {
      throw new Error('OneSignal API Key missing');
    }

    // SIMPLIFIED payload - remove problematic icon fields
    const notificationPayload: any = {
      app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      url: url || process.env.NEXT_PUBLIC_APP_URL || 'https://chat-app-nextjs-gray-eta.vercel.app',
      priority: 10,
    };

    // Target specific user or all users
    if (userId) {
      notificationPayload.include_external_user_ids = [userId];
    } else {
      notificationPayload.included_segments = ['Subscribed Users'];
    }

    console.log('🚀 Sending to OneSignal...');

    // OneSignal API call
    const oneSignalResponse = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(notificationPayload),
    });

    const result = await oneSignalResponse.json();

    if (!oneSignalResponse.ok) {
      console.error('❌ OneSignal API Error:', result);
      throw new Error(result.errors?.join(', ') || 'OneSignal API failed');
    }

    console.log('✅ OneSignal Success:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Notification sent',
      data: result,
    });

  } catch (error: any) {
    console.error('❌ Notification Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send notification',
      },
      { status: 500 }
    );
  }
}