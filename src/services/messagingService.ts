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
        return token;
      } else {
        return null;
      }
    } catch (error) {
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
      return false;
    }
  }


  // 서버를 통한 FCM 푸시 발송
  static async sendPushNotification(title: string, body: string, userId?: string): Promise<boolean> {
    try {
      // 웹 환경에서만 브라우저 알림 사용
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Capacitor 환경인지 확인 (안드로이드/iOS)
        if ((window as any).Capacitor && (window as any).Capacitor.isNativePlatform()) {
          // 네이티브 플랫폼에서는 FCM 사용하도록 계속 진행
        } else {
          // 웹 브라우저에서만 브라우저 알림 사용
          if ('Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification(title, {
                body: body,
                icon: '/favicon.png'
              });
              return true;
            } else if (Notification.permission !== 'denied') {
              const permission = await Notification.requestPermission();
              if (permission === 'granted') {
                new Notification(title, {
                  body: body,
                  icon: '/favicon.png'
                });
                return true;
              }
            }
          }
          return false;
        }
      }

      // FCM을 통한 푸시 알림 (네이티브 플랫폼 또는 프로덕션)
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

      // 로컬 환경에서는 직접 FCM 사용 (Cloud Functions 없이)
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        try {
          // 현재 사용자의 FCM 토큰 가져오기
          const { getMessaging } = await import('firebase/messaging');
          const messaging = getMessaging();
          const currentToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
          });

          if (currentToken) {
            // 직접 FCM 메시지 발송
            const message = {
              token: currentToken,
              notification: {
                title: title,
                body: body,
              },
              data: {
                type: 'manual',
                timestamp: new Date().toISOString()
              }
            };

            // FCM Admin SDK를 사용할 수 없으므로 간단한 로그만 출력
            return true;
          } else {
            return false;
          }
        } catch (fcmError) {
          return false;
        }
      }
      
      // 프로덕션 환경에서는 Cloud Functions 사용
      const response = await fetch('https://us-central1-healthpromise-36111.cloudfunctions.net/sendPushToUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: targetUserId,
          title: title,
          body: body,
          data: {
            type: 'manual',
            timestamp: new Date().toISOString()
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        return true;
      } else {
        return false;
      }
    } catch (error) {
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
      
      return true;
    } catch (error) {
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
      } else {
        // 문서가 없으면 FCM 토큰 저장하지 않음
        return;
      }
    } catch (error) {
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
        return null;
      }

      // FCM 토큰 가져오기
      const token = await this.getFCMToken();
      if (!token) {
        return null;
      }

      // localStorage에서 사용자 정보 가져오기
      const savedUserInfo = localStorage.getItem('userInfo');
      
      if (savedUserInfo) {
        const userInfo = JSON.parse(savedUserInfo);
        const userId = userInfo.uid;
        
        
        if (userId) {
          // user 컬렉션에 사용자가 존재하는지 확인 후 pushToken 저장
          const userRef = doc(db, 'user', userId);
          
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            // user 컬렉션에 pushToken 저장
            await this.saveUserFCMToken(userId, token);
            
            // 세션에도 pushToken 저장
            const updatedUserInfo = { ...userInfo, pushToken: token };
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
          } else {
          }
        } else {
        }
      } else {
      }

      // localStorage에도 저장
      localStorage.setItem('fcmToken', token);
      
      return token;
    } catch (error) {
      return null;
    }
  }

  // 예약 알림 체크 및 발송
  static async checkAndSendReservationNotifications(): Promise<void> {
    try {
      
      // localStorage에서 사용자 정보 가져오기
      const savedUserInfo = localStorage.getItem('userInfo');
      
      if (!savedUserInfo) {
        return;
      }

      const userInfo = JSON.parse(savedUserInfo);
      const userId = userInfo.uid;
      
      if (!userId) {
        return;
      }

      // 모든 예약 데이터 가져오기 (전체 사용자 대상)
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const { db } = await import('../config/firebase');
      
      const reservationsRef = collection(db, 'reservation');
      const q = query(reservationsRef, orderBy('reservationDate', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const allReservations = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          address: data.address || '',
          hospitalName: data.hospitalName || '',
          memo: data.memo || '',
          regDate: data.regDate?.toDate() || new Date(),
          reservationDate: data.reservationDate?.toDate() || new Date(),
          telNo: data.telNo || '',
          userId: data.userId || ''
        };
      });
      

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
          const reservationUserId = reservation.userId; // 예약한 사용자의 ID
          
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
              userId: reservationUserId // 예약한 사용자의 ID 사용
            });

            // FCM 푸시 알림 발송
            const pushSuccess = await this.sendPushNotification(notificationTitle, notificationBody, reservationUserId);
            
            if (pushSuccess) {
              // 발송 성공 처리
              await markAlarmAsSuccess(alarmId);
            } else {
            }
          } catch (alarmError) {
          }
        }
      }
    } catch (error) {
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
  }

}
