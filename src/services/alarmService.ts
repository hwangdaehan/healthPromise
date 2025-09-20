import { collection, addDoc, getDocs, updateDoc, doc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Alarm {
  id?: string;
  content: string;
  dataId: string;
  isRead: boolean;
  isSuccess: boolean;
  regDate: Date;
  title: string;
  userId: string;
}

// 알림 데이터 추가
export const addAlarm = async (alarmData: Omit<Alarm, 'id' | 'regDate'>): Promise<string> => {
  try {
    const alarmRef = collection(db, 'alarm');
    const newAlarm = {
      ...alarmData,
      regDate: new Date()
    };
    
    const docRef = await addDoc(alarmRef, newAlarm);
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

// 사용자의 알림 목록 조회
export const getAlarms = async (userId?: string): Promise<Alarm[]> => {
  try {
    let targetUserId = userId;
    
    // userId가 제공되지 않은 경우 localStorage에서 가져오기
    if (!targetUserId) {
      const savedUserInfo = localStorage.getItem('userInfo');
      if (savedUserInfo) {
        try {
          const userInfo = JSON.parse(savedUserInfo);
          targetUserId = userInfo.uid;
        } catch (error) {
          return [];
        }
      }
      
      if (!targetUserId) {
        return [];
      }
    }

    const alarmsRef = collection(db, 'alarm');
    const q = query(
      alarmsRef, 
      where('userId', '==', targetUserId),
      orderBy('regDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const alarms = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        content: data.content || '',
        dataId: data.dataId || '',
        isRead: data.isRead || false,
        isSuccess: data.isSuccess || false,
        regDate: data.regDate?.toDate() || new Date(),
        title: data.title || '',
        userId: data.userId || ''
      } as Alarm;
    });
    
    return alarms;
  } catch (error) {
    return [];
  }
};

// 알림 읽음 처리
export const markAlarmAsRead = async (alarmId: string): Promise<boolean> => {
  try {
    const alarmRef = doc(db, 'alarm', alarmId);
    await updateDoc(alarmRef, {
      isRead: true
    });
    
    return true;
  } catch (error) {
    return false;
  }
};

// 알림 발송 성공 처리
export const markAlarmAsSuccess = async (alarmId: string): Promise<boolean> => {
  try {
    const alarmRef = doc(db, 'alarm', alarmId);
    await updateDoc(alarmRef, {
      isSuccess: true
    });
    
    return true;
  } catch (error) {
    return false;
  }
};

// 읽지 않은 알림 개수 조회
export const getUnreadAlarmCount = async (userId?: string): Promise<number> => {
  try {
    let targetUserId = userId;
    
    // userId가 제공되지 않은 경우 localStorage에서 가져오기
    if (!targetUserId) {
      const savedUserInfo = localStorage.getItem('userInfo');
      if (savedUserInfo) {
        try {
          const userInfo = JSON.parse(savedUserInfo);
          targetUserId = userInfo.uid;
        } catch (error) {
          return 0;
        }
      }
      
      if (!targetUserId) {
        return 0;
      }
    }

    const alarmsRef = collection(db, 'alarm');
    const q = query(
      alarmsRef, 
      where('userId', '==', targetUserId),
      where('isRead', '==', false),
      orderBy('regDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const unreadCount = querySnapshot.docs.length;
    return unreadCount;
  } catch (error) {
    return 0;
  }
};
