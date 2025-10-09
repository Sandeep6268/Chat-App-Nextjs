// app/api/send-notification/route.ts - FINAL CHECK
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, message, userId } = await request.json();

    console.log('📨 Sending notification:', { title, message, userId });

    // Validate environment
    if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
      throw new Error('OneSignal App ID missing');
    }
    if (!process.env.ONESIGNAL_REST_API_KEY) {
      throw new Error('OneSignal API Key missing');
    }

    // Simple payload
    const payload = {
      app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://chat-app-nextjs-gray-eta.vercel.app',
    };

    // Add user targeting if provided
    if (userId) {
      (payload as any).include_external_user_ids = [userId];
    } else {
      (payload as any).included_segments = ['Subscribed Users'];
    }

    console.log('🚀 Sending to OneSignal API...');

    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.errors?.join(', ') || 'OneSignal API failed');
    }

    console.log('✅ Notification sent successfully:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Notification sent',
      data: result,
    });

  } catch (error: any) {
    console.error('❌ Notification error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}