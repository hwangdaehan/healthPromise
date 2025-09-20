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
  IonGrid,
  IonRow,
  IonCol,
  IonDatetimeButton,
  IonPopover,
} from '@ionic/react';
import { close, calendar, time, medical, location, call } from 'ionicons/icons';
import './AppointmentModal.css';

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
    <IonModal isOpen={isOpen} onDidDismiss={handleClose} className="appointment-modal">
      <IonHeader className="appointment-header">
        <IonToolbar>
          <IonTitle className="appointment-title">예약 등록</IonTitle>
          <IonButton fill="clear" slot="end" onClick={handleClose} className="close-btn">
            <IonIcon icon={close} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="appointment-content">
        {/* 병원 정보 카드 */}
        <IonCard className="hospital-info-card">
          <IonCardContent>
            <div className="hospital-header">
              <IonIcon icon={medical} className="hospital-icon" />
              <h2 className="hospital-name">{hospitalName}</h2>
            </div>
            
            <div className="hospital-details">
              <div className="hospital-detail-item">
                <IonIcon icon={call} className="detail-icon" />
                <span className="detail-text">{hospitalPhone}</span>
              </div>
              <div className="hospital-detail-item">
                <IonIcon icon={location} className="detail-icon" />
                <span className="detail-text">{hospitalAddress}</span>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* 예약 폼 */}
        <IonCard className="appointment-form-card">
          <IonCardContent>
            <h3 className="form-title">예약 정보</h3>
            
            {/* 날짜/시간 선택 */}
            <div className="datetime-sections">
              <div className="datetime-section">
                <IonIcon icon={calendar} className="section-icon" />
                <IonLabel className="section-label">예약 날짜</IonLabel>
                <input 
                  type="date"
                  className="datetime-input"
                  min={new Date().toISOString().split('T')[0]}
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                />
              </div>
              
              <div className="datetime-section">
                <IonIcon icon={time} className="section-icon" />
                <IonLabel className="section-label">예약 시간</IonLabel>
                <input 
                  type="time"
                  className="datetime-input"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                />
              </div>
            </div>

            {/* 메모 섹션 */}
            <div className="notes-section">
              <IonIcon icon={medical} className="section-icon" />
              <IonLabel className="section-label">증상 또는 메모 (선택사항)</IonLabel>
              <IonTextarea
                value={notes}
                onIonInput={(e) => setNotes(e.detail.value!)}
                placeholder="증상이나 특이사항을 입력해주세요"
                rows={3}
                className="notes-textarea"
              />
            </div>
          </IonCardContent>
        </IonCard>

        {/* 액션 버튼들 */}
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
      </IonContent>
    </IonModal>
  );
};

export default AppointmentModal;
