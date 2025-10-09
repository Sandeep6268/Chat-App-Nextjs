// lib/pusher-beams-client.ts
'use client';

// Client-side Pusher Beams setup
export class PusherBeamsClient {
  private static async getServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.getServiceWorker();
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    return null;
  }

  // Initialize Pusher Beams on client
  static async initialize(userId: string) {
    try {
      // Service worker register karein
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/pusher-service-worker.js');
        console.log('✅ Service Worker registered');
      }

      // Get Beams token from server
      const tokenResponse = await fetch('/api/pusher/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get Beams token');
      }

      const { token } = await tokenResponse.json();
      
      // Set user ID for Beams
      if ((window as any).Beams) {
        await (window as any).Beams.setUserId(userId, token);
        console.log('✅ Pusher Beams initialized for user:', userId);
      }

    } catch (error) {
      console.error('❌ Pusher Beams initialization failed:', error);
    }
  }

  // Cleanup when user logs out
  static async cleanup() {
    try {
      if ((window as any).Beams) {
        await (window as any).Beams.clearAllState();
        console.log('✅ Pusher Beams cleaned up');
      }
    } catch (error) {
      console.error('Error cleaning up Beams:', error);
    }
  }
}