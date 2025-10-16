// app/api/send-notification/route.ts
import { NextResponse } from 'next/server';

const ONESIGNAL_APP_ID = "da31d02e-4dc3-414b-b788-b1cb441a7738";
const ONESIGNAL_REST_API_KEY = "26v2tf243ebxee5accglxhhgt";

export async function POST(request: Request) {
  try {
    const { title, message, userId } = await request.json();

    const payload: any = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title || "Test Notification" },
      contents: { en: message || "Test message" },
      url: "https://your-app.com", // Your app URL
    };

    // Send to specific user or all
    if (userId) {
      payload.include_external_user_ids = [userId];
    } else {
      payload.included_segments = ["All"];
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.errors) {
      return NextResponse.json({ error: data.errors[0] }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      id: data.id 
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}