import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache for access tokens
let accessTokenCache: { token: string; expiry: number } | null = null;

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

    // ✅ FIXED: Use production URL directly
    const baseUrl = 'https://chat-app-nextjs-gray-eta.vercel.app';
    const chatId = data?.chatId;
    const targetUrl = chatId ? `${baseUrl}/chat/${chatId}` : baseUrl;

    console.log('📍 [API] Using base URL:', baseUrl);
    console.log('🎯 [API] Target URL:', targetUrl);

    // ✅ FIXED: Simplified payload to avoid duplicates
    const message = {
      token: token.trim(),
      // Remove notification field to prevent duplicates
      data: {
        title: title.substring(0, 100),
        body: messageBody.substring(0, 200),
        chatId: chatId || '',
        targetUrl: targetUrl,
        click_action: targetUrl,
        timestamp: new Date().toISOString(),
        icon: '/icon-192.png',
        ...data
      },
      webpush: {
        fcm_options: {
          link: targetUrl,
        }
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