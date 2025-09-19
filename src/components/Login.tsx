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
import { person, calendar, checkmarkCircle } from 'ionicons/icons';
import { findUserByNameAndBirthDate } from '../services/userService';
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
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    
    if (!birthDate) {
      setError('생년월일을 선택해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Firebase user 컬렉션에서 이름과 생년월일로 사용자 찾기
      const userProfile = await findUserByNameAndBirthDate(name.trim(), birthDate);
      
      let userData;
      
      if (userProfile) {
        // Firebase에서 사용자 정보를 찾은 경우 - 모든 정보를 세션에 저장
        userData = {
          uid: userProfile.uid, // Firebase 사용자 ID 추가
          name: userProfile.name || name.trim(),
          birthDate: userProfile.birthDate ? 
            ((userProfile.birthDate as any).toDate ? (userProfile.birthDate as any).toDate().toISOString() : String(userProfile.birthDate)) : 
            birthDate,
          gender: userProfile.gender || '',
          sido: userProfile.sido || '',
          sigungu: userProfile.sigungu || '',
          email: userProfile.email || '',
          phoneNumber: userProfile.phoneNumber || '',
          address: userProfile.address || '',
          emergencyContact: userProfile.emergencyContact || null,
          medicalInfo: userProfile.medicalInfo || null,
          loginTime: new Date().toISOString()
        };
        
        console.log('사용자 정보를 찾았습니다:', userProfile);
      } else {
        // Firebase에서 사용자 정보를 찾지 못한 경우 (기본값으로 저장)
        userData = {
          name: name.trim(),
          birthDate: birthDate,
          gender: '',
          sido: '',
          sigungu: '',
          email: '',
          phoneNumber: '',
          address: '',
          emergencyContact: null,
          medicalInfo: null,
          loginTime: new Date().toISOString()
        };
        
        console.log('사용자 정보를 찾지 못했습니다. 기본값으로 저장합니다.');
      }
      
      localStorage.setItem('userInfo', JSON.stringify(userData));
      
      if (onLoginSuccess) {
        onLoginSuccess({ 
          name: userData.name, 
          birthDate: userData.birthDate,
          gender: userData.gender,
          sido: userData.sido,
          sigungu: userData.sigungu
        });
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
                    onIonInput={(e) => setName(e.detail.value!)}
                    placeholder="이름을 입력하세요"
                    clearInput={true}
                  />
                </IonItem>

                <IonItem className="form-item">
                  <IonIcon icon={calendar} slot="start" />
                  <IonLabel position="stacked">생년월일</IonLabel>
                  <IonInput
                    type="date"
                    value={birthDate}
                    onIonInput={(e) => setBirthDate(e.detail.value!)}
                    placeholder="생년월일을 선택하세요"
                  />
                </IonItem>
              </div>

              <IonButton
                expand="block"
                onClick={handleLogin}
                disabled={!name.trim() || !birthDate || loading}
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
