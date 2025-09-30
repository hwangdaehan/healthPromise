import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonRadio,
  IonRadioGroup,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonAlert,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { person, save, checkmarkCircle, arrowBack } from 'ionicons/icons';
import { RegionService, RegionCode } from '../services/regionService';
import './UserInfo.css';
import { upsertUserProfile, checkPhoneNumberExists } from '../services/userService';

interface UserInfo {
  name: string;
  birthDate: string;
  gender: string;
  시도: string;
  시군구: string;
  telNo: string;
}

interface UserInfoProps {
  onSave: (userInfo: UserInfo) => void;
}

const UserInfo: React.FC<UserInfoProps> = ({ onSave }) => {
  const history = useHistory();
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '',
    birthDate: '',
    gender: '',
    시도: '',
    시군구: '',
    telNo: '',
  });

  // 지역 데이터 상태
  const [시도목록, set시도목록] = useState<RegionCode[]>([]);
  const [시군구목록, set시군구목록] = useState<RegionCode[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);
  const [isLoading시군구, setIsLoading시군구] = useState(false);
  const [phoneError, setPhoneError] = useState<string>('');
  const [phoneSuccess, setPhoneSuccess] = useState<string>('');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 지역 데이터 로드
  useEffect(() => {
    loadRegionData();
  }, []);

  const loadRegionData = async () => {
    setIsLoadingRegions(true);
    try {
      const 시도목록 = await RegionService.get시도목록();
      console.log(시도목록);
      set시도목록(시도목록);
    } catch (error) {
      console.error('지역 데이터 로드 실패:', error);
    } finally {
      setIsLoadingRegions(false);
    }
  };

  const handleSave = async () => {
    console.log('handleSave 함수 실행됨!');
    console.log('현재 userInfo:', userInfo);
    console.log('모든 필드 체크:', {
      name: !!userInfo.name,
      birthDate: !!userInfo.birthDate,
      gender: !!userInfo.gender,
      시도: !!userInfo.시도,
      시군구: !!userInfo.시군구,
      telNo: !!userInfo.telNo,
    });

    // 휴대폰번호 중복 체크
    if (userInfo.telNo) {
      const cleanPhoneNumber = formatPhoneNumber(userInfo.telNo);
      const exists = await checkPhoneNumberExists(cleanPhoneNumber);
      if (exists) {
        setPhoneError('이미 사용 중인 휴대폰번호입니다.');
        return;
      }
    }

    if (
      userInfo.name &&
      userInfo.birthDate &&
      userInfo.gender &&
      userInfo.시도 &&
      userInfo.시군구 &&
      userInfo.telNo &&
      !phoneError
    ) {
      console.log('모든 필드가 채워짐! Firebase 저장 시작...');
      setIsSaving(true);
      
      try {
        const result = await upsertUserProfile({
          birthDate: userInfo.birthDate,
          gender: userInfo.gender as 'male' | 'female' | 'other',
          name: userInfo.name,
          sido: userInfo.시도,
          sigungu: userInfo.시군구,
          telNo: formatPhoneNumber(userInfo.telNo),
        });
        
        console.log('Firebase 저장 결과:', result);
        
        if (result) {
          console.log('Firebase 저장 성공!');
          onSave(userInfo);
        } else {
          console.error('Firebase 저장 실패: result가 null');
          setErrorMessage('회원가입에 실패했습니다. 다시 시도해주세요.');
          setShowErrorAlert(true);
        }
      } catch (e) {
        console.error('Firebase 저장 실패:', e);
        setErrorMessage(`회원가입 중 오류가 발생했습니다: ${e instanceof Error ? e.message : '알 수 없는 오류'}`);
        setShowErrorAlert(true);
      } finally {
        setIsSaving(false);
      }
    } else {
      console.log('일부 필드가 비어있음. 저장하지 않음.');
      setErrorMessage('모든 필수 항목을 입력해주세요.');
      setShowErrorAlert(true);
    }
  };

  const updateUserInfo = (field: keyof UserInfo, value: string) => {
    if (field === '시도') {
      // 시도 변경 시 시군구 초기화
      setUserInfo(prev => ({
        ...prev,
        [field]: value,
        시군구: '',
      }));
      // 시군구 목록 즉시 로드
      load시군구목록(parseInt(value));
    } else if (field === 'telNo') {
      // 휴대폰번호 입력 시 에러/성공 메시지 초기화
      setPhoneError('');
      setPhoneSuccess('');
      // 입력값을 자동으로 포맷팅하여 표시
      const formattedValue = formatPhoneDisplay(value);
      setUserInfo(prev => ({
        ...prev,
        [field]: formattedValue,
      }));
    } else {
      setUserInfo(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  // 휴대폰번호에서 - 제거하는 함수 (저장용)
  const formatPhoneNumber = (phoneNumber: string): string => {
    return phoneNumber.replace(/-/g, '');
  };

  // 휴대폰번호에 - 추가하는 함수 (표시용)
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

  // 휴대폰번호 중복 체크 함수
  const checkPhoneDuplicate = async (phoneNumber: string) => {
    const cleanPhoneNumber = formatPhoneNumber(phoneNumber);
    if (!cleanPhoneNumber || cleanPhoneNumber.length < 10) {
      setPhoneError('');
      setPhoneSuccess('');
      return;
    }

    setIsCheckingPhone(true);
    setPhoneError('');
    setPhoneSuccess('');
    
    try {
      const exists = await checkPhoneNumberExists(cleanPhoneNumber);
      if (exists) {
        setPhoneError('이미 사용 중인 휴대폰번호입니다.');
        setPhoneSuccess('');
      } else {
        setPhoneError('');
        setPhoneSuccess('사용가능한 휴대폰번호입니다.');
      }
    } catch (error) {
      console.error('휴대폰번호 중복 체크 실패:', error);
      setPhoneError('휴대폰번호 확인 중 오류가 발생했습니다.');
      setPhoneSuccess('');
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const load시군구목록 = async (시도코드: number) => {
    setIsLoading시군구(true);
    try {
      const 시군구목록 = await RegionService.get시군구By시도(시도코드);
      console.log(시군구목록);
      set시군구목록(시군구목록);
    } catch (error) {
      console.error('시군구 목록 로드 실패:', error);
    } finally {
      setIsLoading시군구(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton
              fill="clear"
              onClick={() => history.push('/home')}
              className="user-info-back"
            >
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>
            <img 
              src="/main_logo.svg" 
              alt="건강 약속" 
              style={{ height: '24px', width: 'auto' }}
            />
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="user-info-container">
          {/* 환영 배너 */}
          <IonCard className="welcome-banner">
            <IonCardContent>
              <div className="banner-content">
                <div className="banner-text">
                  <h2 className="banner-title">환영합니다! 👋</h2>
                  <h3 className="banner-form-title">기본 정보를 입력해주세요!</h3>
                  <p className="banner-subtitle">건강한 하루를 위한 첫 걸음을 시작해보세요</p>
                </div>
                <div className="banner-icon">
                  <IonIcon icon={person} />
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* 입력 폼 카드 */}
          <IonCard className="form-card">
            <IonCardContent>
              <div className="input-group">
                <IonLabel className="input-label">이름 *</IonLabel>
                <IonItem>
                  <IonInput
                    value={userInfo.name}
                    onIonInput={e => updateUserInfo('name', e.detail.value!)}
                    placeholder="이름을 입력하세요"
                    clearInput={true}
                  />
                </IonItem>
              </div>

              <div className="input-group">
                <IonLabel className="input-label">생년월일을 알려주세요 *</IonLabel>
                <IonItem>
                  <IonInput
                    type="date"
                    value={userInfo.birthDate}
                    onIonInput={e => updateUserInfo('birthDate', e.detail.value!)}
                    placeholder="생년월일을 선택하세요"
                  />
                </IonItem>
              </div>

              <div className="input-group">
                <IonLabel className="input-label">휴대폰번호를 입력해주세요 *</IonLabel>
                <IonItem>
                  <IonInput
                    type="tel"
                    value={userInfo.telNo}
                    onIonInput={e => updateUserInfo('telNo', e.detail.value!)}
                    onIonBlur={() => checkPhoneDuplicate(userInfo.telNo)}
                    placeholder="010-1234-5678"
                    clearInput={true}
                  />
                </IonItem>
                {phoneError && (
                  <div className="error-message" style={{ color: 'red', fontSize: '14px', marginTop: '4px' }}>
                    {phoneError}
                  </div>
                )}
                {phoneSuccess && (
                  <div style={{ color: 'green', fontSize: '14px', marginTop: '4px' }}>
                    {phoneSuccess}
                  </div>
                )}
                {isCheckingPhone && (
                  <div style={{ color: 'blue', fontSize: '14px', marginTop: '4px' }}>
                    휴대폰번호 확인 중...
                  </div>
                )}
              </div>

              <div className="input-group">
                <IonLabel className="input-label">성별을 선택해주세요 *</IonLabel>
                <IonRadioGroup
                  value={userInfo.gender}
                  onIonChange={e => updateUserInfo('gender', e.detail.value)}
                  className="gender-radio-group"
                >
                  <IonItem className="radio-item" button>
                    <IonLabel>남성</IonLabel>
                    <IonRadio slot="end" value="male" />
                  </IonItem>
                  <IonItem className="radio-item" button>
                    <IonLabel>여성</IonLabel>
                    <IonRadio slot="end" value="female" />
                  </IonItem>
                </IonRadioGroup>
              </div>

              <div className="input-group">
                <IonLabel className="input-label">거주 지역을 선택해주세요 *</IonLabel>

                <div className="region-select-container">
                  <IonItem className="region-select-item">
                    <IonLabel position="stacked">시/도</IonLabel>
                    <IonSelect
                      value={userInfo.시도}
                      onIonChange={e => updateUserInfo('시도', e.detail.value)}
                      placeholder="시/도를 선택하세요"
                      disabled={isLoadingRegions}
                    >
                      {시도목록.map(시도 => (
                        <IonSelectOption key={시도.코드} value={시도.코드.toString()}>
                          {시도.코드명}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>

                  <IonItem className="region-select-item">
                    <IonLabel position="stacked">시/군/구</IonLabel>
                    <IonSelect
                      value={userInfo.시군구}
                      onIonChange={e => updateUserInfo('시군구', e.detail.value)}
                      placeholder={
                        !userInfo.시도
                          ? '먼저 시/도를 선택하세요'
                          : isLoading시군구
                            ? '시/군/구 목록을 불러오는 중...'
                            : '시/군/구를 선택하세요'
                      }
                      disabled={!userInfo.시도 || isLoading시군구}
                    >
                      {시군구목록.map(시군구 => (
                        <IonSelectOption key={시군구.코드} value={시군구.코드.toString()}>
                          {시군구.코드명}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                </div>
              </div>

              <IonButton
                expand="block"
                onClick={handleSave}
                className="save-button"
                disabled={
                  !userInfo.name ||
                  !userInfo.birthDate ||
                  !userInfo.gender ||
                  !userInfo.시도 ||
                  !userInfo.시군구 ||
                  !userInfo.telNo ||
                  !!phoneError ||
                  isCheckingPhone ||
                  isSaving
                }
              >
                <IonIcon icon={checkmarkCircle} slot="start" />
                {isSaving ? '저장 중...' : '시작하기! 🚀'}
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>

      {/* 에러 알림 */}
      <IonAlert
        isOpen={showErrorAlert}
        onDidDismiss={() => setShowErrorAlert(false)}
        header="오류"
        message={errorMessage}
        buttons={['확인']}
      />
    </IonPage>
  );
};

export default UserInfo;
