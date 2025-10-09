// app/api/pusher/token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PushNotifications } from '@pusher/push-notifications-server';

// Initialize Pusher Beams client
const beamsClient = new PushNotifications({
  instanceId: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID!,
  secretKey: process.env.PUSHER_BEAMS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('🔐 Generating Pusher token for user:', userId);

    // Use Pusher SDK to generate proper JWT token
    const beamsToken = beamsClient.generateToken(userId);

    console.log('✅ Token generated successfully');

    return NextResponse.json({ 
      token: beamsToken,
      success: true 
    });
  } catch (error: any) {
    console.error('❌ Error generating Beams token:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}