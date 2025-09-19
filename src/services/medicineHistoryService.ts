import { doc, getDoc, setDoc, addDoc, deleteDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface MedicineHistory {
  id: string;
  dataId: string;
  eatDate: Date;
  medicineDataId: string;
  regDate: Date;
  userId: string;
}

export const getMedicineHistory = async (userId?: string, year?: number, month?: number): Promise<MedicineHistory[]> => {
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
          console.log('localStorage 사용자 정보 파싱 실패:', error);
          return [];
        }
      }
      
      if (!targetUserId) {
        console.log('사용자 ID를 찾을 수 없음');
        return [];
      }
    }

    const medicineHistoryRef = collection(db, 'medicine-history');
    let q;
    
    if (year !== undefined && month !== undefined) {
      // 특정 월의 시작일과 종료일 계산
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      
      q = query(
        medicineHistoryRef, 
        where('userId', '==', targetUserId),
        where('eatDate', '>=', startDate),
        where('eatDate', '<=', endDate),
        orderBy('eatDate', 'desc')
      );
    } else {
      // 전체 데이터 조회
      q = query(
        medicineHistoryRef, 
        where('userId', '==', targetUserId),
        orderBy('eatDate', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    
    const history = querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      return {
        id: doc.id,
        dataId: data.dataId || '',
        eatDate: data.eatDate?.toDate() || new Date(),
        medicineDataId: data.medicineDataId || '',
        regDate: data.regDate?.toDate() || new Date(),
        userId: data.userId || ''
      } as MedicineHistory;
    });
    
    return history;
  } catch (error) {
    console.error('Error getting medicine history:', error);
    return [];
  }
};

export const addMedicineHistory = async (historyData: Omit<MedicineHistory, 'id'>): Promise<boolean> => {
  try {
    // localStorage에서 사용자 정보 가져오기
    const savedUserInfo = localStorage.getItem('userInfo');
    let userId = null;
    
    if (savedUserInfo) {
      try {
        const userInfo = JSON.parse(savedUserInfo);
        userId = userInfo.uid;
      } catch (error) {
        console.log('localStorage 사용자 정보 파싱 실패:', error);
        return false;
      }
    }
    
    if (!userId) {
      console.log('사용자 ID를 찾을 수 없음');
      return false;
    }

    const historyDataToSave = {
      dataId: historyData.dataId,
      eatDate: historyData.eatDate,
      medicineDataId: historyData.medicineDataId,
      regDate: new Date(),
      userId: userId
    };

    console.log('복약 기록 추가:', historyDataToSave);

    await addDoc(collection(db, 'medicine-history'), historyDataToSave);
    return true;
  } catch (error) {
    console.error('Error adding medicine history:', error);
    return false;
  }
};

export const removeMedicineHistory = async (historyId: string): Promise<boolean> => {
  try {
    // localStorage에서 사용자 정보 가져오기
    const savedUserInfo = localStorage.getItem('userInfo');
    let userId = null;
    
    if (savedUserInfo) {
      try {
        const userInfo = JSON.parse(savedUserInfo);
        userId = userInfo.uid;
      } catch (error) {
        console.log('localStorage 사용자 정보 파싱 실패:', error);
        return false;
      }
    }
    
    if (!userId) {
      console.log('사용자 ID를 찾을 수 없음');
      return false;
    }

    console.log('복약 기록 제거 시작, historyId:', historyId);

    const historyRef = doc(db, 'medicine-history', historyId);
    await deleteDoc(historyRef);
    
    return true;
  } catch (error) {
    console.error('Error removing medicine history:', error);
    return false;
  }
};
