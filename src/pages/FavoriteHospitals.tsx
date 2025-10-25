import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonModal,
  IonItem,
  IonLabel,
  IonInput,
  IonDatetime,
  IonTextarea,
} from '@ionic/react';
import { arrowBack, business, call, location, star, calendar, close } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import {
  getFavoriteHospitals,
  removeFavoriteHospital,
  FavoriteHospital,
} from '../services/favoriteHospitalService';
import { getCurrentUserSession } from '../services/userService';
import { addReservation } from '../services/reservationService';
import './FavoriteHospitals.css';

const FavoriteHospitals: React.FC = () => {
  const history = useHistory();
  const [favoriteHospitals, setFavoriteHospitals] = useState<FavoriteHospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<FavoriteHospital | null>(null);
  const [appointmentData, setAppointmentData] = useState({
    date: '',
    time: '',
    notes: ''
  });

  useEffect(() => {
    loadFavoriteHospitals();
  }, []);

  const loadFavoriteHospitals = async () => {
    try {
      setLoading(true);
      const userSession = await getCurrentUserSession();
      let userId = null;

      if (userSession && userSession.isAuthenticated) {
        userId = userSession.user?.uid;
      } else {
        const savedUserInfo = localStorage.getItem('userInfo');
        if (savedUserInfo) {
          try {
            const userInfo = JSON.parse(savedUserInfo);
            userId = userInfo.uid || userInfo.id;
          } catch (error) {
            console.log('localStorage 사용자 정보 파싱 실패:', error);
          }
        }
      }

      const favorites = await getFavoriteHospitals(userId);
      setFavoriteHospitals(favorites);
    } catch (error) {
      console.error('즐겨찾기 병원 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (hospitalId: string) => {
    try {
      await removeFavoriteHospital(hospitalId);
      setFavoriteHospitals(prev => prev.filter(h => h.id !== hospitalId));
    } catch (error) {
      console.error('즐겨찾기 해제 실패:', error);
    }
  };

  const handleCallHospital = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleScheduleAppointment = (hospital: FavoriteHospital) => {
    setSelectedHospital(hospital);
    setShowAppointmentModal(true);
  };

  const handleSaveAppointment = async () => {
    try {
      // IonDatetime에서 받은 ISO 문자열을 파싱
      const dateStr = appointmentData.date.split('T')[0]; // YYYY-MM-DD 부분만 추출
      const timeStr = appointmentData.time.split('T')[1]; // HH:MM:SS 부분만 추출
      
      const combined = new Date(`${dateStr}T${timeStr}`);
      
      // Date 객체 유효성 검사
      if (isNaN(combined.getTime())) {
        throw new Error('잘못된 날짜 형식입니다. 날짜와 시간을 다시 선택해주세요.');
      }

      if (!selectedHospital) {
        throw new Error('병원 정보가 없습니다.');
      }

      const id = await addReservation({
        address: selectedHospital.address || '',
        hospitalName: selectedHospital.name || '',
        memo: appointmentData.notes || '',
        reservationDate: combined,
        telNo: selectedHospital.phoneNumber || '',
        // 기존 필드들 (호환성을 위해 유지)
        hospitalId: 'temp-hospital-id',
        department: '일반진료',
        doctorName: '의사',
        appointmentDate: combined,
        appointmentTime: appointmentData.time,
        patientName: '환자',
        patientPhone: selectedHospital.phoneNumber || '',
        symptoms: appointmentData.notes || '',
        status: 'pending' as const,
      });
      console.log('예약 저장 완료 ID:', id);
      alert('예약이 등록되었습니다!');
      setShowAppointmentModal(false);
      setAppointmentData({
        date: '',
        time: '',
        notes: ''
      });
    } catch (err) {
      console.error('예약 저장 실패:', err);
      alert('예약 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleCloseModal = () => {
    setShowAppointmentModal(false);
    setSelectedHospital(null);
    setAppointmentData({
      date: '',
      time: '',
      notes: ''
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButton
            fill="clear"
            onClick={() => history.goBack()}
            className="back-button"
            slot="start"
          >
            <IonIcon icon={arrowBack} />
          </IonButton>
          <IonTitle>내가 등록한 병원</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="favorite-hospitals-container">
          {loading ? (
            <div className="loading-container">
              <p>로딩 중...</p>
            </div>
          ) : favoriteHospitals.length > 0 ? (
            <IonGrid>
              <IonRow>
                {favoriteHospitals.map(hospital => (
                  <IonCol size="12" key={hospital.id}>
                    <IonCard className="hospital-card">
                      <IonCardContent>
                        <div className="hospital-header">
                          <div className="hospital-info">
                            <h3 className="hospital-name">{hospital.name}</h3>
                            <p className="hospital-address">
                              <IonIcon icon={location} />
                              {hospital.address}
                            </p>
                            {hospital.phoneNumber && (
                              <p className="hospital-phone">
                                <IonIcon icon={call} />
                                {hospital.phoneNumber}
                              </p>
                            )}
                          </div>
                          <div className="hospital-actions">
                            <button
                              onClick={() => handleRemoveFavorite(hospital.id!)}
                              className="favorite-button"
                            >
                              <IonIcon icon={star} />
                              병원 삭제
                            </button>
                            {hospital.phoneNumber && (
                              <button
                                onClick={() => handleCallHospital(hospital.phoneNumber!)}
                                className="call-button"
                              >
                                <IonIcon icon={call} />
                                전화
                              </button>
                            )}
                            <button
                              onClick={() => handleScheduleAppointment(hospital)}
                              className="schedule-button"
                            >
                              <IonIcon icon={calendar} />
                              일정등록
                            </button>
                          </div>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          ) : (
            <div className="empty-state">
              <IonIcon icon={business} className="empty-icon" />
              <h3>즐겨찾는 병원이 없습니다</h3>
              <p>병원 예약에서 즐겨찾기를 등록해보세요!</p>
              <IonButton
                fill="solid"
                color="primary"
                onClick={() => history.push('/hospital')}
                className="go-to-hospital-button"
              >
                병원 예약하러 가기
              </IonButton>
            </div>
          )}
        </div>

        {/* 예약 모달 */}
        <IonModal isOpen={showAppointmentModal} onDidDismiss={handleCloseModal}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>병원 예약 등록</IonTitle>
              <IonButton
                fill="clear"
                onClick={handleCloseModal}
                slot="end"
              >
                <IonIcon icon={close} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedHospital && (
              <div className="appointment-form">
                <div className="hospital-info-header">
                  <h3>{selectedHospital.name}</h3>
                  <p>{selectedHospital.address}</p>
                </div>

                <IonItem>
                  <IonLabel position="stacked">예약 날짜</IonLabel>
                  <IonDatetime
                    presentation="date"
                    value={appointmentData.date}
                    onIonChange={e => setAppointmentData(prev => ({ ...prev, date: e.detail.value as string }))}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">예약 시간</IonLabel>
                  <IonDatetime
                    presentation="time"
                    value={appointmentData.time}
                    onIonChange={e => setAppointmentData(prev => ({ ...prev, time: e.detail.value as string }))}
                  />
                </IonItem>


                <IonItem>
                  <IonLabel position="stacked">메모</IonLabel>
                  <IonTextarea
                    value={appointmentData.notes}
                    onIonInput={e => setAppointmentData(prev => ({ ...prev, notes: e.detail.value! }))}
                    placeholder="추가 메모 (선택사항)"
                    rows={2}
                  />
                </IonItem>

                <div className="appointment-actions">
                  <IonButton
                    expand="block"
                    onClick={handleSaveAppointment}
                    disabled={!appointmentData.date || !appointmentData.time}
                  >
                    예약 등록하기
                  </IonButton>
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={handleCloseModal}
                  >
                    취소
                  </IonButton>
                </div>
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default FavoriteHospitals;
