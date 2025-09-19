import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonDatetime,
  IonSelect,
  IonSelectOption,
  IonList,
  IonIcon,
  IonChip,
  IonHeader,
  IonToolbar,
  IonTitle,
} from '@ionic/react';
import { medical, time, checkmarkCircle, closeCircle, arrowBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './MedicationManagement.css';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: string;
  endDate: string;
  notes: string;
  notifications: boolean;
}

interface MedicationRecord {
  id: string;
  medicationId: string;
  medicationName: string;
  date: string;
  time: string;
  taken: boolean;
}

const MedicationManagement: React.FC = () => {
  const history = useHistory();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [records, setRecords] = useState<MedicationRecord[]>([]);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    times: [] as string[],
    startDate: '',
    endDate: '',
    notes: '',
    notifications: true, // 알림받기 여부 (기본값: true)
  });

  const frequencies = [
    { value: 'once', label: '하루 1회' },
    { value: 'twice', label: '하루 2회' },
    { value: 'three', label: '하루 3회' },
    { value: 'four', label: '하루 4회' },
  ];

  const timeOptions = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', 
    '20:00', '21:00', '22:00', '23:00', '00:00'
  ];

  const addMedication = () => {
    if (!newMedication.name || !newMedication.dosage || !newMedication.frequency || newMedication.times.length === 0) {
      return;
    }

    const medication: Medication = {
      id: Date.now().toString(),
      ...newMedication,
    };

    setMedications(prev => [medication, ...prev]);
    setNewMedication({
      name: '',
      dosage: '',
      frequency: '',
      times: [],
      startDate: '',
      endDate: '',
      notes: '',
    });
  };

  const deleteMedication = (id: string) => {
    setMedications(prev => prev.filter(item => item.id !== id));
    setRecords(prev => prev.filter(record => record.medicationId !== id));
  };

  const toggleMedicationTaken = (medicationId: string, time: string) => {
    const today = new Date().toISOString().split('T')[0];
    const recordId = `${medicationId}-${today}-${time}`;
    
    const existingRecord = records.find(r => r.id === recordId);
    
    if (existingRecord) {
      setRecords(prev => prev.map(r => 
        r.id === recordId ? { ...r, taken: !r.taken } : r
      ));
    } else {
      const medication = medications.find(m => m.id === medicationId);
      if (medication) {
        const newRecord: MedicationRecord = {
          id: recordId,
          medicationId,
          medicationName: medication.name,
          date: today,
          time,
          taken: true,
        };
        setRecords(prev => [...prev, newRecord]);
      }
    }
  };

  const isMedicationTaken = (medicationId: string, time: string) => {
    const today = new Date().toISOString().split('T')[0];
    const recordId = `${medicationId}-${today}-${time}`;
    const record = records.find(r => r.id === recordId);
    return record ? record.taken : false;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>건강 약속</IonTitle>
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
        
        <IonCard className="simple-medication-card">
          <IonCardHeader>
            <IonCardTitle className="large-title">💊 약물 등록</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="simple-form">
              <div className="form-group">
                <label className="large-label">약물 이름</label>
                <IonInput
                  placeholder="예: 아스피린"
                  value={newMedication.name}
                  onIonInput={(e) => setNewMedication(prev => ({ ...prev, name: e.detail.value! }))}
                  className="large-input"
                />
              </div>

              <div className="form-group">
                <label className="large-label">복용량</label>
                <IonInput
                  placeholder="예: 1정"
                  value={newMedication.dosage}
                  onIonInput={(e) => setNewMedication(prev => ({ ...prev, dosage: e.detail.value! }))}
                  className="large-input"
                />
              </div>

              <div className="form-group">
                <label className="large-label">복용 시간</label>
                <div className="time-buttons">
                  {timeOptions.map(time => (
                    <button
                      key={time}
                      className={`time-button ${newMedication.times.includes(time) ? 'selected' : ''}`}
                      onClick={() => {
                        const times = newMedication.times.includes(time)
                          ? newMedication.times.filter(t => t !== time)
                          : [...newMedication.times, time];
                        setNewMedication(prev => ({ ...prev, times }));
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <div className="notification-checkbox">
                  <input
                    type="checkbox"
                    id="notifications"
                    checked={newMedication.notifications}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, notifications: e.target.checked }))}
                    className="checkbox-input"
                  />
                  <label htmlFor="notifications" className="checkbox-label">
                    🔔 복용 시간에 알림받기
                  </label>
                </div>
              </div>
            </div>

            <IonButton
              expand="block"
              onClick={addMedication}
              disabled={!newMedication.name || !newMedication.dosage || newMedication.times.length === 0}
              className="large-add-button"
            >
              <IonIcon icon={medical} slot="start" />
              약물 등록하기
            </IonButton>
          </IonCardContent>
        </IonCard>

      </IonContent>
    </IonPage>
  );
};

export default MedicationManagement;
