// app/api/send-notification/route.ts
import { NextResponse } from 'next/server';

// Your OneSignal credentials
const ONESIGNAL_APP_ID = "da31d02e-4dc3-414b-b788-b1cb441a7738";
const ONESIGNAL_REST_API_KEY = "26v2tf243ebxee5accglxhhgt"; // Your REST API Key

export async function POST(request: Request) {
  try {
    const { title, message, userId } = await request.json();

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    // Prepare the notification payload
    const payload: any = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      url: "https://chat-app-nextjs-gray-eta.vercel.app", // Your app URL
      // Add icons for better appearance
      chrome_web_icon: "https://chat-app-nextjs-gray-eta.vercel.app/icon.png",
      chrome_web_badge: "https://chat-app-nextjs-gray-eta.vercel.app/icon.png",
    };

    // Send to specific user or all subscribers
    if (userId) {
      payload.include_external_user_ids = [userId];
    } else {
      payload.included_segments = ["Subscribed Users"];
    }

    console.log('Sending OneSignal notification with payload:', {
      appId: ONESIGNAL_APP_ID,
      title,
      message,
      userId: userId || 'all users'
    });

    // Send to OneSignal API
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    console.log('OneSignal API response:', result);

    if (result.errors) {
      return NextResponse.json(
        { 
          error: result.errors.join(', ') || 'OneSignal API error',
          details: result
        },
        { status: 400 }
      );
    }

    if (result.id) {
      return NextResponse.json({
        success: true,
        message: 'Notification sent successfully',
        notificationId: result.id,
        recipients: result.recipients
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('OneSignal API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}