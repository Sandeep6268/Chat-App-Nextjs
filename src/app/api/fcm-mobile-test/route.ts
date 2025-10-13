// app/api/fcm-mobile-test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 FCM API called');
    
    const body = await request.json();
    const { token, title, body: messageBody, data } = body;

    // Basic validation
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    if (!process.env.FIREBASE_SERVER_KEY) {
      console.error('❌ FIREBASE_SERVER_KEY missing');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    console.log('🔑 Using server key:', process.env.FIREBASE_SERVER_KEY.substring(0, 10) + '...');

    // Simple FCM message
    const fcmMessage = {
      to: token,
      notification: {
        title: title || '📱 Test Notification',
        body: messageBody || 'Test message from FCM',
        icon: '/icon.png'
      },
      data: data || {},
      priority: 'high'
    };

    console.log('📤 Sending to FCM:', fcmMessage);

    // Send to FCM
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${process.env.FIREBASE_SERVER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fcmMessage),
    });

    const fcmResult = await fcmResponse.json();
    console.log('📩 FCM Response:', fcmResult);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      fcmResponse: fcmResult
    });

  } catch (error) {
    console.error('❌ FCM API Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Add this to handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}