// Firebase Cloud Functions 예시 (서버 사이드 스케줄링)
// 이 파일은 참고용이며, 실제로는 Firebase 프로젝트에 별도로 배포해야 합니다.

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// 매일 오전 9시에 실행되는 스케줄 함수
exports.sendReservationReminders = functions.pubsub
  .schedule('0 9 * * *') // 매일 오전 9시 (Cron 표현식)
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    console.log('예약 알림 체크 시작');
    
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
    
    const notifications = [];
    
    reservationsSnapshot.forEach(doc => {
      const reservation = doc.data();
      const userId = reservation.userId;
      
      // 사용자의 FCM 토큰 조회
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const fcmToken = userData.fcmToken;
        
        if (fcmToken) {
          const reservationDate = reservation.reservationDate.toDate();
          const month = reservationDate.getMonth() + 1;
          const day = reservationDate.getDate();
          const hour = reservationDate.getHours();
          const hospitalName = reservation.hospitalName;
          
          notifications.push({
            token: fcmToken,
            notification: {
              title: '병원 예약 알림',
              body: `${month}월 ${day}일 ${hour}시에 ${hospitalName} 방문예정이에요!`
            }
          });
        }
      }
    });
    
    // 모든 알림 발송
    if (notifications.length > 0) {
      const response = await admin.messaging().sendAll(notifications);
      console.log(`예약 알림 ${response.successCount}개 발송 완료`);
    }
    
    return null;
  });

// 사용자 FCM 토큰 저장 함수
exports.saveFCMToken = functions.https.onCall(async (data, context) => {
  const { userId, fcmToken } = data;
  
  await admin.firestore()
    .collection('users')
    .doc(userId)
    .update({
      fcmToken: fcmToken,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  
  return { success: true };
});