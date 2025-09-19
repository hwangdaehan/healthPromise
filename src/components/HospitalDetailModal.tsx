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
  isFavorite
}) => {
  if (!hospital) return null;

  const handleToggleFavorite = () => {
    onToggleFavorite(hospital);
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
          <IonTitle>{hospital.hospitalName || hospital.name}</IonTitle>
          <IonButton fill="clear" slot="end" onClick={onClose}>
            <IonIcon icon={close} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent>
            <div className="hospital-detail-header">
              <h2>{hospital.hospitalName || hospital.name}</h2>
              <IonButton
                fill="outline"
                onClick={handleToggleFavorite}
                className="favorite-button"
              >
                <IonIcon icon={isFavorite ? star : starOutline} slot="start" />
                {isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              </IonButton>
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
                    <p>{hospital.phoneNumber || hospital.telNo}</p>
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
              {(hospital.phoneNumber || hospital.telNo) && (
                <IonButton
                  expand="block"
                  onClick={handleCall}
                  className="call-button"
                >
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
