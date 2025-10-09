// app/api/pusher/notify/route.ts - WORKING VERSION
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, data } = await request.json();

    console.log('📤 Sending notification to user:', userId);

    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // SIMPLE PUSHER PAYLOAD - No complex features
    const publishBody = {
      users: [userId],
      web: {
        notification: {
          title: title,
          body: body,
          // icon: "/icons/icon-192x192.png", // Remove for now
          // deep_link: data?.url // Remove for now
        },
        data: data || {}
      }
    };

    console.log('🚀 Pusher publish body:', JSON.stringify(publishBody));

    const response = await fetch(
      `https://${process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID}.pushnotifications.pusher.com/publish_api/v1/instances/${process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID}/publishes/users`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PUSHER_BEAMS_SECRET_KEY}`
        },
        body: JSON.stringify(publishBody)
      }
    );

    const responseText = await response.text();
    console.log('📨 Pusher response:', response.status, responseText);

    if (!response.ok) {
      throw new Error(`Pusher API error: ${response.status} - ${responseText}`);
    }

    const result = JSON.parse(responseText);
    console.log('✅ Pusher notification sent:', result);

    return NextResponse.json({ 
      success: true, 
      result,
      message: 'Notification sent to Pusher'
    });

  } catch (error: any) {
    console.error('❌ Notification error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}