// lib/pusher-beams-service.ts
import { PushNotifications } from '@pusher/push-notifications-server';

export class PusherBeamsService {
  private static beamsClient: PushNotifications;

  static getClient() {
    if (!this.beamsClient) {
      this.beamsClient = new PushNotifications({
        instanceId: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID!,
        secretKey: process.env.PUSHER_BEAMS_SECRET_KEY!,
      });
    }
    return this.beamsClient;
  }

  // Generate token for user
  static async generateToken(userId: string): Promise<string> {
    try {
      const beamsToken = this.getClient().generateToken(userId);
      return beamsToken;
    } catch (error) {
      console.error('Error generating Beams token:', error);
      throw error;
    }
  }

  // Send notification to specific user
  static async sendToUser(userId: string, title: string, body: string, data: any = {}) {
    try {
      const response = await this.getClient().publishToUsers([userId], {
        web: {
          notification: {
            title: title,
            body: body,
            deep_link: data.url || process.env.NEXT_PUBLIC_APP_URL,
            icon: '/icons/icon-192x192.png',
          },
          data: data,
        },
      });
      
      console.log('✅ Pusher notification sent:', response);
      return response;
    } catch (error) {
      console.error('❌ Error sending Pusher notification:', error);
      throw error;
    }
  }
}