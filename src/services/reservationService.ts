import { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
// Firebase Auth는 사용하지 않음 - localStorage 기반으로 변경

export interface Reservation {
  id: string;
  address: string;
  hospitalName: string;
  memo: string;
  regDate: Date;
  reservationDate: Date;
  telNo: string;
  userId: string;
  // 기존 필드들 (호환성을 위해 유지)
  hospitalId?: string;
  department?: string;
  doctorName?: string;
  appointmentDate?: Date;
  appointmentTime?: string;
  patientName?: string;
  patientPhone?: string;
  symptoms?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt?: Date;
  updatedAt?: Date;
}

export const addReservation = async (reservationData: Omit<Reservation, 'id' | 'regDate' | 'userId'>): Promise<string> => {
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
        throw new Error('User not authenticated');
      }
    }
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const now = new Date();
    const reservation = {
      address: reservationData.address,
      hospitalName: reservationData.hospitalName,
      memo: reservationData.memo,
      regDate: now,
      reservationDate: reservationData.reservationDate,
      telNo: reservationData.telNo,
      userId: userId
    };

    console.log('예약 추가:', reservation);

    const docRef = await addDoc(collection(db, 'reservation'), reservation);
    return docRef.id;
  } catch (error) {
    console.error('Error adding reservation:', error);
    throw error;
  }
};

export const getReservations = async (): Promise<Reservation[]> => {
  try {
    // localStorage에서 사용자 정보 가져오기
    const savedUserInfo = localStorage.getItem('userInfo');
    let userId = null;
    
    if (savedUserInfo) {
      try {
        const userInfo = JSON.parse(savedUserInfo);
        userId = userInfo.uid;
      } catch (error) {
        return [];
      }
    }
    
    if (!userId) {
      return [];
    }

    const reservationsRef = collection(db, 'reservation');
    const q = query(
      reservationsRef, 
      where('userId', '==', userId),
      orderBy('reservationDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    console.log('예약한 병원목록:', querySnapshot.size);
    
    const reservations = querySnapshot.docs.map(doc => {
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
      } as Reservation;
    });
    
    return reservations;
  } catch (error) {
    console.error('Error getting reservations:', error);
    return [];
  }
};

export const updateReservationStatus = async (reservationId: string, status: Reservation['status']): Promise<boolean> => {
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

    const reservationRef = doc(db, 'reservation', reservationId);
    await setDoc(reservationRef, { 
      status, 
      regDate: new Date() 
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error updating reservation status:', error);
    return false;
  }
};
