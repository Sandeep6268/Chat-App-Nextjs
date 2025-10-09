// app/api/send-user-notification/route.ts - NEW
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, message, userId } = await request.json();

    console.log('🎯 Sending USER-TARGETED notification:', { title, message, userId });

    // Validate environment
    if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY) {
      throw new Error('OneSignal configuration missing');
    }

    // CRITICAL: For user targeting, we need to use include_external_user_ids
    const payload = {
      app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://chat-app-nextjs-gray-eta.vercel.app',
      chrome_web_icon: '/icons/icon-192x192.png',
      
      // 🎯 THIS IS THE KEY FOR USER TARGETING
      include_external_user_ids: [userId],
      
      // Important: Don't use included_segments when targeting specific users
      // included_segments: ['All'] // ❌ REMOVE THIS for user targeting
    };

    console.log('🚀 User-Targeted Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    console.log('📡 OneSignal Response:', {
      status: response.status,
      result: result
    });

    if (!response.ok) {
      throw new Error(result.errors?.join(', ') || `OneSignal API failed: ${response.status}`);
    }

    console.log('✅ User-targeted notification sent successfully');
    
    return NextResponse.json({
      success: true,
      message: 'User-targeted notification sent',
      data: result,
    });

  } catch (error: any) {
    console.error('❌ User-targeted notification error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}