// Firebase Cloud Functions를 사용한 푸시 알림 발송 예제
// 이 코드는 Firebase Functions에서 실행되어야 합니다.

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Firebase Admin SDK 초기화
admin.initializeApp();

// 특정 사용자에게 푸시 알림 발송
exports.sendPushToUser = functions.https.onCall(async (data, context) => {
  try {
    const { userId, title, body, data: notificationData } = data;

    // 사용자 정보에서 pushToken 가져오기
    const userDoc = await admin.firestore().collection('user').doc(userId).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', '사용자를 찾을 수 없습니다.');
    }

    const userData = userDoc.data();
    const pushToken = userData.pushToken;

    if (!pushToken) {
      throw new functions.https.HttpsError('failed-precondition', '푸시 토큰이 없습니다.');
    }

    // FCM 메시지 구성
    const message = {
      token: pushToken,
      notification: {
        title: title,
        body: body,
      },
      data: notificationData || {},
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#10b981',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    // 푸시 알림 발송
    const response = await admin.messaging().send(message);
    console.log('푸시 알림 발송 성공:', response);

    return { success: true, messageId: response };
  } catch (error) {
    console.error('푸시 알림 발송 실패:', error);
    throw new functions.https.HttpsError('internal', '푸시 알림 발송에 실패했습니다.');
  }
});

// 예약 알림 자동 발송 (매일 오전 9시)
exports.scheduledReservationNotifications = functions.pubsub
  .schedule('0 9 * * *') // 매일 오전 9시
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
      const userReservations = {};
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
          const pushToken = userData.pushToken;

          if (!pushToken) {
            console.log(`사용자 ${userId}의 푸시 토큰이 없습니다.`);
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
              android: {
                notification: {
                  icon: 'ic_notification',
                  color: '#10b981',
                  sound: 'default',
                },
              },
              apns: {
                payload: {
                  aps: {
                    sound: 'default',
                    badge: 1,
                  },
                },
              },
            };

            // 푸시 알림 발송
            const response = await admin.messaging().send(message);
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

// 클라이언트에서 호출할 수 있는 푸시 알림 함수
exports.sendTestPush = functions.https.onCall(async (data, context) => {
  try {
    const { title, body } = data;

    // 현재 사용자의 pushToken 가져오기
    const userId = context.auth.uid;
    if (!userId) {
      throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다.');
    }

    const userDoc = await admin.firestore().collection('user').doc(userId).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', '사용자를 찾을 수 없습니다.');
    }

    const userData = userDoc.data();
    const pushToken = userData.pushToken;

    if (!pushToken) {
      throw new functions.https.HttpsError('failed-precondition', '푸시 토큰이 없습니다.');
    }

    // FCM 메시지 구성
    const message = {
      token: pushToken,
      notification: {
        title: title || '테스트 알림',
        body: body || '테스트 메시지입니다.',
      },
      data: {
        type: 'test',
      },
    };

    // 푸시 알림 발송
    const response = await admin.messaging().send(message);
    console.log('테스트 푸시 발송 성공:', response);

    return { success: true, messageId: response };
  } catch (error) {
    console.error('테스트 푸시 발송 실패:', error);
    throw new functions.https.HttpsError('internal', '푸시 알림 발송에 실패했습니다.');
  }
});
