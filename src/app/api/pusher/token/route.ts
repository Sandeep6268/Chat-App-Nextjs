// app/api/pusher/token/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Simple token generation without external package
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // For now, return a simple token structure
    // In production, you'd use the Pusher SDK
    const token = {
      user_id: userId,
      timestamp: Date.now(),
      instance_id: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID
    };

    return NextResponse.json({ 
      token: JSON.stringify(token),
      success: true 
    });
  } catch (error) {
    console.error('Error generating Beams token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}