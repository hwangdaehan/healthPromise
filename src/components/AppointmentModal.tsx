import React, { useState } from 'react';
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
  IonInput,
  IonDatetime,
  IonTextarea,
} from '@ionic/react';
import { close, calendar, time, medical } from 'ionicons/icons';

export interface AppointmentData {
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalName: string;
  hospitalPhone: string;
  hospitalAddress: string;
  onSave: (data: AppointmentData) => void;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  hospitalName,
  hospitalPhone,
  hospitalAddress,
  onSave
}) => {
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!appointmentDate || !appointmentTime) {
      alert('예약 날짜와 시간을 선택해주세요.');
      return;
    }

    const appointmentData: AppointmentData = {
      appointmentDate,
      appointmentTime,
      notes: notes.trim() || undefined
    };

    onSave(appointmentData);
    
    // 폼 초기화
    setAppointmentDate('');
    setAppointmentTime('');
    setNotes('');
  };

  const handleClose = () => {
    // 폼 초기화
    setAppointmentDate('');
    setAppointmentTime('');
    setNotes('');
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>예약 등록</IonTitle>
          <IonButton fill="clear" slot="end" onClick={handleClose}>
            <IonIcon icon={close} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent>
            <div className="hospital-info">
              <h2>{hospitalName}</h2>
              <p className="hospital-phone">{hospitalPhone}</p>
              <p className="hospital-address">{hospitalAddress}</p>
            </div>

            <div className="appointment-form">
              <IonItem>
                <IonIcon icon={calendar} slot="start" />
                <IonLabel position="stacked">예약 날짜</IonLabel>
                <IonDatetime
                  presentation="date"
                  value={appointmentDate}
                  onIonChange={(e) => setAppointmentDate(e.detail.value as string)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </IonItem>

              <IonItem>
                <IonIcon icon={time} slot="start" />
                <IonLabel position="stacked">예약 시간</IonLabel>
                <IonDatetime
                  presentation="time"
                  value={appointmentTime}
                  onIonChange={(e) => setAppointmentTime(e.detail.value as string)}
                />
              </IonItem>

              <IonItem>
                <IonIcon icon={medical} slot="start" />
                <IonLabel position="stacked">증상 또는 메모 (선택사항)</IonLabel>
                <IonTextarea
                  value={notes}
                  onIonInput={(e) => setNotes(e.detail.value!)}
                  placeholder="증상이나 특이사항을 입력해주세요"
                  rows={3}
                />
              </IonItem>
            </div>

            <div className="appointment-actions">
              <IonButton
                expand="block"
                onClick={handleSave}
                disabled={!appointmentDate || !appointmentTime}
                className="save-button"
              >
                예약 등록하기
              </IonButton>
              
              <IonButton
                expand="block"
                fill="outline"
                onClick={handleClose}
                className="cancel-button"
              >
                취소
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonModal>
  );
};

export default AppointmentModal;
