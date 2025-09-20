import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyDoCU5xx-XIrMPTqSF4mOoH54iS-qY2MXo",
  authDomain: "healthpromise-36111.firebaseapp.com",
  projectId: "healthpromise-36111",
  storageBucket: "healthpromise-36111.firebasestorage.app",
  messagingSenderId: "506246950736",
  appId: "1:506246950736:web:2ca3bec04fae105f954655",
  measurementId: "G-1GL9ZPF93F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);
export const functions = getFunctions(app);

export default app;
