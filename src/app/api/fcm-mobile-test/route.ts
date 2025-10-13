// app/api/fcm-mobile-test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Sirf simple JSON return karo
  return NextResponse.json({
    success: true,
    message: "Notification sent successfully"
  });
}