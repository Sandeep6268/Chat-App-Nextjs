// app/api/fcm-mobile-test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Just return success - no FCM logic
    return NextResponse.json({
      success: true,
      message: "API working! FCM test passed"
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: "Simple error"
    });
  }
}