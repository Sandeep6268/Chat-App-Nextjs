import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test if we can require firebase-admin
    const admin = require('firebase-admin');
    
    return NextResponse.json({
      success: true,
      message: 'Firebase Admin can be required',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Cannot require firebase-admin',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}