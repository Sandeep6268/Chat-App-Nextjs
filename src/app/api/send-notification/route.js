// For Pages Router: pages/api/send-notification.js
// For App Router: app/api/send-notification/route.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, url } = req.body;

    // Send notification via OneSignal REST API
    const oneSignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        contents: { en: message },
        included_segments: ['Subscribed Users'],
        url: url || process.env.NEXT_PUBLIC_APP_URL,
        chrome_web_icon: 'https://onesignal.com/images/notification_logo.png'
      })
    });

    const data = await oneSignalResponse.json();

    if (data.errors) {
      console.error('OneSignal API Error:', data.errors);
      return res.status(400).json({ 
        success: false, 
        error: data.errors.join(', ') 
      });
    }

    console.log('Notification sent successfully:', data);
    res.status(200).json({ success: true, data });

  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}