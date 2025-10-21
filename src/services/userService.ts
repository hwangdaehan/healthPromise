// Firebase Auth는 사용하지 않음 - localStorage 기반으로 변경
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  sido?: string;
  sigungu?: string;
  address?: string;
  phoneNumber?: string;
  telNo?: string;
  pushToken?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalInfo?: {
    bloodType?: string;
    allergies?: string[];
    chronicConditions?: string[];
    medications?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  user: {
    uid: string;
    email: string;
    displayName: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    metadata: any;
    providerData: any[];
    refreshToken: string;
    tenantId: string | null;
    delete: () => Promise<void>;
    getIdToken: () => Promise<string>;
    getIdTokenResult: () => Promise<any>;
    reload: () => Promise<void>;
    toJSON: () => any;
  };
  profile: UserProfile | null;
  isAuthenticated: boolean;
  name?: string;
  birthDate?: string;
  gender?: string;
  sido?: string;
  sigungu?: string;
}

export const getCurrentUserSession = async (): Promise<UserSession | null> => {
  try {
    // localStorage에서 사용자 정보 확인
    const savedUserInfo = localStorage.getItem('userInfo');
    if (savedUserInfo) {
      try {
        const userInfo = JSON.parse(savedUserInfo);
        return {
          user: {
            uid: userInfo.uid || 'local-user',
            email: userInfo.email || '',
            displayName: userInfo.name || '',
            emailVerified: false,
            isAnonymous: false,
            metadata: {},
            providerData: [],
            refreshToken: '',
            tenantId: null,
            delete: async () => {},
            getIdToken: async () => '',
            getIdTokenResult: async () => ({}) as any,
            reload: async () => {},
            toJSON: () => ({}),
          },
          profile: null,
          isAuthenticated: true,
          name: userInfo.name,
          birthDate: userInfo.birthDate,
          gender: userInfo.gender,
          sido: userInfo.sido,
          sigungu: userInfo.sigungu,
        };
      } catch (error) {
        console.error('localStorage 사용자 정보 파싱 실패:', error);
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'user', uid));

    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as UserProfile;
    }

    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const upsertUserProfile = async (
  profile: Partial<UserProfile>
): Promise<UserProfile | null> => {
  try {
    console.log('upsertUserProfile 시작:', profile);
    console.log('Firebase db 객체:', db);
    
    // localStorage에서 사용자 정보 가져오기
    const savedUserInfo = localStorage.getItem('userInfo');
    let userId = null;

    console.log('localStorage userInfo:', savedUserInfo);

    if (savedUserInfo) {
      try {
        const userInfo = JSON.parse(savedUserInfo);
        userId = userInfo.uid;
        console.log('localStorage에서 가져온 userId:', userId);
      } catch (error) {
        console.log('localStorage 사용자 정보 파싱 실패:', error);
        return null;
      }
    }

    // userId가 없으면 새로 생성 (회원가입 시)
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('새로 생성된 userId:', userId);
      
      // localStorage에 새 사용자 정보 저장
      const newUserInfo = {
        uid: userId,
        email: profile.email || '',
        name: profile.name || '',
        birthDate: profile.birthDate || '',
        gender: profile.gender || '',
        sido: profile.sido || '',
        sigungu: profile.sigungu || '',
        telNo: profile.telNo || '',
      };
      localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
      console.log('localStorage에 새 사용자 정보 저장:', newUserInfo);
    }

    console.log('최종 userId:', userId);

    const userRef = doc(db, 'user', userId);
    const existingDoc = await getDoc(userRef);

    console.log('기존 문서 존재 여부:', existingDoc.exists());

    const now = new Date();
    const profileData = {
      ...profile,
      uid: userId,
      email: profile.email || '',
      updatedAt: now,
      ...(existingDoc.exists() ? {} : { createdAt: now }),
    };

    console.log('저장할 데이터:', profileData);

    if (existingDoc.exists()) {
      console.log('기존 문서 업데이트 중...');
      await updateDoc(userRef, profileData);
      console.log('기존 문서 업데이트 완료');
    } else {
      console.log('새 문서 생성 중...');
      await setDoc(userRef, profileData);
      console.log('새 문서 생성 완료');
    }

    const result = await getUserProfile(userId);
    console.log('저장 후 조회 결과:', result);
    return result;
  } catch (error) {
    console.error('Error upserting user profile:', error);
    return null;
  }
};

export const clearUserSession = (): void => {
  // Clear any local session data if needed
  localStorage.removeItem('userSession');
  localStorage.removeItem('userInfo');
};

export const hasUserPermission = (permission: string): boolean => {
  // Simple permission check - can be expanded based on user roles
  const savedUserInfo = localStorage.getItem('userInfo');
  return !!savedUserInfo;
};

// 휴대폰번호 중복 체크 함수
export const checkPhoneNumberExists = async (phoneNumber: string): Promise<boolean> => {
  try {
    console.log('휴대폰번호 중복 체크 시작:', phoneNumber);
    
    const usersRef = collection(db, 'user');
    const q = query(usersRef, where('telNo', '==', phoneNumber));
    const querySnapshot = await getDocs(q);
    
    console.log('휴대폰번호 검색 결과:', querySnapshot.size);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('휴대폰번호 중복 체크 실패:', error);
    throw error;
  }
};

