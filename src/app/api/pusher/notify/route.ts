// app/api/pusher/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PusherBeamsService } from '@/lib/pusher-beams-service';

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, data } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await PusherBeamsService.sendToUser(userId, title, body, data);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}