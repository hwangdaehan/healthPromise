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

      usersSnapshot.forEach(doc => {
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

// 예약 알림 스케줄러 (매일 오전 9시) - 비활성화
export const scheduledReservationNotifications = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('Asia/Seoul')
  .onRun(async context => {
    console.log('예약 알림 스케줄러 비활성화됨');
    return null;
  });

// 복약 알림 스케줄러 (오전 9시~오후 9시 매시간 실행) - 비활성화
export const scheduledMedicineNotifications = functions.pubsub
  .schedule('0 9-21 * * *') // 오전 9시~오후 9시 매시간 실행
  .timeZone('Asia/Seoul')
  .onRun(async context => {
    console.log('복약 알림 스케줄러 비활성화됨');
    return null;
  });