// 전화번호와 이름으로 사용자 찾기
export const findUserByPhoneAndName = async (
  phoneNumber: string,
  name: string
): Promise<UserProfile | null> => {
  try {
    console.log('전화번호/이름으로 사용자 검색 시작:', { phoneNumber, name });
    
    const usersRef = collection(db, 'user');
    const q = query(usersRef, where('telNo', '==', phoneNumber));
    const querySnapshot = await getDocs(q);
    
    console.log('전화번호로 검색한 결과 개수:', querySnapshot.size);
    
    if (!querySnapshot.empty) {
      // 전화번호가 일치하는 사용자들 중에서 이름을 비교
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        console.log('검색된 사용자 데이터:', {
          id: doc.id,
          name: data.name,
          telNo: data.telNo,
        });
        
        if (data.name === name) {
          console.log('사용자 찾음:', {
            name: data.name,
            telNo: data.telNo,
          });
          
          return {
            ...data,
            uid: doc.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as UserProfile;
        }
      }
    }
    
    console.log('사용자를 찾지 못함:', { phoneNumber, name });
    return null;
  } catch (error) {
    console.error('Error finding user by phone and name:', error);
    return null;
  }
};

export const findUserByNameAndBirthDate = async (
  name: string,
  birthDate: string
): Promise<UserProfile | null> => {
  try {
    console.log('사용자 검색 시작:', { name, birthDate });

    const usersRef = collection(db, 'user');
    // 이름으로만 먼저 검색 (birthDate는 Timestamp라서 직접 비교가 어려움)
    const q = query(usersRef, where('name', '==', name));
    const querySnapshot = await getDocs(q);

    console.log('이름으로 검색한 결과 개수:', querySnapshot.size);

    if (!querySnapshot.empty) {
      // 이름이 일치하는 사용자들 중에서 birthDate를 비교
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        console.log('검색된 사용자 데이터:', {
          id: doc.id,
          name: data.name,
          birthDate: data.birthDate,
          birthDateType: typeof data.birthDate,
          birthDateConstructor: data.birthDate?.constructor?.name,
        });

        const userBirthDate = data.birthDate;

        // Firebase Timestamp를 날짜 문자열로 변환하여 비교
        let userBirthDateString = '';
        if (userBirthDate) {
          if (userBirthDate.toDate) {
            // Firebase Timestamp인 경우 - 로컬 날짜로 변환
            const date = userBirthDate.toDate();
            userBirthDateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            console.log('Firebase Timestamp 변환:', userBirthDateString);
          } else if (userBirthDate instanceof Date) {
            // Date 객체인 경우 - 로컬 날짜로 변환
            userBirthDateString = `${userBirthDate.getFullYear()}-${String(userBirthDate.getMonth() + 1).padStart(2, '0')}-${String(userBirthDate.getDate()).padStart(2, '0')}`;
            console.log('Date 객체 변환:', userBirthDateString);
          } else {
            // 문자열인 경우
            userBirthDateString = userBirthDate.split('T')[0];
            console.log('문자열 변환:', userBirthDateString);
          }
        }

        // 입력된 birthDate와 비교 (YYYY-MM-DD 형식)
        const inputBirthDate = birthDate.split('T')[0];
        console.log('비교:', {
          userBirthDateString,
          inputBirthDate,
          isMatch: userBirthDateString === inputBirthDate,
        });

        if (userBirthDateString === inputBirthDate) {
          console.log('사용자 찾음:', {
            name: data.name,
            birthDate: userBirthDateString,
            inputBirthDate: inputBirthDate,
          });

          return {
            ...data,
            uid: doc.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as UserProfile;
        }
      }
    }

    console.log('사용자를 찾지 못함:', { name, birthDate });
    return null;
  } catch (error) {
    console.error('Error finding user by name and birth date:', error);
    return null;
  }
};

// 알림 설정 업데이트 함수
export const updateNotificationSetting = async (isNoti: boolean): Promise<boolean> => {
  try {
    console.log('알림 설정 업데이트 시작:', isNoti);
    console.log('Firebase db 객체:', db);
    
    // localStorage에서 사용자 정보 가져오기
    const savedUserInfo = localStorage.getItem('userInfo');
    if (!savedUserInfo) {
      console.error('사용자 정보를 찾을 수 없습니다.');
      return false;
    }

    const userInfo = JSON.parse(savedUserInfo);
    const userId = userInfo.uid;

    if (!userId) {
      console.error('사용자 ID를 찾을 수 없습니다.');
      return false;
    }

    // Firebase user 컬렉션 업데이트
    const userRef = doc(db, 'user', userId);
    console.log('Firebase 업데이트 시도:', { userId, isNoti });
    
    // 업데이트 전 문서 상태 확인
    const beforeDoc = await getDoc(userRef);
    console.log('업데이트 전 문서:', beforeDoc.exists() ? beforeDoc.data() : '문서 없음');
    
    await updateDoc(userRef, {
      isNoti: isNoti,
      updatedAt: new Date()
    });
    
    console.log('Firebase 업데이트 성공');
    
    // 업데이트 후 문서 상태 확인
    const afterDoc = await getDoc(userRef);
    console.log('업데이트 후 문서:', afterDoc.exists() ? afterDoc.data() : '문서 없음');

    // localStorage의 사용자 정보도 업데이트
    const updatedUserInfo = {
      ...userInfo,
      isNoti: isNoti
    };
    localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));

    console.log('알림 설정 업데이트 완료:', isNoti);
    return true;
  } catch (error) {
    console.error('알림 설정 업데이트 실패:', error);
    return false;
  }
};

// 사용자의 알림 설정 조회 함수
export const getNotificationSetting = async (): Promise<boolean> => {
  try {
    // localStorage에서 사용자 정보 가져오기
    const savedUserInfo = localStorage.getItem('userInfo');
    if (!savedUserInfo) {
      return true; // 기본값: 알림 허용
    }

    const userInfo = JSON.parse(savedUserInfo);
    return userInfo.isNoti !== false; // undefined나 null인 경우 true 반환
  } catch (error) {
    console.error('알림 설정 조회 실패:', error);
    return true; // 기본값: 알림 허용
  }
};
