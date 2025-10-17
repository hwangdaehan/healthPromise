import { getToken, onMessage } from 'firebase/messaging';
import { messaging, functions } from '../config/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';

export class MessagingService {
  private static readonly VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  private static nativeInitInProgress: boolean = false;
  private static nativeInitialized: boolean = false;
  private static cachedToken: string | null = null;

  static async getFCMToken(): Promise<string | null> {
    try {
      // 브라우저 지원 여부 확인
      if (typeof window === 'undefined') {
        console.log('Window object not available');
        return null;
      }

      // Capacitor 환경 확인 (안드로이드/iOS 앱)
      if ((window as any).Capacitor && (window as any).Capacitor.isNativePlatform()) {
        console.log('네이티브 플랫폼에서 FCM 토큰 요청');
        
        // 이미 메모리에 있으면 반환
        if (this.cachedToken) {
          console.log('캐시된 토큰 반환:', this.cachedToken.substring(0, 20) + '...');
          return this.cachedToken;
        }
        
        // 저장된 토큰이 있으면 메모리에 적재 후 반환
        const stored = localStorage.getItem('fcmToken');
        if (stored) {
          this.cachedToken = stored;
          console.log('저장된 토큰 반환:', stored.substring(0, 20) + '...');
          return stored;
        }
        
        // 네이티브 앱에서는 Capacitor PushNotifications 사용
        try {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          
          // 이미 초기화 진행 중이면 중복 등록 방지
          if (this.nativeInitInProgress) {
            console.log('이미 초기화 진행 중');
            return null;
          }
          
          this.nativeInitInProgress = true;
          console.log('네이티브 FCM 초기화 시작');
          
          // 기존 리스너들 정리
          try {
            await PushNotifications.removeAllListeners();
            console.log('기존 리스너들 정리 완료');
          } catch (e) {
            console.log('기존 리스너 정리 중 에러:', e);
          }
          
          // 권한 요청
          const permStatus = await PushNotifications.requestPermissions();
          console.log('권한 요청 결과:', permStatus);
          
          if (permStatus.receive !== 'granted') {
            console.log('푸시 알림 권한이 거부됨');
            this.nativeInitInProgress = false;
            return null;
          }

          // 토큰을 Promise로 받기 (등록 전에 리스너 먼저 설정)
          return new Promise((resolve) => {
            let tokenReceived = false;
            let timeoutId: NodeJS.Timeout;
            
            const cleanup = () => {
              if (timeoutId) {
                clearTimeout(timeoutId);
              }
              this.nativeInitInProgress = false;
              this.nativeInitialized = true;
            };
            
            // registration 이벤트 리스너 (먼저 설정)
            const registrationListener = PushNotifications.addListener('registration', (token) => {
              if (!tokenReceived) {
                tokenReceived = true;
                console.log('네이티브 FCM 토큰 받음:', token.value);
                localStorage.setItem('fcmToken', token.value);
                this.cachedToken = token.value;
                cleanup();
                resolve(token.value);
              }
            });
            
            // registrationError 이벤트 리스너
            const errorListener = PushNotifications.addListener('registrationError', (error) => {
              if (!tokenReceived) {
                tokenReceived = true;
                console.error('네이티브 FCM 등록 에러:', error);
                cleanup();
                resolve(null);
              }
            });
            
            // FCM 등록 (리스너 설정 후)
            console.log('FCM 등록 시작...');
            PushNotifications.register()
              .then(() => {
                console.log('네이티브 FCM 등록 완료');
                
                // 등록 후 상태 확인
                PushNotifications.checkPermissions().then((permissions) => {
                  console.log('등록 후 권한 상태:', permissions);
                });
              })
              .catch((error) => {
                console.error('FCM 등록 실패:', error);
                if (!tokenReceived) {
                  tokenReceived = true;
                  cleanup();
                  resolve(null);
                }
              });
            
            // 타임아웃 설정 (10초)
            timeoutId = setTimeout(() => {
              if (!tokenReceived) {
                tokenReceived = true;
                console.log('네이티브 FCM 토큰 타임아웃');
                console.log('이미 저장된 토큰이 있는지 확인...');
                
                // 저장된 토큰이 있으면 반환
                const existingToken = localStorage.getItem('fcmToken');
                if (existingToken) {
                  console.log('기존 저장된 토큰 사용:', existingToken.substring(0, 20) + '...');
                  this.cachedToken = existingToken;
                  cleanup();
                  resolve(existingToken);
                } else {
                  console.log('저장된 토큰도 없음');
                  cleanup();
                  resolve(null);
                }
              }
            }, 10000);
          });
          
        } catch (error) {
          console.error('네이티브 FCM 설정 중 에러:', error);
          this.nativeInitInProgress = false;
          this.nativeInitialized = false;
          return null;
        }
      }

      // 웹 환경에서의 FCM 토큰 처리
      if (!('serviceWorker' in navigator)) {
        console.log('Service Worker not supported');
        return null;
      }

      if (!messaging) {
        console.log('Firebase Messaging not available');
        return null;
      }

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
      console.log('Failed to get FCM token:', error);
      return null;
    }
  }

