import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { recipientId, senderName, messageText, chatId, senderId, type } = await request.json();

    if (!recipientId || !chatId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Dynamically import Firebase Admin to avoid build issues
    const { adminFirestore, adminMessaging } = await import('@/lib/firebase/admin');

    // Get user's FCM tokens from Firestore
    const userDoc = await adminFirestore.collection('users').doc(recipientId).get();
    const userData = userDoc.data();
    const tokens = userData?.fcmTokens || [];

    if (tokens.length === 0) {
      return NextResponse.json({ success: true, message: 'No FCM tokens found' });
    }

    let payload;

    if (type === 'new_message') {
      payload = {
        title: senderName,
        body: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
        data: {
          chatId,
          senderId,
          type: 'new_message',
          click_action: `https://chat-app-nextjs-gray-eta.vercel.app/chat/${chatId}`,
        },
      };
    } else if (type === 'unread_count') {
      payload = {
        title: `${senderName}`,
        body: `You have new unread messages`,
        data: {
          chatId,
          senderId: 'system',
          type: 'unread_count',
          click_action: `https://chat-app-nextjs-gray-eta.vercel.app/chat/${chatId}`,
        },
      };
    }

    const message = {
      tokens,
      notification: payload,
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
        },
        fcmOptions: {
          link: `https://chat-app-nextjs-gray-eta.vercel.app/chat/${chatId}`,
        },
      },
    };

    const response = await adminMessaging.sendEachForMulticast(message);
    
    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const cleanupPromises = response.responses.map(async (resp, idx) => {
        if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
          await adminFirestore.collection('users').doc(recipientId).update({
            fcmTokens: admin.firestore.FieldValue.arrayRemove(tokens[idx]),
          });
        }
      });
      await Promise.all(cleanupPromises);
    }

    return NextResponse.json({ 
      success: true, 
      sent: response.successCount,
      failed: response.failureCount 
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}