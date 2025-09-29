import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonChip,
} from '@ionic/react';
import { close, location, call, star, starOutline } from 'ionicons/icons';
import { FavoriteHospital } from '../services/favoriteHospitalService';

interface HospitalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: FavoriteHospital | null;
  onToggleFavorite: (hospital: FavoriteHospital) => void;
  isFavorite: boolean;
}

const HospitalDetailModal: React.FC<HospitalDetailModalProps> = ({
  isOpen,
  onClose,
  hospital,
  onToggleFavorite,
  isFavorite,
}) => {
  if (!hospital) return null;

  const handleToggleFavorite = () => {
    onToggleFavorite(hospital);
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    // 숫자만 추출
    const numbers = phoneNumber.replace(/\D/g, '');

    // 02로 시작하는 서울 지역번호 (10자리)
    if (numbers.startsWith('02') && numbers.length === 10) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }
    // 02로 시작하는 서울 지역번호 (9자리)
    else if (numbers.startsWith('02') && numbers.length === 9) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`;
    }
    // 일반 지역번호 (11자리)
    else if (numbers.length === 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    }
    // 일반 지역번호 (10자리)
    else if (numbers.length === 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    }
    // 그 외의 경우 원본 반환
    return phoneNumber;
  };

  const handleCall = () => {
    if (hospital.phoneNumber || hospital.telNo) {
      const phoneNumber = (hospital.phoneNumber || hospital.telNo || '').replace(/[^0-9]/g, '');
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>병원 상세</IonTitle>
          <IonButton fill="clear" slot="end" onClick={onClose}>
            <IonIcon icon={close} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <style>{`
          ion-item ion-icon {
            font-size: 26px !important;
            color: #3b82f6 !important;
          }
          
          ion-item ion-label h3 {
            font-size: 23px !important;
            font-weight: 600 !important;
            color: #374151 !important;
            margin: 0 0 8px 0 !important;
          }
          
          ion-item ion-label p {
            font-size: 21px !important;
            color: #6b7280 !important;
            margin: 0 !important;
            line-height: 1.5 !important;
          }
          
          .favorite-button {
            --border-color: transparent !important;
            --border-width: 0 !important;
            --border-style: none !important;
          }
          
          .call-button {
            --border-color: transparent !important;
            --border-width: 0 !important;
            --border-style: none !important;
          }
          
          .hospital-detail-header h2 {
            font-size: 30px !important;
            font-weight: 500 !important;
            color: #1e293b !important;
            margin: 0 !important;
          }
        `}</style>
        <IonCard>
          <IonCardContent>
            <div className="hospital-detail-header">
              <h2>{hospital.hospitalName || hospital.name}</h2>
            </div>

            <div className="hospital-details">
              <IonItem lines="none">
                <IonIcon icon={location} slot="start" />
                <IonLabel>
                  <h3>주소</h3>
                  <p>{hospital.address}</p>
                </IonLabel>
              </IonItem>

              {(hospital.phoneNumber || hospital.telNo) && (
                <IonItem lines="none">
                  <IonIcon icon={call} slot="start" />
                  <IonLabel>
                    <h3>전화번호</h3>
                    <p>{formatPhoneNumber(hospital.phoneNumber || hospital.telNo || '')}</p>
                  </IonLabel>
                </IonItem>
              )}

              {hospital.specialties && hospital.specialties.length > 0 && (
                <IonItem lines="none">
                  <IonLabel>
                    <h3>진료과목</h3>
                    <div className="specialties-chips">
                      {hospital.specialties.map((specialty, index) => (
                        <IonChip key={index} color="primary">
                          {specialty}
                        </IonChip>
                      ))}
                    </div>
                  </IonLabel>
                </IonItem>
              )}
            </div>

            <div className="hospital-actions">
              <IonButton fill="outline" onClick={handleToggleFavorite} className="favorite-button">
                <IonIcon icon={isFavorite ? star : starOutline} slot="start" />
                {isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              </IonButton>

              {(hospital.phoneNumber || hospital.telNo) && (
                <IonButton fill="clear" onClick={handleCall} className="call-button">
                  <IonIcon icon={call} slot="start" />
                  전화걸기
                </IonButton>
              )}
            </div>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonModal>
  );
};

export default HospitalDetailModal;