  static onMessage(callback: (payload: any) => void): () => void {
    if (!messaging) {
      console.log('Firebase Messaging not available for onMessage');
      return () => {}; // 빈 함수 반환
    }
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
  static async sendPushNotification(
    title: string,
    body: string,
    userId?: string
  ): Promise<boolean> {
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
                icon: '/favicon.png',
              });
              return true;
            } else if (Notification.permission !== 'denied') {
              const permission = await Notification.requestPermission();
              if (permission === 'granted') {
                new Notification(title, {
                  body: body,
                  icon: '/favicon.png',
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
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
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
                timestamp: new Date().toISOString(),
              },
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
      try {
        const response = await fetch(
          'https://us-central1-healthpromise-36111.cloudfunctions.net/sendPushToUser',
          {
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
                timestamp: new Date().toISOString(),
              },
            }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          return result.success === true;
        } else {
          console.error('푸시 알림 발송 실패:', response.status, response.statusText);
          return false;
        }
      } catch (fetchError) {
        console.error('푸시 알림 요청 실패:', fetchError);
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
        body: body || '테스트 메시지입니다.',
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
      console.log('saveUserFCMToken 시작:', { userId, token: token.substring(0, 20) + '...' });
      const userRef = doc(db, 'user', userId);

      // upsert 저장: 문서가 없어도 생성하며 pushToken 저장
      await setDoc(
        userRef,
        {
          pushToken: token,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      
      console.log('pushToken 저장 완료:', userId);
    } catch (error) {
      console.error('saveUserFCMToken 실패:', error);
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
      console.log('FCM 토큰 초기화 시작');
      
      // FCM 토큰 가져오기 (권한 요청 포함)
      const token = await this.getFCMToken();
      if (!token) {
        console.log('FCM 토큰 획득 실패');
        return null;
      }

      console.log('FCM 토큰 획득 성공:', token.substring(0, 20) + '...');

      // localStorage에서 사용자 정보 가져오기
      const savedUserInfo = localStorage.getItem('userInfo');

      if (savedUserInfo) {
        const userInfo = JSON.parse(savedUserInfo);
        const userId = userInfo.uid;

        if (userId) {
          console.log('사용자 ID로 토큰 저장:', userId);
          
          // user 컬렉션에 pushToken 저장
          await this.saveUserFCMToken(userId, token);

          // 세션에도 pushToken 저장
          const updatedUserInfo = { ...userInfo, pushToken: token };
          localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
        }
      }

      // localStorage에도 저장
      localStorage.setItem('fcmToken', token);
      this.cachedToken = token;

      console.log('FCM 토큰 초기화 완료');
      return token;
    } catch (error) {
      console.error('FCM 토큰 초기화 실패:', error);
      return null;
    }
  }

  // 복약 알림 체크 및 발송
  static async checkAndSendMedicineNotifications(): Promise<void> {
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

      // 약물 데이터 가져오기
      const { FirestoreService } = await import('./firestoreService');
      const medicines = await FirestoreService.getMedicinesByUserId(userId);

      if (medicines.length === 0) {
        return;
      }

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // 복용 시간이 현재 시간과 일치하는 약물 찾기
      const medicinesToNotify = medicines.filter(medicine => {
        if (!medicine.times || medicine.times.length === 0) {
          return false;
        }

        return medicine.times.some(timeStr => {
          const [hour, minute] = timeStr.split(':').map(Number);
          return hour === currentHour && minute === currentMinute;
        });
      });

      if (medicinesToNotify.length > 0) {
        // 복약 알림을 직접 알림 컬렉션에 저장
        const { collection, addDoc } = await import('firebase/firestore');
        const { db } = await import('../config/firebase');
        
        for (const medicine of medicinesToNotify) {
          const alarmId = await addDoc(collection(db, 'alarms'), {
            title: '복약 알림',
            content: `${medicine.name} 복용 시간입니다.`,
            userId: userId,
            isRead: false,
            createdAt: new Date(),
            type: 'medicine'
          });

          // FCM 푸시 알림 발송
          const pushSuccess = await this.sendPushNotification(
            '복약 알림',
            `${medicine.name} 복용 시간입니다.`,
            userId
          );
        }
      }
    } catch (error) {
      console.error('복약 알림 발송 실패:', error);
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
          userId: data.userId || '',
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

        return reservationDate >= tomorrow && reservationDate < dayAfterTomorrow;
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
              userId: reservationUserId, // 예약한 사용자의 ID 사용
            });

            // FCM 푸시 알림 발송
            const pushSuccess = await this.sendPushNotification(
              notificationTitle,
              notificationBody,
              reservationUserId
            );

            if (pushSuccess) {
              // 발송 성공 처리
              await markAlarmAsSuccess(alarmId);
            } else {
            }
          } catch (alarmError) {}
        }
      }
    } catch (error) {}
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
