import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, message, userId } = await request.json();

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Title and message are required' },
        { status: 400 }
      );
    }

    const onesignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const onesignalRestApiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!onesignalAppId || !onesignalRestApiKey) {
      return NextResponse.json(
        { success: false, error: 'OneSignal configuration missing' },
        { status: 500 }
      );
    }

    // Prepare notification data
    const notificationData: any = {
      app_id: onesignalAppId,
      headings: { en: title },
      contents: { en: message },
      url: `${process.env.NEXT_PUBLIC_APP_URL}/onesignal-test`,
    };

    // Send to specific user if provided, otherwise to all subscribed users
    if (userId) {
      notificationData.include_external_user_ids = [userId];
    } else {
      notificationData.included_segments = ['Subscribed Users'];
    }

    // Send notification via OneSignal API
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${onesignalRestApiKey}`,
      },
      body: JSON.stringify(notificationData),
    });

    const result = await response.json();

    if (result.errors) {
      console.error('OneSignal API Error:', result.errors);
      return NextResponse.json(
        { success: false, error: result.errors[0] },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Notification sent successfully',
    });
  } catch (error) {
    console.error('Error sending OneSignal notification:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}