import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, title, body: messageBody, data } = body;

    console.log('📤 Sending push via REST API to:', token?.substring(0, 20) + '...');

    // Validate input
    if (!token || !title || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields: token, title, body' },
        { status: 400 }
      );
    }

    // Get access token for FCM REST API
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      throw new Error('Failed to get FCM access token');
    }

    // Send using FCM REST API
    const fcmResponse = await fetch('https://fcm.googleapis.com/v1/projects/whatsapp-clone-69386/messages:send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: token,
          notification: {
            title: title,
            body: messageBody,
          },
          webpush: {
            notification: {
              
              requireInteraction: true,
            },
            fcmOptions: {
              link: process.env.NEXT_PUBLIC_APP_URL,
            },
          },
          data: data || {},
        }
      }),
    });

    if (!fcmResponse.ok) {
      const errorText = await fcmResponse.text();
      console.error('❌ FCM REST API error:', errorText);
      throw new Error(`FCM API error: ${fcmResponse.status}`);
    }

    const result = await fcmResponse.json();
    console.log('✅ Push notification sent via REST API:', result);

    return NextResponse.json({
      success: true,
      messageId: result.name,
      message: 'Push notification sent successfully'
    });

  } catch (error: any) {
    console.error('❌ Error sending push notification:', error);
    return NextResponse.json(
      { error: 'Failed to send push notification: ' + error.message },
      { status: 500 }
    );
  }
}

// Get access token for FCM REST API
async function getAccessToken(): Promise<string | null> {
  try {
    const serviceAccount = {
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };

    if (!serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error('Missing Firebase service account credentials');
    }

    const jwt = await createJWT(serviceAccount);
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('❌ Error getting access token:', error);
    return null;
  }
}

// Create JWT token
async function createJWT(serviceAccount: { private_key: string; client_email: string }): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // In a real implementation, you'd use a JWT library
  // This is simplified for demonstration
  return `${signatureInput}.signature`;
}
