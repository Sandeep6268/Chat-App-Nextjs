// app/api/send-notification/route.ts - UPDATED FOR NEW API KEY
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, message, userId, chatId, url } = await request.json();

    console.log('📨 Received notification request:', { 
      title, 
      message, 
      userId,
      hasAppId: !!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      hasApiKey: !!process.env.ONESIGNAL_REST_API_KEY
    });

    // Validate required environment variables
    if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
      throw new Error('OneSignal App ID is missing');
    }

    if (!process.env.ONESIGNAL_REST_API_KEY) {
      throw new Error('OneSignal REST API Key is missing');
    }

    // Prepare notification payload
    const notificationPayload: any = {
      app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      // Default URL if not provided
      url: url || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      // Additional options for better delivery
      chrome_web_icon: '/icons/icon-192x192.png',
      chrome_web_badge: '/icons/icon-192x192.png',
      firefox_icon: '/icons/icon-192x192.png',
      // Increase visibility
      priority: 10,
      // Allow multiple notifications
      thread_id: chatId ? `chat_${chatId}` : undefined,
    };

    // Target specific user or all users
    if (userId) {
      notificationPayload.include_external_user_ids = [userId];
      console.log('🎯 Targeting specific user:', userId);
    } else {
      notificationPayload.included_segments = ['Subscribed Users'];
      console.log('🎯 Targeting all subscribed users');
    }

    console.log('🚀 Sending to OneSignal API...', {
      appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      apiKey: process.env.ONESIGNAL_REST_API_KEY ? '✅ Present' : '❌ Missing',
      payload: notificationPayload
    });

    // OneSignal REST API call - UPDATED FOR NEW KEY FORMAT
    const oneSignalResponse = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ONESIGNAL_REST_API_KEY}`, // 🔥 CHANGED TO Bearer
        'accept': 'application/json',
      },
      body: JSON.stringify(notificationPayload),
    });

    if (!oneSignalResponse.ok) {
      const errorText = await oneSignalResponse.text();
      console.error('❌ OneSignal API error response:', {
        status: oneSignalResponse.status,
        statusText: oneSignalResponse.statusText,
        error: errorText
      });
      throw new Error(`OneSignal API error: ${oneSignalResponse.status} - ${oneSignalResponse.statusText}`);
    }

    const result = await oneSignalResponse.json();
    
    console.log('✅ OneSignal API success:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      data: result,
    });

  } catch (error: any) {
    console.error('❌ Notification API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send notification',
        details: 'Check your OneSignal App ID and REST API Key',
      },
      { status: 500 }
    );
  }
}