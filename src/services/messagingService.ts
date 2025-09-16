import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../config/firebase';

export class MessagingService {
  private static readonly VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

  static async getFCMToken(): Promise<string | null> {
    try {
      if (!this.VAPID_KEY) {
        console.warn('VAPID key not configured');
        return null;
      }

      const token = await getToken(messaging, {
        vapidKey: this.VAPID_KEY,
      });

      if (token) {
        console.log('FCM Token:', token);
        return token;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } catch (error) {
      console.error('An error occurred while retrieving token:', error);
      return null;
    }
  }

  static onMessage(callback: (payload: any) => void): () => void {
    return onMessage(messaging, callback);
  }

  static async requestPermission(): Promise<boolean> {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }
}
