import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonBadge,
} from '@ionic/react';
import { calendar, medical, chevronBack, chevronForward, logOut, business, notifications } from 'ionicons/icons';
import { getCurrentUserSession, clearUserSession, hasUserPermission } from '../services/userService';
import { getFavoriteHospitals, removeFavoriteHospital, FavoriteHospital } from '../services/favoriteHospitalService';
import { addReservation } from '../services/reservationService';
import HospitalDetailModal from '../components/HospitalDetailModal';
import AppointmentModal, { AppointmentData } from '../components/AppointmentModal';
import { App } from '@capacitor/app';
import './Home.css';

// 사용자 정보 인터페이스 제거됨

const Home: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  
  // 사용자 정보 가져오기
  const [userName, setUserName] = useState<string>('사용자');
  
  // 알림 개수 상태 (예시로 15개 설정)
  const [notificationCount, setNotificationCount] = useState<number>(15);
  
  // 즐겨찾기 병원 관련 상태
  const [favoriteHospitals, setFavoriteHospitals] = useState<FavoriteHospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<FavoriteHospital | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 예약 모달 관련 상태
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  
  useEffect(() => {
    // 세션에서 사용자 정보 가져오기
    const userSession = getCurrentUserSession();
    if (userSession) {
      setUserName(userSession.name || '사용자');
      // 즐겨찾기 병원 목록 가져오기
      loadFavoriteHospitals();
    } else {
      // 기존 localStorage 방식도 지원 (하위 호환성)
      const savedUserInfo = localStorage.getItem('userInfo');
      if (savedUserInfo) {
        const userInfo = JSON.parse(savedUserInfo);
        setUserName(userInfo.name || '사용자');
      }
    }
  }, []);

  // 앱 상태 변화 감지 (전화걸기 후 복귀)
  useEffect(() => {
    const handleAppStateChange = () => {
      // 전화걸기 후 앱으로 돌아왔을 때 예약 모달 표시
      const lastCallTime = localStorage.getItem('lastCallTime');
      
      if (lastCallTime) {
        setShowAppointmentModal(true);
        localStorage.removeItem('lastCallTime');
      }
    };

    // Capacitor App Plugin으로 앱 상태 변화 감지
    const setupAppStateListener = async () => {
      try {
        // 앱 상태 변화 리스너 등록
        const listener = await App.addListener('appStateChange', ({ isActive }) => {
          console.log('앱 상태 변화:', isActive ? '활성화' : '비활성화');
          
          if (isActive) {
            // 앱이 다시 활성화됨 (통화 종료 후 복귀)
            setTimeout(() => {
              handleAppStateChange();
            }, 500); // 약간의 지연을 두어 안정성 확보
          }
        });

        // 컴포넌트 마운트 시에도 체크
        handleAppStateChange();

        // 정리 함수에서 리스너 제거
        return () => {
          listener.remove();
        };
      } catch (error) {
        console.error('앱 상태 리스너 설정 실패:', error);
        
        // 폴백: 기존 window focus 이벤트 사용
        const handleFocus = () => {
          handleAppStateChange();
        };

        window.addEventListener('focus', handleFocus);
        handleAppStateChange();

        return () => {
          window.removeEventListener('focus', handleFocus);
        };
      }
    };

    const cleanup = setupAppStateListener();

    return () => {
      if (cleanup) {
        cleanup.then(cleanupFn => cleanupFn && cleanupFn());
      }
    };
  }, []);

  // 즐겨찾기 병원 목록 로드
  const loadFavoriteHospitals = async () => {
    try {
      console.log('즐겨찾기 병원 목록 로드 시작...');
      const favorites = await getFavoriteHospitals();
      console.log('즐겨찾기 병원 목록:', favorites);
      setFavoriteHospitals(favorites);
    } catch (error) {
      console.error('즐겨찾기 병원 목록 로드 실패:', error);
    }
  };

  // 사용하지 않는 calculateAge 함수 제거됨

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // 빈 칸 추가 (이전 달의 마지막 날들)
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // 현재 달의 날들
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const handleDateClick = (day: number) => {
    setSelectedDate(day);
  };

  const days = getDaysInMonth(currentDate);

  // 로그아웃 함수
  const handleLogout = () => {
    // 세션에서 사용자 정보 삭제
    clearUserSession();
    // 기존 localStorage도 삭제 (하위 호환성)
    localStorage.removeItem('userInfo');
    // 페이지 새로고침하여 UserInfo 컴포넌트로 이동
    window.location.reload();
  };

  // 알림 클릭 함수
  const handleNotificationClick = () => {
    // 권한 확인 후 알림 기능 실행
    if (hasUserPermission('read')) {
      console.log('알림 클릭됨 - 권한 있음');
      // 알림 목록으로 이동하거나 알림 모달 열기
    } else {
      console.log('알림 접근 권한 없음');
    }
  };

  // 알림 개수 표시 함수
  const getNotificationDisplay = (count: number) => {
    if (count === 0) return '';
    if (count > 10) return '10+';
    return count.toString();
  };

  // 즐겨찾기 병원 카드 클릭 핸들러
  const handleFavoriteHospitalClick = (hospital: FavoriteHospital) => {
    setSelectedHospital(hospital);
    setIsModalOpen(true);
  };

  // 모달 닫기 핸들러
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedHospital(null);
  };

  // 즐겨찾기 토글 핸들러
  const handleToggleFavorite = async (hospital: FavoriteHospital) => {
    try {
      if (hospital.id) {
        await removeFavoriteHospital(hospital.id);
        // 목록에서 제거
        setFavoriteHospitals(prev => prev.filter(h => h.id !== hospital.id));
        // 모달 닫기
        handleModalClose();
      }
    } catch (error) {
      console.error('즐겨찾기 해제 실패:', error);
    }
  };

  // 예약 저장 핸들러
  const handleSaveAppointment = async (appointmentData: AppointmentData) => {
    try {
      const date = appointmentData.appointmentDate;
      const time = appointmentData.appointmentTime;
      const combined = new Date(`${date}T${time}:00`);

      const hospital = getLastCallHospital();

      const id = await addReservation({
        address: hospital.address,
        hospitalName: hospital.name,
        memo: appointmentData.notes || '',
        reservationDate: combined,
        telNo: hospital.phone,
      });
      console.log('예약 저장 완료 ID:', id);
      alert('예약이 등록되었습니다!');
    } catch (err) {
      console.error('예약 저장 실패:', err);
      alert('예약 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 예약 모달 닫기 핸들러
  const handleCloseAppointmentModal = () => {
    setShowAppointmentModal(false);
  };

  // 저장된 병원 정보 가져오기
  const getLastCallHospital = () => {
    const hospitalData = localStorage.getItem('lastCallHospital');
    if (hospitalData) {
      return JSON.parse(hospitalData);
    }
    return {
      name: '병원명',
      phone: '전화번호',
      address: '주소'
    };
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>건강 약속</IonTitle>
          <IonButton 
            fill="clear" 
            slot="end"
            onClick={handleNotificationClick}
            className="header-notification-button"
          >
            <IonIcon icon={notifications} />
            {notificationCount > 0 && (
              <IonBadge color="danger" className="notification-badge">
                {getNotificationDisplay(notificationCount)}
              </IonBadge>
            )}
          </IonButton>
          <IonButton 
            fill="clear" 
            slot="end"
            onClick={handleLogout}
            className="header-logout-button"
          >
            <IonIcon icon={logOut} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="main-container">
          {/* 예약 알림 배너 */}
          <IonCard className="promotion-banner">
            <IonCardContent>
              <div className="banner-content">
                <div className="banner-text">
                  <h2 className="banner-title">{userName}님!</h2>
                  <p className="banner-subtitle">2025년 9월 19일에 서울 아산 병원<br />예약되었어요!</p>
                </div>
                <div className="banner-icon">
                  <IonIcon icon={business} />
                </div>
              </div>
            </IonCardContent>
          </IonCard>


                      {/* 즐겨찾기 병원 섹션 */}
                      <div className="favorite-hospitals-section">
                        <h2 className="section-title">자주다니는 병원 ({favoriteHospitals.length}개)</h2>
                        {favoriteHospitals.length > 0 ? (
                          <div className="favorite-hospitals-list">
                            {favoriteHospitals.map((hospital) => (
                              <IonCard 
                                key={hospital.id} 
                                className="favorite-hospital-card"
                                onClick={() => handleFavoriteHospitalClick(hospital)}
                              >
                                <IonCardContent>
                                  <div className="favorite-hospital-content">
                                    <div className="hospital-info">
                                      <h3 className="favorite-hospital-name">{hospital.name}</h3>
                                      <p className="hospital-address">{hospital.address.replace(/^[가-힣]+도\s+/, '')}</p>
                                    </div>
                                    <div className="hospital-arrow">
                                      <IonIcon icon={chevronForward} />
                                    </div>
                                  </div>
                                </IonCardContent>
                              </IonCard>
                            ))}
                          </div>
                        ) : (
                          <div className="no-favorites-message">
                            <p>자주다니는 병원이 없습니다.</p>
                            <p>병원 예약에서 즐겨찾기를 등록해보세요!</p>
                          </div>
                        )}
                      </div>

          {/* 건강 캘린더 카드 */}
          <IonCard className="calendar-card">
            <IonCardContent>
              <div className="calendar-header">
                <IonButton fill="clear" onClick={goToPreviousMonth} className="nav-button">
                  <IonIcon icon={chevronBack} />
                </IonButton>
                <h3 className="month-year">
                  {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
                </h3>
                <IonButton fill="clear" onClick={goToNextMonth} className="nav-button">
                  <IonIcon icon={chevronForward} />
                </IonButton>
              </div>

              <IonGrid className="calendar-grid">
                <IonRow className="day-names">
                  {dayNames.map((day) => (
                    <IonCol key={day} className="day-name">
                      {day}
                    </IonCol>
                  ))}
                </IonRow>
                
                {Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIndex) => (
                  <IonRow key={weekIndex} className="calendar-week">
                    {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => (
                      <IonCol key={dayIndex} className="calendar-day">
                        {day && (
                          <div 
                            className={`day-number ${isToday(day) ? 'today' : ''} ${selectedDate === day ? 'selected' : ''}`}
                            onClick={() => handleDateClick(day)}
                          >
                            {day}
                          </div>
                        )}
                      </IonCol>
                    ))}
                  </IonRow>
                ))}
              </IonGrid>
            </IonCardContent>
          </IonCard>

          {/* 병원 예약 카드 */}
          <IonCard className="service-card hospital-card" routerLink="/hospital">
              <div className="service-card-content">
                <div className="service-text">
                  <h3 className="service-title hospital-title">병원 예약 <IonIcon icon={chevronForward} className="chevron-icon" /></h3>
                  <p className="service-subtitle">병원 예약을 쉽고 간편하게<br />관리하세요</p>
                </div>
                <div className="service-icon">
                  <IonIcon icon={calendar} />
                </div>
              </div>
          </IonCard>

          {/* 복약 관리 카드 */}
          <IonCard className="service-card medication-card" routerLink="/medication">
            <IonCardContent>
              <div className="service-card-content">
                <div className="service-text">
                  <h3 className="service-title medication-title">복약 관리 <IonIcon icon={chevronForward} className="chevron-icon" /></h3>
                  <p className="service-subtitle">약물 복용을 체계적으로<br />관리하세요</p>
                </div>
                <div className="service-icon">
                  <IonIcon icon={medical} />
                </div>
              </div>
            </IonCardContent>
                      </IonCard>

                    </div>
                  </IonContent>
                  
                  {/* 병원 상세 정보 모달 */}
                  <HospitalDetailModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    hospital={selectedHospital}
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite={true}
                  />
                  
                  {/* 예약 등록 모달 */}
                  <AppointmentModal
                    isOpen={showAppointmentModal}
                    onClose={handleCloseAppointmentModal}
                    hospitalName={getLastCallHospital().name}
                    hospitalPhone={getLastCallHospital().phone}
                    hospitalAddress={getLastCallHospital().address}
                    onSave={handleSaveAppointment}
                  />
                </IonPage>
              );
            };

            export default Home;
