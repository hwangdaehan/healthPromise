// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDoCU5xx-XIrMPTqSF4mOoH54iS-qY2MXo",
  authDomain: "healthpromise-36111.firebaseapp.com",
  projectId: "healthpromise-36111",
  storageBucket: "healthpromise-36111.firebasestorage.app",
  messagingSenderId: "506246950736",
  appId: "1:506246950736:web:2ca3bec04fae105f954655",
  measurementId: "G-1GL9ZPF93F"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
