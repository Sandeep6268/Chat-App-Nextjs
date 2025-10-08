// app/api/send-notification/route.ts - UPDATED
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache for access tokens
let accessTokenCache: { token: string; expiry: number } | null = null;

// ✅ FIXED: Proper base URL configuration
const getBaseUrl = () => {
  // Use environment variable if available, otherwise use production URL
  return process.env.NEXT_PUBLIC_APP_URL || 'https://chat-app-nextjs-gray-eta.vercel.app';
};

export async function POST(request: NextRequest) {
  console.log('🚀 [API] Push notification request received');
  
  try {
    const body = await request.json();
    const { token, title, body: messageBody, data } = body;

    // Validate input
    if (!token || !title || !messageBody) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: token, title, body' 
        },
        { status: 400 }
      );
    }

    console.log('📤 [API] Sending to token:', token.substring(0, 20) + '...');

    // Get access token
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('Failed to get access token');
    }

    // ✅ FIXED: Use proper base URL
    const baseUrl = getBaseUrl();
    const chatId = data?.chatId;
    const targetUrl = chatId ? `${baseUrl}/chat/${chatId}` : baseUrl;

    console.log('📍 [API] Using base URL:', baseUrl);
    console.log('🎯 [API] Target URL:', targetUrl);

    // ✅ SIMPLIFIED: Use only essential fields to avoid duplicates
    const message = {
      token: token.trim(),
      notification: {
        title: title.substring(0, 100),
        body: messageBody.substring(0, 200),
      },
      webpush: {
        fcm_options: {
          link: targetUrl,
        },
        notification: {
          icon: '/icon-192.png',
          badge: '/badge-72x72.png',
          requireInteraction: true,
        }
      },
      // ✅ IMPORTANT: All data goes here for service worker
      data: {
        title: title.substring(0, 100),
        body: messageBody.substring(0, 200),
        chatId: chatId || '',
        targetUrl: targetUrl,
        click_action: targetUrl,
        timestamp: new Date().toISOString(),
        ...data
      }
    };

    // Send FCM message
    const fcmResponse = await fetch(
      `https://fcm.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      }
    );

    const responseData = await fcmResponse.json();

    if (!fcmResponse.ok) {
      console.error('❌ [API] FCM error:', responseData);
      
      if (responseData.error?.status === 'NOT_FOUND') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Token not registered',
            code: 'messaging/registration-token-not-registered'
          },
          { status: 410 }
        );
      }
      
      throw new Error(`FCM API error: ${responseData.error?.message || 'Unknown error'}`);
    }

    console.log('✅ [API] Push notification sent successfully');
    
    return NextResponse.json({
      success: true,
      messageId: responseData.name,
      targetUrl: targetUrl
    });

  } catch (error: any) {
    console.error('❌ [API] Error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

async function getAccessToken(): Promise<string | null> {
  // Return cached token if valid
  if (accessTokenCache && accessTokenCache.expiry > Date.now()) {
    return accessTokenCache.token;
  }

  try {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      token_uri: "https://oauth2.googleapis.com/token",
    };

    if (!serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error('Missing Firebase service account credentials');
    }

    const header = Buffer.from(JSON.stringify({
      alg: 'RS256',
      typ: 'JWT'
    })).toString('base64url');

    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(JSON.stringify({
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: serviceAccount.token_uri,
      exp: now + 3600,
      iat: now,
    })).toString('base64url');

    const crypto = await import('crypto');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(header + '.' + payload);
    const signature = sign.sign(serviceAccount.private_key, 'base64url');

    const jwt = `${header}.${payload}.${signature}`;

    const tokenResponse = await fetch(serviceAccount.token_uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.access_token) {
      accessTokenCache = {
        token: tokenData.access_token,
        expiry: Date.now() + 50 * 60 * 1000
      };
      return tokenData.access_token;
    }

    return null;
  } catch (error) {
    console.error('❌ [API] Error getting access token:', error);
    return null;
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'OK',
    message: 'Push notification API is running',
    timestamp: new Date().toISOString(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  });
}
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
              icon: '/icon-192.png',
              badge: '/badge.png',
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
