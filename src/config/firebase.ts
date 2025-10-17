import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Messaging은 웹 환경에서만 초기화 (네이티브에서는 Capacitor PushNotifications 사용)
let messaging: any = null;
try {
  if (typeof window !== 'undefined') {
    const isNative = (window as any)?.Capacitor?.isNativePlatform?.() === true;
    
    if (!isNative && 'serviceWorker' in navigator) {
      // 웹 환경에서만 Firebase Messaging 사용
      isSupported().then((supported) => {
        if (!supported) {
          console.log('Firebase Messaging not supported in this browser');
          return;
        }
        messaging = getMessaging(app);
        navigator.serviceWorker
          .register('/firebase-messaging-sw.js')
          .then((registration) => {
            console.log('Service Worker 등록 성공:', registration);
          })
          .catch((error) => {
            console.log('Service Worker 등록 실패:', error);
          });
      });
    } else if (isNative) {
      console.log('네이티브 앱에서는 Capacitor PushNotifications 사용');
    }
  }
} catch (error) {
  console.log('Firebase Messaging 초기화 실패:', error);
}

export { messaging };

export default app;
