import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, token, action = 'save' } = await request.json();

    console.log('🔑 Token management request:', { userId, action, token: token?.substring(0, 20) + '...' });

    if (!userId || !token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Dynamically import Firebase Admin
    const { admin, adminFirestore } = await import('@/lib/firebase/admin');

    if (!adminFirestore) {
      console.error('❌ Firebase Admin not properly initialized');
      return NextResponse.json({ 
        error: 'Token service not available',
        details: 'Firebase Admin not initialized'
      }, { status: 500 });
    }

    if (action === 'save') {
      await adminFirestore.collection('users').doc(userId).update({
        fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('✅ FCM token saved for user:', userId);
    } else if (action === 'remove') {
      await adminFirestore.collection('users').doc(userId).update({
        fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('✅ FCM token removed for user:', userId);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error managing FCM token:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}