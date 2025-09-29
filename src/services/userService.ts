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
    // localStorage에서 사용자 정보 가져오기
    const savedUserInfo = localStorage.getItem('userInfo');
    let userId = null;

    if (savedUserInfo) {
      try {
        const userInfo = JSON.parse(savedUserInfo);
        userId = userInfo.uid;
      } catch (error) {
        console.log('localStorage 사용자 정보 파싱 실패:', error);
        return null;
      }
    }

    if (!userId) {
      return null;
    }

    const userRef = doc(db, 'user', userId);
    const existingDoc = await getDoc(userRef);

    const now = new Date();
    const profileData = {
      ...profile,
      uid: userId,
      email: profile.email || '',
      updatedAt: now,
      ...(existingDoc.exists() ? {} : { createdAt: now }),
    };

    if (existingDoc.exists()) {
      await updateDoc(userRef, profileData);
    } else {
      await setDoc(userRef, profileData);
    }

    return await getUserProfile(userId);
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
