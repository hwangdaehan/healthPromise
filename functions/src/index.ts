import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// FCM 서버 키 설정 (현재 사용하지 않음)
// const FCM_SERVER_KEY = 'BGfYloguVQqwLcjxrwUT5aG7EKwQtafy-YUnrQDTiKksLwOZX642HnBl1jxH5yNKljjd0y-Jn8XtgIqunx0RsjQ';

// CORS 설정
const cors = require('cors')({ 
  origin: true, // 모든 origin 허용
  credentials: true 
});

// 푸시 알림 발송 함수 (인증 없이 접근 가능)
export const sendPushToUser = functions.https.onRequest((req, res) => {
  console.log('=== sendPushToUser 함수 호출됨 ===');
  console.log('요청 메서드:', req.method);
  console.log('요청 헤더:', req.headers);
  console.log('요청 바디:', req.body);

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS 요청 처리 중...');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Max-Age', '3600');
    return res.status(204).send('');
  }

  return cors(req, res, async () => {
    console.log('CORS 처리 완료, POST 요청 처리 시작');
    
    if (req.method !== 'POST') {
      console.log('POST가 아닌 요청:', req.method);
      return res.status(405).send('Method Not Allowed');
    }

    const { userId, title, body, data: additionalData } = req.body;
    console.log('요청 데이터:', { userId, title, body, additionalData });

    try {
      console.log('푸시 알림 발송 시작');
      
      // pushToken이 직접 전달된 경우 사용
      let pushToken = req.body.pushToken;
      
      if (!pushToken) {
        console.log('pushToken이 직접 전달되지 않음, 사용자 정보에서 조회');
        // 사용자 정보에서 pushToken 가져오기
        const userDoc = await admin.firestore().collection('user').doc(userId).get();

        if (!userDoc.exists) {
          console.log('사용자를 찾을 수 없음:', userId);
          return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        pushToken = userData?.pushToken;

        if (!pushToken) {
          console.log('사용자에게 pushToken이 없음');
          return res.status(400).json({ error: 'No push token found for user' });
        }
      }
      
      console.log('사용할 pushToken:', pushToken);

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
      console.log('푸시 알림 발송 성공:', response);

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

// 예약 알림 스케줄러 (매일 오전 9시)
export const scheduledReservationNotifications = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('Asia/Seoul')
  .onRun(async context => {
    try {
      console.log('예약 알림 스케줄러 시작');

      // 내일 날짜 계산
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // 내일 예약이 있는 사용자들 조회
      const reservationsSnapshot = await admin
        .firestore()
        .collection('reservation')
        .where('reservationDate', '>=', tomorrow)
        .where('reservationDate', '<', dayAfterTomorrow)
        .get();

      if (reservationsSnapshot.empty) {
        console.log('내일 예약이 없습니다.');
        return null;
      }

      // 사용자별로 그룹화
      const userReservations: { [key: string]: any[] } = {};
      reservationsSnapshot.forEach(doc => {
        const reservation = doc.data();
        const userId = reservation.userId;

        if (!userReservations[userId]) {
          userReservations[userId] = [];
        }
        userReservations[userId].push({ id: doc.id, ...reservation });
      });

      // 각 사용자에게 알림 발송
      for (const [userId, reservations] of Object.entries(userReservations)) {
        try {
          // 사용자 정보 가져오기
          const userDoc = await admin.firestore().collection('user').doc(userId).get();

          if (!userDoc.exists) continue;

          const userData = userDoc.data();
          const pushToken = userData?.pushToken;
          const isNoti = userData?.isNoti;

          if (!pushToken) {
            console.log(`사용자 ${userId}의 푸시 토큰이 없습니다.`);
            continue;
          }

          // isNoti가 false인 경우 푸시 발송하지 않음
          if (isNoti === false) {
            console.log(`사용자 ${userId}의 알림 설정이 비활성화되어 있습니다.`);
            continue;
          }

          // 예약 정보로 알림 메시지 구성
          for (const reservation of reservations) {
            const reservationDate = reservation.reservationDate.toDate();
            const month = reservationDate.getMonth() + 1;
            const day = reservationDate.getDate();
            const hour = reservationDate.getHours();
            const hospitalName = reservation.hospitalName;

            const title = '병원 예약 알림';
            const body = `${month}월 ${day}일 ${hour}시에 ${hospitalName} 방문예정이에요!`;

            // FCM 메시지 구성
            const message = {
              token: pushToken,
              notification: {
                title: title,
                body: body,
              },
              data: {
                type: 'reservation',
                reservationId: reservation.id,
                hospitalName: hospitalName,
                reservationDate: reservationDate.toISOString(),
              },
            };

            // 푸시 알림 발송
            await admin.messaging().send(message);
            console.log(`푸시 알림 발송 성공 - 사용자: ${userId}, 예약: ${reservation.id}`);

            // alarm 컬렉션에 알림 기록 저장
            await admin.firestore().collection('alarm').add({
              userId: userId,
              title: title,
              content: body,
              dataId: reservation.id,
              isRead: false,
              isSuccess: true,
              regDate: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        } catch (userError) {
          console.error(`사용자 ${userId} 알림 발송 실패:`, userError);
        }
      }

      console.log('예약 알림 스케줄러 완료');
      return null;
    } catch (error) {
      console.error('예약 알림 스케줄러 실패:', error);
      return null;
    }
  });

// 복약 알림 스케줄러 (오전 9시~오후 9시 매시간 실행)
export const scheduledMedicineNotifications = functions.pubsub
  .schedule('0 9-21 * * *') // 오전 9시~오후 9시 매시간 실행
  .timeZone('Asia/Seoul')
  .onRun(async context => {
    try {
      console.log('복약 알림 스케줄러 시작');

      // 현재 시간
      const seoulNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
      const currentHour = seoulNow.getHours();

      // 현재 시간에 복용해야 할 약물들 조회
      const medicinesSnapshot = await admin
        .firestore()
        .collection('medicine')
        .get();

      if (medicinesSnapshot.empty) {
        console.log('현재 시간에 복용할 약물이 없습니다.');
        return null;
      }

      // 사용자별로 그룹화 (현재 시간에 복용해야 할 약물만)
      const userMedicines: { [key: string]: any[] } = {};
      const currentHourString = currentHour.toString().padStart(2, '0');
      
      medicinesSnapshot.forEach(doc => {
        const medicine = doc.data();
        const userId = medicine.userId;
        const times = medicine.times || [];

        // times 배열에 현재 시간이 포함되어 있는지 확인 (시간만 비교)
        if (times.includes(currentHourString)) {
          if (!userMedicines[userId]) {
            userMedicines[userId] = [];
          }
          userMedicines[userId].push({ id: doc.id, ...medicine });
        }
      });

      // 각 사용자에게 알림 발송
      for (const [userId, medicines] of Object.entries(userMedicines)) {
        try {
          // 사용자 정보 가져오기
          const userDoc = await admin.firestore().collection('user').doc(userId).get();

          if (!userDoc.exists) continue;

          const userData = userDoc.data();
          const pushToken = userData?.pushToken;
          const isNoti = userData?.isNoti;

          if (!pushToken) {
            console.log(`사용자 ${userId}의 푸시 토큰이 없습니다.`);
            continue;
          }

          // isNoti가 false인 경우 푸시 발송하지 않음
          if (isNoti === false) {
            console.log(`사용자 ${userId}의 알림 설정이 비활성화되어 있습니다.`);
            continue;
          }

          // 약물 정보로 알림 메시지 구성
          for (const medicine of medicines) {
            const medicineName = medicine.name;
            const times = medicine.times || [];

            const title = '복약 알림';
            const body = `${medicineName} 복용 시간입니다.`;

            // FCM 메시지 구성
            const message = {
              token: pushToken,
              notification: {
                title: title,
                body: body,
              },
              data: {
                type: 'medicine',
                medicineId: medicine.id,
                medicineName: medicineName,
                times: times.join(','),
              },
            };

            // 푸시 알림 발송
            await admin.messaging().send(message);
            console.log(`푸시 알림 발송 성공 - 사용자: ${userId}, 약물: ${medicine.id}`);

            // alarm 컬렉션에 알림 기록 저장
            await admin.firestore().collection('alarm').add({
              userId: userId,
              title: title,
              content: body,
              dataId: medicine.id,
              isRead: false,
              isSuccess: true,
              regDate: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        } catch (userError) {
          console.error(`사용자 ${userId} 알림 발송 실패:`, userError);
        }
      }

      console.log('복약 알림 스케줄러 완료');
      return null;
    } catch (error) {
      console.error('복약 알림 스케줄러 실패:', error);
      return null;
    }
  });
