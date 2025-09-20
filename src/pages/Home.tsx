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
  IonModal,
  IonItem,
  IonLabel,
} from '@ionic/react';
import { useIonViewWillEnter } from '@ionic/react';
import { calendar, medical, chevronBack, chevronForward, logOut, business, notifications, time, location, call } from 'ionicons/icons';
import { getCurrentUserSession, clearUserSession, hasUserPermission } from '../services/userService';
import { getFavoriteHospitals, removeFavoriteHospital, FavoriteHospital } from '../services/favoriteHospitalService';
import { addReservation, getReservations } from '../services/reservationService';
import { getMedicineHistory, MedicineHistory } from '../services/medicineHistoryService';
import { FirestoreService } from '../services/firestoreService';
import { MessagingService } from '../services/messagingService';
import { getUnreadAlarmCount, getAlarms, markAlarmAsRead } from '../services/alarmService';
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
  
  // 예약 데이터 상태
  const [latestReservation, setLatestReservation] = useState<any>(null);
  const [allReservations, setAllReservations] = useState<any[]>([]);
  
  // 복약 기록 상태
  const [medicineHistory, setMedicineHistory] = useState<MedicineHistory[]>([]);
  
  // 예약 상세 모달 상태
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedDateReservations, setSelectedDateReservations] = useState<any[]>([]);
  const [selectedDateMedicineHistory, setSelectedDateMedicineHistory] = useState<any[]>([]);
  const [selectedModalDate, setSelectedModalDate] = useState<Date | null>(null);
  
  // 알림 리스트 상태
  const [showAlarmList, setShowAlarmList] = useState(false);
  const [alarmList, setAlarmList] = useState<any[]>([]);
  
  
  useEffect(() => {
    // 사용자 정보 가져오기
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      // Firebase 세션에서 사용자 정보 가져오기
      const userSession = await getCurrentUserSession();
      if (userSession && userSession.isAuthenticated) {
        setUserName(userSession.name || '사용자');
        // 즐겨찾기 병원 목록 가져오기
        loadFavoriteHospitals();
        loadReservations();
        loadMedicineHistory();
        return;
      }
    } catch (error) {
      console.log('Firebase 세션 확인 실패:', error);
    }

    // localStorage에서 사용자 정보 가져오기
    const savedUserInfo = localStorage.getItem('userInfo');
    if (savedUserInfo) {
      try {
        const userInfo = JSON.parse(savedUserInfo);
        if (userInfo.name) {
          setUserName(userInfo.name);
          // 즐겨찾기 병원 목록 가져오기
          loadFavoriteHospitals();
          loadReservations();
          loadMedicineHistory();
        }
      } catch (error) {
        console.log('localStorage 사용자 정보 파싱 실패:', error);
      }
    }
  };

  // 화면 진입 시 즐겨찾기 병원 갱신
  useIonViewWillEnter(() => {
    loadFavoriteHospitals();
    loadReservations();
    loadMedicineHistory();
    updateNotificationCount();
  });

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
              // 즐겨찾기 병원 목록도 새로고침
              loadFavoriteHospitals();
              loadReservations();
              loadMedicineHistory();
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
      // localStorage에서 사용자 정보 가져오기
      const savedUserInfo = localStorage.getItem('userInfo');
      let userId = null;
      
      if (savedUserInfo) {
        try {
          const userInfo = JSON.parse(savedUserInfo);
          // Firebase user 컬렉션에서 찾은 사용자의 uid가 있다면 사용
          if (userInfo.uid) {
            userId = userInfo.uid;
          }
        } catch (error) {
          console.log('localStorage 사용자 정보 파싱 실패:', error);
        }
      }
      
      const favorites = await getFavoriteHospitals(userId);
      setFavoriteHospitals(favorites);
    } catch (error) {
      console.error('즐겨찾기 병원 목록 로드 실패:', error);
    }
  };

  // 예약한 병원 목록 로드 (현재 월)
  const loadReservations = async () => {
    try {
      // 현재 보고 있는 월의 예약만 Firebase에서 직접 조회
      const currentMonthReservations = await getReservations(currentDate.getFullYear(), currentDate.getMonth());
      
      // 현재 월의 예약 데이터 설정
      setAllReservations(currentMonthReservations);
      
      // 현재 월 예약 개수 로그
      console.log(`${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 예약한 병원목록:`, currentMonthReservations.length);
      
      // 미래의 가장 가까운 예약 찾기
      await loadUpcomingReservation();
    } catch (error) {
      console.error('예약한 병원 목록 로드 실패:', error);
    }
  };

  // 예약한 병원 목록 로드 (특정 월)
  const loadReservationsForMonth = async (year: number, month: number) => {
    try {
      // 특정 월의 예약만 Firebase에서 직접 조회
      const monthReservations = await getReservations(year, month);
      
      // 해당 월의 예약 데이터 설정
      setAllReservations(monthReservations);
      
      // 해당 월 예약 개수 로그
      console.log(`${year}년 ${month + 1}월 예약한 병원목록:`, monthReservations.length);
      
      // 미래의 가장 가까운 예약 찾기
      await loadUpcomingReservation();
    } catch (error) {
      console.error('예약한 병원 목록 로드 실패:', error);
    }
  };

  // 미래의 가장 가까운 예약 찾기
  const loadUpcomingReservation = async () => {
    try {
      // 전체 예약 데이터 가져오기 (월별 제한 없이)
      const allReservations = await getReservations();
      
      const now = new Date();
      
      // 미래 예약만 필터링
      const upcomingReservations = allReservations.filter(reservation => {
        const reservationDate = reservation.reservationDate;
        return reservationDate > now;
      });
      
      if (upcomingReservations.length > 0) {
        // 날짜순으로 정렬하여 가장 가까운 예약 선택
        upcomingReservations.sort((a, b) => {
          const dateA = a.reservationDate;
          const dateB = b.reservationDate;
          return dateA.getTime() - dateB.getTime();
        });
        
        setLatestReservation(upcomingReservations[0]);
      } else {
        setLatestReservation(null);
      }
    } catch (error) {
      console.error('다가오는 예약 로드 실패:', error);
    }
  };

  // 복약 기록 로드 (현재 월)
  const loadMedicineHistory = async () => {
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
        }
      }
      
      // 현재 보고 있는 월의 복약 기록만 Firebase에서 직접 조회
      const currentMonthHistory = await getMedicineHistory(userId, currentDate.getFullYear(), currentDate.getMonth());
      
      setMedicineHistory(currentMonthHistory);
      
      // 현재 월 복약 기록 개수 로그
      console.log(`${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 복약 기록:`, currentMonthHistory.length);
    } catch (error) {
      console.error('복약 기록 로드 실패:', error);
    }
  };

  // 복약 기록 로드 (특정 월)
  const loadMedicineHistoryForMonth = async (year: number, month: number) => {
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
        }
      }
      
      // 특정 월의 복약 기록만 Firebase에서 직접 조회
      const monthHistory = await getMedicineHistory(userId, year, month);
      
      setMedicineHistory(monthHistory);
      
      // 해당 월 복약 기록 개수 로그
      console.log(`${year}년 ${month + 1}월 복약 기록:`, monthHistory.length);
    } catch (error) {
      console.error('복약 기록 로드 실패:', error);
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
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
    // 월이 변경되면 해당 월의 데이터 다시 조회 (새로운 년월 전달)
    loadReservationsForMonth(newDate.getFullYear(), newDate.getMonth());
    loadMedicineHistoryForMonth(newDate.getFullYear(), newDate.getMonth());
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
    // 월이 변경되면 해당 월의 데이터 다시 조회 (새로운 년월 전달)
    loadReservationsForMonth(newDate.getFullYear(), newDate.getMonth());
    loadMedicineHistoryForMonth(newDate.getFullYear(), newDate.getMonth());
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const hasReservation = (day: number) => {
    if (!day) return false;
    
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    return allReservations.some(reservation => {
      // Firebase Timestamp인 경우와 Date 객체인 경우 모두 처리
      const reservationDate = reservation.reservationDate.toDate ? reservation.reservationDate.toDate() : reservation.reservationDate;
      return (
        checkDate.getDate() === reservationDate.getDate() &&
        checkDate.getMonth() === reservationDate.getMonth() &&
        checkDate.getFullYear() === reservationDate.getFullYear()
      );
    });
  };

  // 복약 기록이 있는 날짜 확인
  const hasMedicineHistory = (day: number) => {
    if (!day) return false;
    
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    return medicineHistory.some(history => {
      // eatDate는 이미 Date 객체로 변환됨
      const eatDate = history.eatDate;
      return (
        checkDate.getDate() === eatDate.getDate() &&
        checkDate.getMonth() === eatDate.getMonth() &&
        checkDate.getFullYear() === eatDate.getFullYear()
      );
    });
  };

  // 특정 날짜의 복약 기록 개수 확인
  const getMedicineHistoryCount = (day: number) => {
    if (!day) return 0;
    
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    return medicineHistory.filter(history => {
      // eatDate는 이미 Date 객체로 변환됨
      const eatDate = history.eatDate;
      return (
        checkDate.getDate() === eatDate.getDate() &&
        checkDate.getMonth() === eatDate.getMonth() &&
        checkDate.getFullYear() === eatDate.getFullYear()
      );
    }).length;
  };

  const handleDateClick = async (day: number) => {
    setSelectedDate(day);
    
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    // 해당 날짜의 예약 정보 가져오기
    const dayReservations = allReservations.filter(reservation => {
      // Firebase Timestamp인 경우와 Date 객체인 경우 모두 처리
      const reservationDate = reservation.reservationDate.toDate ? reservation.reservationDate.toDate() : reservation.reservationDate;
      return (
        checkDate.getDate() === reservationDate.getDate() &&
        checkDate.getMonth() === reservationDate.getMonth() &&
        checkDate.getFullYear() === reservationDate.getFullYear()
      );
    });
    
    // 해당 날짜의 복약 기록 가져오기
    const dayMedicineHistory = medicineHistory.filter(record => {
      const eatDate = record.eatDate;
      return (
        checkDate.getDate() === eatDate.getDate() &&
        checkDate.getMonth() === eatDate.getMonth() &&
        checkDate.getFullYear() === eatDate.getFullYear()
      );
    });
    
    // 복약 기록에 약물 이름 추가
    const medicineHistoryWithNames = await Promise.all(
      dayMedicineHistory.map(async (record) => {
        const medicine = await FirestoreService.getMedicineById(record.medicineDataId);
        return {
          ...record,
          medicineName: medicine?.name || '알 수 없는 약물'
        };
      })
    );
    
    setSelectedDateReservations(dayReservations);
    setSelectedDateMedicineHistory(medicineHistoryWithNames);
    setSelectedModalDate(checkDate);
    setShowReservationModal(true);
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
  const handleNotificationClick = async () => {
    // 권한 확인 후 알림 기능 실행
    if (hasUserPermission('read')) {
      console.log('알림 클릭됨 - 권한 있음');
      
      try {
        // 최근 알림 3개 가져오기
        const alarms = await getAlarms();
        const recentAlarms = alarms.slice(0, 3);
        
        if (recentAlarms.length > 0) {
          // 알림 리스트 표시
          setAlarmList(recentAlarms);
          setShowAlarmList(true);
          
          // 읽지 않은 알림들을 읽음 처리
          for (const alarm of recentAlarms) {
            if (!alarm.isRead && alarm.id) {
              await markAlarmAsRead(alarm.id);
            }
          }
        } else {
          setAlarmList([]);
          setShowAlarmList(true);
        }
        
        // 알림 개수 업데이트 (읽음 처리 후)
        await updateNotificationCount();
      } catch (error) {
        console.error('알림 조회 실패:', error);
        setAlarmList([]);
        setShowAlarmList(true);
      }
    } else {
      console.log('알림 접근 권한 없음');
      setAlarmList([]);
      setShowAlarmList(true);
    }
  };


  const handleTestReservationNotification = async () => {
    await MessagingService.checkAndSendReservationNotifications();
    // 알림 개수 업데이트
    await updateNotificationCount();
    alert('예약 알림 체크를 실행했습니다. 콘솔을 확인해주세요.');
  };


  // 알림 개수 업데이트
  const updateNotificationCount = async () => {
    try {
      const count = await getUnreadAlarmCount();
      setNotificationCount(count);
    } catch (error) {
      console.error('알림 개수 업데이트 실패:', error);
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
        // 기존 필드들 (호환성을 위해 유지)
        hospitalId: 'temp-hospital-id',
        department: '일반진료',
        doctorName: '의사',
        appointmentDate: combined,
        appointmentTime: appointmentData.appointmentTime,
        patientName: '환자',
        patientPhone: hospital.phone,
        symptoms: appointmentData.notes || '',
        status: 'pending' as const,
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

  // 예약 날짜 포맷팅
  const formatReservationDate = (timestamp: any) => {
    if (!timestamp) return '';
    // Firebase Timestamp인 경우와 Date 객체인 경우 모두 처리
    const date = timestamp.toDate ? timestamp.toDate() : timestamp;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
  };

  // 예약 시간 포맷팅
  const formatReservationTime = (timestamp: any) => {
    if (!timestamp) return '';
    // Firebase Timestamp인 경우와 Date 객체인 경우 모두 처리
    const date = timestamp.toDate ? timestamp.toDate() : timestamp;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 복약 기록 시간 포맷팅
  const formatMedicineTime = (timestamp: any) => {
    if (!timestamp) return '';
    // Firebase Timestamp인 경우와 Date 객체인 경우 모두 처리
    const date = timestamp.toDate ? timestamp.toDate() : timestamp;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}시${minutes}분${seconds}초`;
  };

  // 모달 날짜 포맷팅
  const formatModalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
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
              <IonBadge color="danger" className="home-notification-badge">
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
                  {latestReservation ? (
                    <p className="banner-subtitle">
                      <span className="banner-highlight">{formatReservationDate(latestReservation.reservationDate)}</span>에 <span className="banner-highlight">{latestReservation.hospitalName}</span>이 예약되었어요!
                    </p>
                  ) : (
                    <p className="banner-subtitle">건강 관리를 시작해보세요!</p>
                  )}
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
                            className={`day-number ${isToday(day) ? 'today' : ''} ${selectedDate === day ? 'selected' : ''} ${hasReservation(day) ? 'has-reservation' : ''} ${hasMedicineHistory(day) ? 'has-medicine' : ''}`}
                            onClick={() => handleDateClick(day)}
                          >
                            {day}
                            {hasReservation(day) && <div className="reservation-dot"></div>}
                            {hasMedicineHistory(day) && (
                              <div className="medicine-dots">
                                {Array.from({ length: Math.min(getMedicineHistoryCount(day), 3) }, (_, index) => (
                                  <div key={index} className="medicine-dot"></div>
                                ))}
                                {getMedicineHistoryCount(day) > 3 && (
                                  <div className="medicine-dot more">+</div>
                                )}
                              </div>
                            )}
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
                  <h3 className="service-title medication-title">복약 관리</h3>
                  <p className="service-subtitle">약물 복용을 체계적으로<br />관리하세요</p>
                </div>
                <div className="service-icon">
                  <IonIcon icon={medical} />
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* 병원 예약 푸시 알림 테스트 */}
          <IonCard className="service-card">
            <IonCardContent>
              <div className="service-card-content">
                <div className="service-text">
                  <h3 className="service-title">병원 예약 알림</h3>
                  <p className="service-subtitle">병원 예약 푸시 알림을<br />테스트해보세요</p>
                </div>
                <div className="service-icon">
                  <IonIcon icon={notifications} />
                </div>
              </div>
              <div className="service-actions">
                <IonButton 
                  expand="block" 
                  fill="outline"
                  onClick={handleTestReservationNotification}
                  className="service-button"
                >
                  예약 알림 발송
                </IonButton>
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
                  
                  {/* 예약 상세 바텀 시트 */}
                  <IonModal 
                    isOpen={showReservationModal} 
                    onDidDismiss={() => setShowReservationModal(false)}
                    breakpoints={[0, 0.6]}
                    initialBreakpoint={0.6}
                    handleBehavior="cycle"
                  >
                    <IonContent>
                      <div className="reservation-modal-content">
                        <div className="modal-header">
                          <h2>{selectedModalDate ? formatModalDate(selectedModalDate) : '예약 정보'}</h2>
                          <IonButton 
                            fill="clear" 
                            onClick={() => setShowReservationModal(false)}
                            className="close-button"
                          >
                            <IonIcon icon={chevronBack} />
                          </IonButton>
                        </div>
                        
                        <div className="reservation-list">
                          {selectedDateReservations.map((reservation, index) => (
                            <IonCard key={index} className="reservation-card">
                              <IonCardContent>
                                <div className="reservation-header">
                                  <h3 className="hospital-name">{reservation.hospitalName}</h3>
                                  <div className="reservation-time">
                                    <IonIcon icon={time} />
                                    <span>{formatReservationTime(reservation.reservationDate)}</span>
                                  </div>
                                </div>
                                
                                <div className="reservation-details">
                                  <IonItem lines="none" className="detail-item">
                                    <IonIcon icon={call} slot="start" />
                                    <IonLabel>
                                      <p>{reservation.telNo}</p>
                                    </IonLabel>
                                  </IonItem>
                                  
                                  <IonItem lines="none" className="detail-item">
                                    <IonIcon icon={location} slot="start" />
                                    <IonLabel>
                                      <p>{reservation.address}</p>
                                    </IonLabel>
                                  </IonItem>
                                  
                                  {reservation.memo && (
                                    <div className="memo-section">
                                      <p className="memo-text">{reservation.memo}</p>
                                    </div>
                                  )}
                                </div>
                              </IonCardContent>
                            </IonCard>
                          ))}
                        </div>

                        {/* 복약 기록 섹션 */}
                        {selectedDateMedicineHistory.length > 0 && (
                          <div className="medicine-history-section">
                            <h3 className="section-title">
                              <IonIcon icon={medical} />
                              복약 기록
                            </h3>
                            <div className="medicine-history-list">
                              {selectedDateMedicineHistory.map((record, index) => (
                                <IonCard key={index} className="medicine-record-card">
                                  <IonCardContent>
                                    <div className="medicine-record-header">
                                      <h4 className="medicine-name">{record.medicineName}</h4>
                                      <div className="medicine-time">
                                        <IonIcon icon={time} />
                                        <span>{formatMedicineTime(record.eatDate)}</span>
                                      </div>
                                    </div>
                                  </IonCardContent>
                                </IonCard>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </IonContent>
                  </IonModal>

                  {/* 알림 리스트 */}
                  {showAlarmList && (
                    <div className="alarm-list-container">
                      <div className="alarm-list-header">
                        <span>알림</span>
                        <button 
                          className="close-alarm-btn"
                          onClick={() => setShowAlarmList(false)}
                        >
                          ✕
                        </button>
                      </div>
                      <div className="alarm-list-content">
                        {alarmList.length > 0 ? (
                          alarmList.map((alarm, index) => (
                            <div key={index} className="alarm-item">
                              <div className="alarm-title">[{alarm.title}]</div>
                              <div className="alarm-content">{alarm.content}</div>
                            </div>
                          ))
                        ) : (
                          <div className="no-alarm">알림이 없습니다.</div>
                        )}
                      </div>
                    </div>
                  )}

                </IonPage>
              );
            };

            export default Home;
