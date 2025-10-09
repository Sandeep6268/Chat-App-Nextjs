import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { adminFirestore } = await import('@/lib/firebase/admin');
    
    const userDoc = await adminFirestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    
    return NextResponse.json({
      success: true,
      user: {
        uid: userData?.uid,
        email: userData?.email,
        displayName: userData?.displayName,
        fcmTokens: userData?.fcmTokens || [],
        fcmTokensCount: userData?.fcmTokens?.length || 0,
        hasFcmTokens: !!(userData?.fcmTokens?.length > 0)
      }
    });

  } catch (error) {
    console.error('Debug user error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}