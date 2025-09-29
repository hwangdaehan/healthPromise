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
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { person, save, checkmarkCircle, arrowBack } from 'ionicons/icons';
import { RegionService, RegionCode } from '../services/regionService';
import './UserInfo.css';
import { upsertUserProfile } from '../services/userService';

interface UserInfo {
  name: string;
  birthDate: string;
  gender: string;
  시도: string;
  시군구: string;
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
  });

  // 지역 데이터 상태
  const [시도목록, set시도목록] = useState<RegionCode[]>([]);
  const [시군구목록, set시군구목록] = useState<RegionCode[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);
  const [isLoading시군구, setIsLoading시군구] = useState(false);

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
    });

    if (
      userInfo.name &&
      userInfo.birthDate &&
      userInfo.gender &&
      userInfo.시도 &&
      userInfo.시군구
    ) {
      console.log('모든 필드가 채워짐! Firebase 저장 시작...');
      try {
        await upsertUserProfile({
          birthDate: userInfo.birthDate,
          gender: userInfo.gender as 'male' | 'female' | 'other',
          name: userInfo.name,
          sido: userInfo.시도,
          sigungu: userInfo.시군구,
        });
        console.log('Firebase 저장 완료!');
      } catch (e) {
        console.error('Firebase 저장 실패:', e);
      }
      onSave(userInfo);
    } else {
      console.log('일부 필드가 비어있음. 저장하지 않음.');
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
    } else {
      setUserInfo(prev => ({
        ...prev,
        [field]: value,
      }));
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
          <IonTitle>건강 약속</IonTitle>
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
                  !userInfo.시군구
                }
              >
                <IonIcon icon={checkmarkCircle} slot="start" />
                시작하기! 🚀
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default UserInfo;
