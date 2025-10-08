// app/api/send-notification/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache for access tokens (use Redis in production)
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
    console.log('📱 [API] Notification data:', { title, messageBody, data });

    // Get access token
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('Failed to get access token');
    }

    // ✅ UPDATED: Enhanced message payload with proper click actions
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const chatId = data?.chatId;
    const targetUrl = chatId ? `${baseUrl}/chat/${chatId}` : baseUrl;

    const message = {
      token: token.trim(),
      notification: {
        title: title.substring(0, 100),
        body: messageBody.substring(0, 200),
      },
      webpush: {
        fcm_options: {
          link: targetUrl, // Direct link to chat
        },
        notification: {
          icon: '/icon-192.png',
          badge: '/badge-72x72.png',
          vibrate: [200, 100, 200],
          requireInteraction: true,
          // Add click action for browsers that support it
          click_action: targetUrl,
          actions: [
            {
              action: 'open-chat',
              title: '💬 Open Chat',
              icon: '/icon-192.png'
            },
            {
              action: 'dismiss',
              title: '❌ Dismiss',
              icon: '/icon-192.png'
            }
          ],
          data: data || {} // Include data in webpush notification
        },
        headers: {
          Urgency: 'high',
          Topic: chatId ? `chat-${chatId}` : 'general'
        }
      },
      data: {
        ...data,
        // Ensure these are always available for service worker
        chatId: chatId || '',
        click_action: targetUrl,
        url: targetUrl,
        timestamp: new Date().toISOString()
      },
      // Add this for iOS/mobile platforms
      apns: {
        payload: {
          aps: {
            alert: {
              title: title.substring(0, 100),
              body: messageBody.substring(0, 200),
            },
            sound: 'default',
            badge: 1,
            'content-available': 1
          },
          // Custom data for iOS
          chatId: chatId,
          click_action: targetUrl
        },
        fcm_options: {
          image: '/icon-192.png'
        }
      },
      // Android specific config
      android: {
        notification: {
          icon: 'icon-192.png',
          color: '#10B981',
          sound: 'default',
          click_action: targetUrl,
          tag: chatId ? `chat_${chatId}` : 'general'
        }
      }
    };

    console.log('📨 [API] Sending FCM message with target URL:', targetUrl);

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
      
      // Handle specific FCM errors
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
      
      if (responseData.error?.status === 'INVALID_ARGUMENT') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid token format',
            code: 'messaging/invalid-registration-token'
          },
          { status: 400 }
        );
      }
      
      throw new Error(`FCM API error: ${responseData.error?.message || 'Unknown error'}`);
    }

    console.log('✅ [API] Push notification sent successfully');
    console.log('🎯 [API] Message ID:', responseData.name);
    
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

    // Create JWT
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

    // Exchange JWT for access token
    const tokenResponse = await fetch(serviceAccount.token_uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.access_token) {
      // Cache the token (expires in 1 hour, but we'll refresh after 50 minutes)
      accessTokenCache = {
        token: tokenData.access_token,
        expiry: Date.now() + 50 * 60 * 1000 // 50 minutes
      };
      console.log('🔑 [API] New access token generated');
      return tokenData.access_token;
    }

    console.error('❌ [API] No access token in response');
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