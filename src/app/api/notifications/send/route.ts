import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { recipientId, senderName, messageText, chatId, senderId, type } = await request.json();

    console.log('📨 Sending notification to:', recipientId);

    if (!recipientId || !chatId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Dynamically import Firebase Admin
    const { adminFirestore, adminMessaging } = await import('@/lib/firebase/admin');

    // Get user's FCM tokens
    const userDoc = await adminFirestore.collection('users').doc(recipientId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const tokens = userData?.fcmTokens || [];

    console.log('📱 User FCM tokens:', tokens.length);

    if (tokens.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No FCM tokens found'
      });
    }

    // Get sender's actual name
    let actualSenderName = 'User';
    try {
      const senderDoc = await adminFirestore.collection('users').doc(senderId).get();
      if (senderDoc.exists) {
        const senderData = senderDoc.data();
        actualSenderName = senderData?.displayName || senderData?.email?.split('@')[0] || 'User';
      }
    } catch (error) {
      console.log('⚠️ Using default sender name');
    }

    // NOTIFICATION DATA (goes to service worker - MOST IMPORTANT)
    const dataPayload = {
      title: `${actualSenderName}`, // ACTUAL NAME
      body: messageText || 'Sent you a message',
      chatId: chatId,
      senderId: senderId
    };

    console.log('📤 Notification payload:', {
      title: dataPayload.title,
      chatId: chatId
    });

    // MESSAGE with BOTH notification and data
    const message = {
      tokens: tokens,
      notification: {
        title: `${actualSenderName}`,
        body: messageText?.length > 50 ? messageText.substring(0, 50) + '...' : messageText || 'Sent you a message'
      },
      data: dataPayload, // This is CRITICAL for service worker
      webpush: {
        fcmOptions: {
          link: `https://chat-app-nextjs-gray-eta.vercel.app/chat/${chatId}`,
        },
      }
    };

    // SEND NOTIFICATION
    const response = await adminMessaging.sendEachForMulticast(message);
    
    console.log('✅ Notification sent:', {
      success: response.successCount,
      failed: response.failureCount
    });

    return NextResponse.json({ 
      success: true, 
      sent: response.successCount,
      failed: response.failureCount,
      notification: {
        title: dataPayload.title,
        chatId: chatId
      }
    });

  } catch (error) {
    console.error('❌ Notification error:', error);
    return NextResponse.json({ 
      error: 'Failed to send notification'
    }, { status: 500 });
  }
}