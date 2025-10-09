// app/api/send-notification/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, message, userId } = await request.json();

    // OneSignal REST API call
    const oneSignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        headings: { en: title },
        contents: { en: message },
        url: process.env.NEXT_PUBLIC_APP_URL,
        // Target specific user or all users
        ...(userId ? {
          include_external_user_ids: [userId]
        } : {
          included_segments: ['All']
        }),
        // Additional options
        chrome_web_icon: '/icons/icon-192x192.png',
        firefox_icon: '/icons/icon-192x192.png',
      }),
    });

    if (!oneSignalResponse.ok) {
      const errorText = await oneSignalResponse.text();
      console.error('OneSignal API error:', errorText);
      throw new Error(`OneSignal API error: ${oneSignalResponse.status}`);
    }

    const result = await oneSignalResponse.json();
    
    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      data: result,
    });

  } catch (error: any) {
    console.error('Notification API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send notification',
      },
      { status: 500 }
    );
  }
}