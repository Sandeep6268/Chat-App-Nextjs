// app/api/send-notification/route.ts
import { NextResponse } from 'next/server';

const ONESIGNAL_APP_ID = "da31d02e-4dc3-414b-b788-b1cb441a7738";
const ONESIGNAL_REST_API_KEY = "26v2tf243ebxee5accglxhhgt";

export async function POST(request: Request) {
  try {
    const { title, message, userId, data } = await request.json();

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    // Prepare notification payload
    const notificationPayload: any = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      data: data || {},
      chrome_web_icon: "https://yourdomain.com/icon.png",
      chrome_web_badge: "https://yourdomain.com/badge.png",
    };

    // Send to specific user or broadcast
    if (userId) {
      notificationPayload.include_external_user_ids = [userId];
    } else {
      notificationPayload.included_segments = ["Subscribed Users"];
    }

    // Send notification via OneSignal API
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationPayload),
    });

    const result = await response.json();

    if (result.id) {
      return NextResponse.json({
        success: true,
        message: 'Notification sent successfully',
        notificationId: result.id
      });
    } else {
      return NextResponse.json(
        { error: result.errors?.join(', ') || 'Failed to send notification' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('OneSignal API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}