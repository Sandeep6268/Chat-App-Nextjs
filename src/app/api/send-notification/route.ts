// app/api/send-notification/route.ts - UPDATED
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, message, userId } = await request.json();

    console.log('📨 Sending notification request:', { title, message, userId });

    // Validate environment
    if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
      throw new Error('OneSignal App ID missing');
    }
    if (!process.env.ONESIGNAL_REST_API_KEY) {
      throw new Error('OneSignal API Key missing');
    }

    // IMPORTANT: For web push, we need to use included_segments
    const payload: any = {
      app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://chat-app-nextjs-gray-eta.vercel.app',
      chrome_web_icon: '/icons/icon-192x192.png',
      chrome_web_badge: '/icons/icon-72x72.png',
    };

    // 🚨 CRITICAL FIX: Use segments instead of external_user_ids for web push
    if (userId) {
      console.log('🎯 Targeting specific user:', userId);
      // For web push, we need to use include_external_user_ids with segments
      payload.include_external_user_ids = [userId];
      payload.included_segments = ['Active Users']; // Required for web push
    } else {
      console.log('📢 Broadcasting to all users');
      payload.included_segments = ['All'];
    }

    console.log('🚀 OneSignal Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    console.log('📡 OneSignal API Response:', {
      status: response.status,
      statusText: response.statusText,
      result: result
    });

    if (!response.ok) {
      console.error('❌ OneSignal API Error:', result);
      throw new Error(result.errors?.join(', ') || `OneSignal API failed: ${response.status}`);
    }

    console.log('✅ Notification sent successfully:', {
      notificationId: result.id,
      recipients: result.recipients,
      external_id: result.external_id
    });
    
    return NextResponse.json({
      success: true,
      message: 'Notification sent to OneSignal',
      data: result,
    });

  } catch (error: any) {
    console.error('❌ Notification error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.stack,
      },
      { status: 500 }
    );
  }
}