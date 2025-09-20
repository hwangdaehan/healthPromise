import { getToken, onMessage } from 'firebase/messaging';
import { messaging, functions } from '../config/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';

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

  // 테스트용 로컬 알림 표시
  static showLocalNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: '/favicon.png',
        badge: '/favicon.png'
      });
    }
  }

  // 서버를 통한 FCM 푸시 발송
  static async sendPushNotification(title: string, body: string, userId?: string): Promise<boolean> {
    try {
      const sendPushToUser = httpsCallable(functions, 'sendPushToUser');
      
      // userId가 없으면 현재 사용자 ID 사용
      let targetUserId = userId;
      if (!targetUserId) {
        const savedUserInfo = localStorage.getItem('userInfo');
        if (savedUserInfo) {
          const userInfo = JSON.parse(savedUserInfo);
          targetUserId = userInfo.uid;
        }
      }
      
      if (!targetUserId) {
        console.error('사용자 ID가 없습니다.');
        return false;
      }
      
      const result = await sendPushToUser({
        userId: targetUserId,
        title: title,
        body: body,
        data: {
          type: 'manual',
          timestamp: new Date().toISOString()
        }
      });
      
      console.log('푸시 알림 발송 성공:', result.data);
      return true;
    } catch (error) {
      console.error('푸시 알림 발송 실패:', error);
      return false;
    }
  }

  // 테스트 푸시 발송
  static async sendTestPush(title?: string, body?: string): Promise<boolean> {
    try {
      const sendTestPush = httpsCallable(functions, 'sendTestPush');
      
      const result = await sendTestPush({
        title: title || '테스트 알림',
        body: body || '테스트 메시지입니다.'
      });
      
      console.log('테스트 푸시 발송 성공:', result.data);
      return true;
    } catch (error) {
      console.error('테스트 푸시 발송 실패:', error);
      return false;
    }
  }

  // FCM 토큰 가져오기 (localStorage에서)
  static getStoredToken(): string | null {
    return localStorage.getItem('fcmToken');
  }

  // 사용자별 FCM 토큰 저장 (user 컬렉션의 pushToken 필드에 저장)
  static async saveUserFCMToken(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'user', userId);
      
      // 먼저 문서가 존재하는지 확인
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // 문서가 존재하면 업데이트
        await updateDoc(userRef, {
          pushToken: token,
          updatedAt: new Date()
        });
        console.log('FCM 토큰 업데이트 완료:', userId);
      } else {
        // 문서가 없으면 FCM 토큰 저장하지 않음
        console.log('사용자 문서가 존재하지 않습니다. FCM 토큰을 저장하지 않습니다:', userId);
        return;
      }
    } catch (error) {
      console.error('FCM 토큰 저장 실패:', error);
    }
  }

  // 사용자별 FCM 토큰 가져오기 (user 컬렉션에서 조회)
  static async getUserFCMToken(userId: string): Promise<string | null> {
    try {
      const userRef = doc(db, 'user', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.pushToken || null;
      }
      return null;
    } catch (error) {
      console.error('FCM 토큰 조회 실패:', error);
      return null;
    }
  }

  // FCM 토큰 초기화 및 저장
  static async initializeAndSaveToken(): Promise<string | null> {
    try {
      // 권한 요청
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('알림 권한이 거부되었습니다.');
        return null;
      }

      // FCM 토큰 가져오기
      const token = await this.getFCMToken();
      if (!token) {
        console.log('FCM 토큰을 가져올 수 없습니다.');
        return null;
      }

      // localStorage에서 사용자 정보 가져오기
      const savedUserInfo = localStorage.getItem('userInfo');
      
      if (savedUserInfo) {
        const userInfo = JSON.parse(savedUserInfo);
        const userId = userInfo.uid;
        
        console.log('FCM 토큰 저장 - 사용자 정보:', userInfo);
        console.log('FCM 토큰 저장 - userId:', userId);
        
        if (userId) {
          // user 컬렉션에 사용자가 존재하는지 확인 후 pushToken 저장
          const userRef = doc(db, 'user', userId);
          console.log('FCM 토큰 저장 - userRef 경로:', userRef.path);
          
          const userDoc = await getDoc(userRef);
          console.log('FCM 토큰 저장 - 문서 존재 여부:', userDoc.exists());
          
          if (userDoc.exists()) {
            console.log('FCM 토큰 저장 - 사용자 찾음, 토큰 저장 시작');
            // user 컬렉션에 pushToken 저장
            await this.saveUserFCMToken(userId, token);
            
            // 세션에도 pushToken 저장
            const updatedUserInfo = { ...userInfo, pushToken: token };
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
            console.log('FCM 토큰 저장 - 완료');
          } else {
            console.log('user 컬렉션에 사용자가 존재하지 않습니다. FCM 토큰을 저장하지 않습니다:', userId);
          }
        } else {
          console.log('FCM 토큰 저장 - userId가 없음');
        }
      } else {
        console.log('FCM 토큰 저장 - localStorage에 userInfo 없음');
      }

      // localStorage에도 저장
      localStorage.setItem('fcmToken', token);
      
      return token;
    } catch (error) {
      console.error('FCM 토큰 초기화 실패:', error);
      return null;
    }
  }

  // 예약 알림 체크 및 발송
  static async checkAndSendReservationNotifications(): Promise<void> {
    try {
      // localStorage에서 사용자 정보 가져오기
      const savedUserInfo = localStorage.getItem('userInfo');
      if (!savedUserInfo) return;

      const userInfo = JSON.parse(savedUserInfo);
      const userId = userInfo.uid;
      if (!userId) return;

      // 모든 예약 데이터 가져오기
      const { getReservations } = await import('./reservationService');
      const allReservations = await getReservations();

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // 내일 예약이 있는지 확인
      const tomorrowReservations = allReservations.filter(reservation => {
        const reservationDate = reservation.reservationDate;
        
        return (
          reservationDate >= tomorrow && 
          reservationDate < dayAfterTomorrow
        );
      });

      // 내일 예약이 있으면 알림 발송
      if (tomorrowReservations.length > 0) {
        for (const reservation of tomorrowReservations) {
          const reservationDate = reservation.reservationDate;
          
          const month = reservationDate.getMonth() + 1;
          const day = reservationDate.getDate();
          const hour = reservationDate.getHours();
          const hospitalName = reservation.hospitalName;

          const notificationTitle = '병원 예약 알림';
          const notificationBody = `${month}월 ${day}일 ${hour}시에 ${hospitalName} 방문예정이에요!`;

          try {
            // alarm 컬렉션에 알림 데이터 저장
            const { addAlarm, markAlarmAsSuccess } = await import('./alarmService');
            const alarmId = await addAlarm({
              content: notificationBody,
              dataId: reservation.id,
              isRead: false,
              isSuccess: false,
              title: notificationTitle,
              userId: userId
            });

            // 로컬 알림 발송
            this.showLocalNotification(notificationTitle, notificationBody);
            
            // 발송 성공 처리
            await markAlarmAsSuccess(alarmId);
            
            console.log('예약 알림 발송 및 저장 완료:', notificationBody);
          } catch (alarmError) {
            console.error('알림 데이터 저장 실패:', alarmError);
            // 알림은 발송하되 저장 실패는 로그만 남김
            this.showLocalNotification(notificationTitle, notificationBody);
          }
        }
      }
    } catch (error) {
      console.error('예약 알림 체크 실패:', error);
    }
  }

  // 매일 정해진 시간에 알림 체크하는 함수
  static startDailyNotificationCheck(): void {
    // 매일 오전 9시에 체크 (원하는 시간으로 변경 가능)
    const checkTime = 9; // 9시
    
    const checkNotifications = () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      // 지정된 시간이면 알림 체크
      if (currentHour === checkTime) {
        this.checkAndSendReservationNotifications();
      }
    };

    // 1시간마다 체크
    setInterval(checkNotifications, 60 * 60 * 1000);
    
    // 앱 시작 시에도 한 번 체크
    this.checkAndSendReservationNotifications();
  }
}
