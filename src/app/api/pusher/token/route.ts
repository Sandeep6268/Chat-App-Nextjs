// app/api/pusher/token/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Pusher Beams ke liye correct token format
    // Yeh simple JWT-like token hai jo Pusher expect karta hai
    const token = {
      token: `v1:${process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID}:${userId}:${Date.now()}`,
      userId: userId
    };

    console.log('✅ Generated Pusher token for user:', userId);

    return NextResponse.json(token);
  } catch (error) {
    console.error('Error generating Beams token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}