import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// CORS 설정
const cors = require('cors')({ origin: true });

// 푸시 알림 발송 함수
export const sendPushToUser = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const { userId, title, body, data: additionalData } = req.body;

    try {
      // 사용자 정보에서 pushToken 가져오기
      const userDoc = await admin.firestore().collection('user').doc(userId).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userDoc.data();
      const pushToken = userData?.pushToken;

      if (!pushToken) {
        return res.status(400).json({ error: 'No push token found for user' });
      }

      // FCM 메시지 생성
      const message = {
        token: pushToken,
        notification: {
          title: title,
          body: body,
        },
        data: additionalData || {},
      };

      // FCM으로 푸시 발송
      const response = await admin.messaging().send(message);
      
      return res.status(200).json({
        success: true,
        messageId: response,
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
      return res.status(500).json({ error: 'Failed to send push notification' });
    }
  });
});

// 테스트 푸시 발송 함수
export const sendTestPush = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const { title, body } = req.body;

    try {
      // 모든 사용자의 pushToken 가져오기
      const usersSnapshot = await admin.firestore().collection('user').get();
      const tokens: string[] = [];

      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.pushToken) {
          tokens.push(userData.pushToken);
        }
      });

      if (tokens.length === 0) {
        return res.status(400).json({ error: 'No push tokens found' });
      }

      // FCM 메시지 생성
      const message = {
        tokens: tokens,
        notification: {
          title: title,
          body: body,
        },
      };

      // FCM으로 푸시 발송
      const response = await admin.messaging().sendMulticast(message);
      
      return res.status(200).json({
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
      });
    } catch (error) {
      console.error('Error sending test push:', error);
      return res.status(500).json({ error: 'Failed to send test push' });
    }
  });
});

// 예약 알림 스케줄러 (매일 오전 9시)
export const scheduledReservationNotifications = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // 내일 예약이 있는 사용자들 조회
      const reservationsSnapshot = await admin.firestore()
        .collection('reservation')
        .where('reservationDate', '>=', tomorrow)
        .where('reservationDate', '<', dayAfterTomorrow)
        .get();

      for (const doc of reservationsSnapshot.docs) {
        const reservation = doc.data();
        const userId = reservation.userId;

        // 사용자 정보에서 pushToken 가져오기
        const userDoc = await admin.firestore().collection('user').doc(userId).get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          const pushToken = userData?.pushToken;

          if (pushToken) {
            const reservationDate = reservation.reservationDate.toDate();
            const month = reservationDate.getMonth() + 1;
            const day = reservationDate.getDate();
            const hour = reservationDate.getHours();
            const hospitalName = reservation.hospitalName;

            const notificationTitle = '병원 예약 알림';
            const notificationBody = `${month}월 ${day}일 ${hour}시에 ${hospitalName} 방문예정이에요!`;

            // FCM 메시지 생성
            const message = {
              token: pushToken,
              notification: {
                title: notificationTitle,
                body: notificationBody,
              },
            };

            // FCM으로 푸시 발송
            await admin.messaging().send(message);
            
            console.log(`예약 알림 발송 완료: ${userId} - ${hospitalName}`);
          }
        }
      }

      console.log('예약 알림 스케줄러 실행 완료');
    } catch (error) {
      console.error('예약 알림 스케줄러 오류:', error);
    }
  });

// 복약 알림 스케줄러 (매분 실행)
export const scheduledMedicineNotifications = functions.pubsub
  .schedule('* * * * *') // 매분 실행
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    try {
      const db = admin.firestore();
      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, '0');
      
      // isNoti가 true인 모든 복약 데이터 조회
      const medicinesSnapshot = await db.collection('medicine')
        .where('isNoti', '==', true)
        .get();
      
      for (const doc of medicinesSnapshot.docs) {
        const medicine = doc.data();
        const times = medicine.times || [];
        
        // 현재 시간과 일치하는 복약 시간이 있는지 확인
        if (times.includes(currentHour)) {
          const notificationTitle = '복약 알림';
          const notificationBody = `${medicine.name} ${medicine.quantity}정 복용 시간입니다!`;
          
          // alarm 컬렉션에 알림 데이터 저장
          const alarmRef = await db.collection('alarm').add({
            content: notificationBody,
            dataId: doc.id,
            isRead: false,
            isSuccess: false,
            regDate: admin.firestore.FieldValue.serverTimestamp(),
            title: notificationTitle,
            userId: medicine.userId
          });
          
          // 사용자의 FCM 토큰 가져오기
          const userDoc = await db.collection('user').doc(medicine.userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            const pushToken = userData?.pushToken;
            
            if (pushToken) {
              // FCM 푸시 알림 발송
              const message = {
                token: pushToken,
                notification: {
                  title: notificationTitle,
                  body: notificationBody
                },
                data: {
                  type: 'medicine',
                  medicineId: doc.id,
                  alarmId: alarmRef.id
                }
              };
              
              try {
                await admin.messaging().send(message);
                
                // 발송 성공 처리
                await alarmRef.update({ isSuccess: true });
                console.log(`복약 알림 발송 성공: ${medicine.name} - ${medicine.userId}`);
              } catch (fcmError) {
                console.error('FCM 발송 실패:', fcmError);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('복약 알림 스케줄 실행 오류:', error);
    }
  });
