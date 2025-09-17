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
import './Home.css';

// 사용자 정보 인터페이스 제거됨

const Home: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  
  // 사용자 정보 가져오기
  const [userName, setUserName] = useState<string>('사용자');
  
  // 알림 개수 상태 (예시로 15개 설정)
  const [notificationCount, setNotificationCount] = useState<number>(15);
  
  useEffect(() => {
    const savedUserInfo = localStorage.getItem('userInfo');
    if (savedUserInfo) {
      const userInfo = JSON.parse(savedUserInfo);
      setUserName(userInfo.name || '사용자');
    }
  }, []);

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
    // 로컬 스토리지에서 사용자 정보 삭제
    localStorage.removeItem('userInfo');
    // 페이지 새로고침하여 UserInfo 컴포넌트로 이동
    window.location.reload();
  };

  // 알림 클릭 함수
  const handleNotificationClick = () => {
    // 알림 목록으로 이동하거나 알림 모달 열기
    console.log('알림 클릭됨');
  };

  // 알림 개수 표시 함수
  const getNotificationDisplay = (count: number) => {
    if (count === 0) return '';
    if (count > 10) return '10+';
    return count.toString();
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

          {/* 메인 콘텐츠 제목 */}
          <div className="main-title-section">
            <h1 className="main-title">건강 관리는 역시 건강 약속</h1>
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
    </IonPage>
  );
};

export default Home;
