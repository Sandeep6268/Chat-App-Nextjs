// app/api/pusher/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, data } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use Pusher Beams API directly
    const response = await fetch('https://' + process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID + '.pushnotifications.pusher.com/publish_api/v1/instances/' + process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID + '/publishes/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.PUSHER_BEAMS_SECRET_KEY
      },
      body: JSON.stringify({
        users: [userId],
        web: {
          notification: {
            title: title,
            body: body,
            deep_link: data?.url || process.env.NEXT_PUBLIC_APP_URL,
            icon: '/icons/icon-192x192.png',
          },
          data: data
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pusher API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Notification sent via Pusher API:', result);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}