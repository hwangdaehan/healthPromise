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
} from '@ionic/react';
import { arrowBack, business, call, location, star, starOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import {
  getFavoriteHospitals,
  removeFavoriteHospital,
  FavoriteHospital,
} from '../services/favoriteHospitalService';
import { getCurrentUserSession } from '../services/userService';
import './FavoriteHospitals.css';

const FavoriteHospitals: React.FC = () => {
  const history = useHistory();
  const [favoriteHospitals, setFavoriteHospitals] = useState<FavoriteHospital[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>즐겨찾는 병원</IonTitle>
          <IonButton
            fill="clear"
            onClick={() => history.goBack()}
            className="back-button"
            slot="end"
          >
            <IonIcon icon={arrowBack} />
          </IonButton>
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
                            <IonButton
                              fill="clear"
                              onClick={() => handleRemoveFavorite(hospital.id!)}
                              className="favorite-button"
                            >
                              <IonIcon icon={star} color="warning" />
                            </IonButton>
                            {hospital.phoneNumber && (
                              <IonButton
                                fill="solid"
                                color="primary"
                                onClick={() => handleCallHospital(hospital.phoneNumber!)}
                                className="call-button"
                              >
                                <IonIcon icon={call} slot="start" />
                                전화
                              </IonButton>
                            )}
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
      </IonContent>
    </IonPage>
  );
};

export default FavoriteHospitals;
