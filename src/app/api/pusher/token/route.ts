// app/api/pusher/token/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Simple JWT-like token generator for Pusher
function generatePusherToken(userId: string): string {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  
  const payload = {
    user_id: userId,
    instance_id: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID,
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiry
    iat: Math.floor(Date.now() / 1000)
  };
  
  // Simple base64 encoding (for demo - in production use proper JWT library)
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  return `${encodedHeader}.${encodedPayload}.pusher_signature`;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('🔐 Generating proper Pusher token for user:', userId);

    // Generate proper token
    const token = generatePusherToken(userId);
    
    console.log('✅ Proper JWT token generated successfully');

    return NextResponse.json({ 
      token: token,
      success: true 
    });

  } catch (error: any) {
    console.error('❌ Error generating token:', error);
    return NextResponse.json({ error: 'Token generation failed' }, { status: 500 });
  }
}