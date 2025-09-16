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
} from '@ionic/react';
import { person, save } from 'ionicons/icons';
import { RegionService, RegionCode } from '../services/regionService';
import './UserInfo.css';

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

  const handleSave = () => {
    if (userInfo.name && userInfo.birthDate && userInfo.gender && userInfo.시도 && userInfo.시군구) {
      onSave(userInfo);
    }
  };

  const updateUserInfo = (field: keyof UserInfo, value: string) => {
    if (field === '시도') {
      // 시도 변경 시 시군구 초기화
      setUserInfo(prev => ({
        ...prev,
        [field]: value,
        시군구: ''
      }));
      // 시군구 목록 즉시 로드
      load시군구목록(parseInt(value));
    } else {
      setUserInfo(prev => ({
        ...prev,
        [field]: value
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
      <IonContent className="ion-padding">
        <div className="user-info-container">
          <IonCard className="user-info-card">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={person} />
                    기본 정보를 입력해주세요!
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
              
              <div className="input-group">
                <IonLabel className="input-label">이름 *</IonLabel>
                <IonItem>
                  <IonInput
                    value={userInfo.name}
                    onIonInput={(e) => updateUserInfo('name', e.detail.value!)}
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
                    onIonInput={(e) => updateUserInfo('birthDate', e.detail.value!)}
                    placeholder="생년월일을 선택하세요"
                  />
                </IonItem>
              </div>

              <div className="input-group">
                <IonLabel className="input-label">성별을 선택해주세요 *</IonLabel>
                <IonRadioGroup 
                  value={userInfo.gender} 
                  onIonChange={(e) => updateUserInfo('gender', e.detail.value)}
                  className="gender-radio-group"
                >
                  <IonItem className="radio-item">
                    <IonLabel>남성</IonLabel>
                    <IonRadio slot="end" value="male" />
                  </IonItem>
                  <IonItem className="radio-item">
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
                      onIonChange={(e) => updateUserInfo('시도', e.detail.value)}
                      placeholder="시/도를 선택하세요"
                      disabled={isLoadingRegions}
                    >
                      {시도목록.map((시도) => (
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
                      onIonChange={(e) => updateUserInfo('시군구', e.detail.value)}
                      placeholder={
                        !userInfo.시도 
                          ? "먼저 시/도를 선택하세요" 
                          : isLoading시군구
                            ? "시/군/구 목록을 불러오는 중..." 
                            : "시/군/구를 선택하세요"
                      }
                      disabled={!userInfo.시도 || isLoading시군구}
                    >
                      {시군구목록.map((시군구) => (
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
                    disabled={!userInfo.name || !userInfo.birthDate || !userInfo.gender || !userInfo.시도 || !userInfo.시군구}
                  >
                    <IonIcon icon={save} slot="start" />
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
