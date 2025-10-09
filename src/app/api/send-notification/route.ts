// app/api/send-notification/route.ts - FIXED AUTHORIZATION
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

    console.log('🔑 API Key Present:', !!process.env.ONESIGNAL_REST_API_KEY);
    console.log('📱 App ID Present:', !!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID);

    // SIMPLIFIED payload
    const notificationPayload: any = {
      app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      url: url || process.env.NEXT_PUBLIC_APP_URL || 'https://chat-app-nextjs-gray-eta.vercel.app',
    };

    // Target specific user or all users
    if (userId) {
      notificationPayload.include_external_user_ids = [userId];
      console.log('🎯 Targeting user:', userId);
    } else {
      notificationPayload.included_segments = ['Subscribed Users'];
      console.log('🎯 Targeting all users');
    }

    console.log('🚀 Sending to OneSignal API...');

    // OneSignal API call with CORRECT authorization
    const oneSignalResponse = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ONESIGNAL_REST_API_KEY}`,
        'accept': 'application/json',
      },
      body: JSON.stringify(notificationPayload),
    });

    const responseText = await oneSignalResponse.text();
    console.log('📡 OneSignal Response Status:', oneSignalResponse.status);
    console.log('📡 OneSignal Response:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    if (!oneSignalResponse.ok) {
      console.error('❌ OneSignal API Error:', result);
      throw new Error(result.errors?.join(', ') || `API Error: ${oneSignalResponse.status}`);
    }

    console.log('✅ OneSignal Success:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      data: result,
    });

  } catch (error: any) {
    console.error('❌ Notification Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send notification',
        details: 'Check your OneSignal API key and App ID',
      },
      { status: 500 }
    );
  }
}