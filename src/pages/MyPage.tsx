import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonIcon, IonToggle } from '@ionic/react';
import { person, notifications, logOut, create } from 'ionicons/icons';
import { updateNotificationSetting, getNotificationSetting } from '../services/userService';
import { RegionService } from '../services/regionService';
import './MyPage.css';

interface UserData {
  name: string;
  birthDate: string;
  gender: string;
  sido: string;
  sigungu: string;
  email?: string;
  phoneNumber?: string;
  telNo?: string;
  address?: string;
  emergencyContact?: any;
  medicalInfo?: any;
  loginTime?: string;
}

const MyPage: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState<boolean>(true);
  const [regionName, setRegionName] = useState<string>('');

  useEffect(() => {
    const loadUserData = async () => {
      // localStorage에서 사용자 정보 가져오기
      const savedUserInfo = localStorage.getItem('userInfo');
      if (savedUserInfo) {
        const userInfo = JSON.parse(savedUserInfo);
        setUserData(userInfo);
        
        // 지역명 변환
        if (userInfo.sido && userInfo.sigungu) {
          const region = await formatRegion(userInfo.sido, userInfo.sigungu);
          setRegionName(region);
        }
      }
      
      // 알림 설정 로드
      const notificationSetting = await getNotificationSetting();
      setIsNotificationEnabled(notificationSetting);
      
      setIsLoading(false);
    };
    
    loadUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('fcmToken');
    window.location.href = '/login';
  };

  const handleNotificationToggle = async (event: CustomEvent) => {
    const isEnabled = event.detail.checked;
    console.log('토글 변경:', isEnabled);
    setIsNotificationEnabled(isEnabled);
    
    try {
      console.log('updateNotificationSetting 호출 시작');
      const success = await updateNotificationSetting(isEnabled);
      console.log('updateNotificationSetting 결과:', success);
      
      if (success) {
        console.log('알림 설정 업데이트 성공:', isEnabled);
      } else {
        console.error('알림 설정 업데이트 실패');
        // 실패 시 원래 상태로 되돌리기
        setIsNotificationEnabled(!isEnabled);
      }
    } catch (error) {
      console.error('알림 설정 업데이트 중 오류:', error);
      // 오류 시 원래 상태로 되돌리기
      setIsNotificationEnabled(!isEnabled);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatGender = (gender: string) => {
    if (gender === 'male' || gender === '남성' || gender === '남' || gender === 'M') return '남';
    if (gender === 'female' || gender === '여성' || gender === '여' || gender === 'F') return '여';
    return gender;
  };

  const getGenderColor = (gender: string) => {
    if (gender === 'male' || gender === '남성' || gender === '남' || gender === 'M') return 'male';
    if (gender === 'female' || gender === '여성' || gender === '여' || gender === 'F') return 'female';
    return '';
  };

  const formatRegion = async (sido: string, sigungu: string) => {
    try {
      // RegionService를 사용해서 실제 API 데이터로 변환
      const regionData = await RegionService.getRegionData();
      
      // 시도 코드로 시도명 찾기
      const sidoInfo = regionData.시도.find(item => item.코드.toString() === sido);
      const sidoName = sidoInfo ? sidoInfo.코드명 : sido;
      
      // 시군구 코드로 시군구명 찾기
      const sigunguInfo = regionData.시군구.find(item => item.코드.toString() === sigungu);
      const sigunguName = sigunguInfo ? sigunguInfo.코드명 : sigungu;
      
      return `${sidoName} ${sigunguName}`;
    } catch (error) {
      console.error('지역 정보 변환 실패:', error);
      return `${sido} ${sigungu}`;
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>로딩 중...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!userData) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="error-container">
            <p>사용자 정보를 찾을 수 없습니다.</p>
            <IonButton onClick={handleLogout}>로그인 페이지로 이동</IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>마이페이지</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="mypage-content">
        {/* 프로필 섹션 */}
        <div className="profile-section">
          <div className="profile-header">
            <div className="profile-avatar">
              <IonIcon icon={person} />
            </div>
            <div className="profile-info">
              <h2 className="profile-name">{userData.name}</h2>
              <p className="profile-subtitle">건강약속 회원</p>
            </div>
            <IonButton fill="clear" className="edit-button">
              <IonIcon icon={create} />
            </IonButton>
          </div>
        </div>

        {/* 개인정보 섹션 */}
        <div className="info-section">
          <h3 className="section-title">개인정보</h3>
          <div className="info-card">
            <div className="info-item">
              <span className="info-label">이름</span>
              <span className="info-value">{userData.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">생년월일</span>
              <span className="info-value">{formatDate(userData.birthDate)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">성별</span>
              <span className={`info-value gender-value ${getGenderColor(userData.gender)}`}>
                {formatGender(userData.gender)}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">거주지역</span>
              <span className="info-value">{regionName || `${userData.sido} ${userData.sigungu}`}</span>
            </div>
            {userData.email && (
              <div className="info-item">
                <span className="info-label">이메일</span>
                <span className="info-value">{userData.email}</span>
              </div>
            )}
            {userData.phoneNumber && (
              <div className="info-item">
                <span className="info-label">휴대폰번호</span>
                <span className="info-value">{userData.phoneNumber}</span>
              </div>
            )}
            {userData.address && (
              <div className="info-item">
                <span className="info-label">주소</span>
                <span className="info-value">{userData.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* 응급연락처 섹션 */}
        {userData.emergencyContact && (
          <div className="info-section">
            <h3 className="section-title">응급연락처</h3>
            <div className="info-card">
              <div className="info-item">
                <span className="info-label">이름</span>
                <span className="info-value">{userData.emergencyContact.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">관계</span>
                <span className="info-value">{userData.emergencyContact.relationship}</span>
              </div>
              <div className="info-item">
                <span className="info-label">연락처</span>
                <span className="info-value">{userData.emergencyContact.phoneNumber}</span>
              </div>
            </div>
          </div>
        )}

        {/* 의료정보 섹션 */}
        {userData.medicalInfo && (
          <div className="info-section">
            <h3 className="section-title">의료정보</h3>
            <div className="info-card">
              {userData.medicalInfo.allergies && (
                <div className="info-item">
                  <span className="info-label">알레르기</span>
                  <span className="info-value">{userData.medicalInfo.allergies}</span>
                </div>
              )}
              {userData.medicalInfo.medications && (
                <div className="info-item">
                  <span className="info-label">복용중인 약물</span>
                  <span className="info-value">{userData.medicalInfo.medications}</span>
                </div>
              )}
              {userData.medicalInfo.conditions && (
                <div className="info-item">
                  <span className="info-label">기존 질환</span>
                  <span className="info-value">{userData.medicalInfo.conditions}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 메뉴 섹션 */}
        <div className="menu-section">
          <div className="menu-item notification-item">
            <div className="notification-content">
              <IonIcon icon={notifications} className="menu-icon" />
              <span className="menu-text">알림 설정</span>
            </div>
            <IonToggle
              checked={isNotificationEnabled}
              onIonChange={handleNotificationToggle}
              className="notification-toggle"
            />
          </div>
        </div>

        {/* 로그아웃 버튼 */}
        <div className="logout-section">
          <IonButton 
            expand="block" 
            fill="outline" 
            color="danger" 
            onClick={handleLogout}
            className="logout-button"
          >
            <IonIcon icon={logOut} slot="start" />
            로그아웃
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MyPage;
