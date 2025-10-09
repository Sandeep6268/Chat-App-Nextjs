// app/api/pusher/token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PusherBeamsService } from '@/lib/pusher-beams-service';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const token = await PusherBeamsService.generateToken(userId);

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating Beams token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}