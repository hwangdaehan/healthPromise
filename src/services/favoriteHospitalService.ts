import { doc, getDoc, setDoc, addDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface FavoriteHospital {
  id: string;
  hospitalId: string;
  hospitalName: string;
  address: string;
  phoneNumber: string;
  specialties: string[];
  addedAt: Date;
  dataId?: string; // HospitalBooking에서 사용하는 필드
  name?: string; // HospitalBooking에서 사용하는 필드
  telNo?: string; // HospitalBooking에서 사용하는 필드
}

export const getFavoriteHospitals = async (userId?: string): Promise<FavoriteHospital[]> => {
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

    const favoritesRef = collection(db, 'favorite-hospital');
    const q = query(favoritesRef, where('userId', '==', targetUserId));
    const querySnapshot = await getDocs(q);
    
    console.log('즐겨찾기 병원 조회 결과 개수:', querySnapshot.size);
    
    const hospitals = querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      return {
        id: doc.id,
        hospitalId: data.dataId || doc.id,
        hospitalName: data.name || '',
        address: data.address || '',
        phoneNumber: data.telNo || '',
        specialties: [], // 기본값
        addedAt: data.regDate?.toDate() || new Date(),
        dataId: data.dataId || '',
        name: data.name || '',
        telNo: data.telNo || ''
      } as FavoriteHospital;
    });
    
    return hospitals;
  } catch (error) {
    console.error('Error getting favorite hospitals:', error);
    return [];
  }
};

export const addFavoriteHospital = async (hospitalData: Omit<FavoriteHospital, 'id' | 'addedAt'>): Promise<boolean> => {
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

    const favoriteData = {
      name: hospitalData.hospitalName || hospitalData.name || '',
      address: hospitalData.address || '',
      telNo: hospitalData.phoneNumber || hospitalData.telNo || '',
      dataId: hospitalData.hospitalId || hospitalData.dataId || '',
      userId: userId,
      regDate: new Date()
    };

    console.log('즐겨찾기 병원 추가:', favoriteData);

    await addDoc(collection(db, 'favorite-hospital'), favoriteData);
    return true;
  } catch (error) {
    console.error('Error adding favorite hospital:', error);
    return false;
  }
};

export const removeFavoriteHospital = async (hospitalId: string): Promise<boolean> => {
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

    console.log('즐겨찾기 병원 제거 시작, hospitalId:', hospitalId);

    const favoritesRef = collection(db, 'favorite-hospital');
    const q = query(favoritesRef, where('userId', '==', userId), where('dataId', '==', hospitalId));
    const querySnapshot = await getDocs(q);
    
    console.log('제거할 즐겨찾기 병원 개수:', querySnapshot.size);
    
    const deletePromises = querySnapshot.docs.map(doc => {
      console.log('즐겨찾기 병원 제거:', doc.id);
      return deleteDoc(doc.ref);
    });
    await Promise.all(deletePromises);
    
    return true;
  } catch (error) {
    console.error('Error removing favorite hospital:', error);
    return false;
  }
};

export const isHospitalFavorite = async (hospitalId: string): Promise<boolean> => {
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
      return false;
    }

    const favoritesRef = collection(db, 'favorite-hospital');
    const q = query(favoritesRef, where('userId', '==', userId), where('dataId', '==', hospitalId));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if hospital is favorite:', error);
    return false;
  }
};
