import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonIcon,
  IonAlert,
  IonSpinner,
} from '@ionic/react';
import { person, call, checkmarkCircle } from 'ionicons/icons';
import { findUserByPhoneAndName } from '../services/userService';
import { MessagingService } from '../services/messagingService';
import './Login.css';

interface LoginProps {
  onLoginSuccess?: (userData: {
    name: string;
    birthDate: string;
    gender?: string;
    sido?: string;
    sigungu?: string;
  }) => void;
  onGoToRegister?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onGoToRegister }) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 휴대폰번호 포맷팅 함수
  const formatPhoneDisplay = (phoneNumber: string): string => {
    const cleanNumber = phoneNumber.replace(/-/g, '');
    if (cleanNumber.length <= 3) {
      return cleanNumber;
    } else if (cleanNumber.length <= 7) {
      return `${cleanNumber.slice(0, 3)}-${cleanNumber.slice(3)}`;
    } else {
      return `${cleanNumber.slice(0, 3)}-${cleanNumber.slice(3, 7)}-${cleanNumber.slice(7, 11)}`;
    }
  };

  // 휴대폰번호에서 - 제거하는 함수
  const formatPhoneNumber = (phoneNumber: string): string => {
    return phoneNumber.replace(/-/g, '');
  };

  const handleLogin = async () => {
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    if (!phoneNumber.trim()) {
      setError('휴대폰번호를 입력해주세요.');
      return;
    }

    const cleanPhoneNumber = formatPhoneNumber(phoneNumber);
    if (cleanPhoneNumber.length < 10) {
      setError('올바른 휴대폰번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Firebase user 컬렉션에서 전화번호와 이름으로 사용자 찾기
      const userProfile = await findUserByPhoneAndName(cleanPhoneNumber, name.trim());

      if (userProfile) {
        // Firebase에서 사용자 정보를 찾은 경우 - 모든 정보를 세션에 저장
        const userData = {
          uid: userProfile.uid,
          name: userProfile.name || name.trim(),
          birthDate: userProfile.birthDate
            ? (userProfile.birthDate as any).toDate
              ? (userProfile.birthDate as any).toDate().toISOString()
              : String(userProfile.birthDate)
            : '',
          gender: userProfile.gender || '',
          sido: userProfile.sido || '',
          sigungu: userProfile.sigungu || '',
          email: userProfile.email || '',
          phoneNumber: userProfile.phoneNumber || '',
          telNo: userProfile.telNo || cleanPhoneNumber,
          address: userProfile.address || '',
          pushToken: userProfile.pushToken || '',
          emergencyContact: userProfile.emergencyContact || null,
          medicalInfo: userProfile.medicalInfo || null,
          loginTime: new Date().toISOString(),
        };

        console.log('사용자 정보를 찾았습니다:', userProfile);
        localStorage.setItem('userInfo', JSON.stringify(userData));

        // FCM 토큰 초기화 및 저장
        try {
          await MessagingService.initializeAndSaveToken();
          console.log('FCM 토큰 초기화 완료');
        } catch (error) {
          console.log('FCM 토큰 초기화 실패:', error);
        }

        if (onLoginSuccess) {
          onLoginSuccess({
            name: userData.name,
            birthDate: userData.birthDate,
            gender: userData.gender,
            sido: userData.sido,
            sigungu: userData.sigungu,
          });
        }
      } else {
        // 사용자를 찾지 못한 경우
        setError('존재하지 않는 계정입니다.');
      }
    } catch (error) {
      console.error('사용자 정보 확인 실패:', error);
      setError('사용자 정보를 확인하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToRegister = () => {
    if (onGoToRegister) {
      onGoToRegister();
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>건강 약속</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="login-container">
          <IonCard className="login-card">
            <IonCardContent>
              <div className="login-form">
                <IonItem className="form-item">
                  <IonIcon icon={person} slot="start" />
                  <IonLabel position="stacked">이름</IonLabel>
                  <IonInput
                    type="text"
                    value={name}
                    onIonInput={e => setName(e.detail.value!)}
                    placeholder="이름을 입력하세요"
                    clearInput={true}
                  />
                </IonItem>

                <IonItem className="form-item">
                  <IonIcon icon={call} slot="start" />
                  <IonLabel position="stacked">휴대폰번호</IonLabel>
                  <IonInput
                    type="tel"
                    value={phoneNumber}
                    onIonInput={e => setPhoneNumber(formatPhoneDisplay(e.detail.value!))}
                    placeholder="010-1234-5678"
                    clearInput={true}
                  />
                </IonItem>
              </div>

              <IonButton
                expand="block"
                onClick={handleLogin}
                disabled={!name.trim() || !phoneNumber.trim() || loading}
                className="login-button"
              >
                {loading ? (
                  <IonSpinner name="crescent" />
                ) : (
                  <>
                    <IonIcon icon={checkmarkCircle} slot="start" />
                    시작하기
                  </>
                )}
              </IonButton>

              <IonButton
                fill="clear"
                expand="block"
                onClick={handleGoToRegister}
                className="register-button"
              >
                간단한 정보 입력하고 시작하기
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>

        <IonAlert
          isOpen={!!error}
          onDidDismiss={() => setError(null)}
          header="입력 오류"
          message={error || ''}
          buttons={['확인']}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
