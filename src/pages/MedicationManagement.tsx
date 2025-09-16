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
  });

  const frequencies = [
    { value: 'once', label: '하루 1회' },
    { value: 'twice', label: '하루 2회' },
    { value: 'three', label: '하루 3회' },
    { value: 'four', label: '하루 4회' },
  ];

  const timeOptions = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00',
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
      <IonContent className="ion-padding">
        <div className="back-button-container">
          <IonButton 
            fill="clear" 
            onClick={() => history.goBack()}
            className="back-button"
          >
            <IonIcon icon={arrowBack} slot="start" />
            뒤로가기
          </IonButton>
        </div>
        
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>새 약물 등록</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem>
                <IonLabel position="stacked">약물 이름</IonLabel>
                <IonInput
                  placeholder="약물 이름을 입력하세요"
                  value={newMedication.name}
                  onIonInput={(e) => setNewMedication(prev => ({ ...prev, name: e.detail.value! }))}
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">복용량</IonLabel>
                <IonInput
                  placeholder="예: 1정, 2캡슐"
                  value={newMedication.dosage}
                  onIonInput={(e) => setNewMedication(prev => ({ ...prev, dosage: e.detail.value! }))}
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">복용 횟수</IonLabel>
                <IonSelect
                  value={newMedication.frequency}
                  placeholder="복용 횟수를 선택하세요"
                  onIonChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.detail.value }))}
                >
                  {frequencies.map(freq => (
                    <IonSelectOption key={freq.value} value={freq.value}>
                      {freq.label}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">복용 시간</IonLabel>
                <div className="time-chips">
                  {timeOptions.map(time => (
                    <IonChip
                      key={time}
                      color={newMedication.times.includes(time) ? 'primary' : 'medium'}
                      onClick={() => {
                        const times = newMedication.times.includes(time)
                          ? newMedication.times.filter(t => t !== time)
                          : [...newMedication.times, time];
                        setNewMedication(prev => ({ ...prev, times }));
                      }}
                    >
                      {time}
                    </IonChip>
                  ))}
                </div>
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">복용 기간 (시작일)</IonLabel>
                <IonDatetime
                  presentation="date"
                  value={newMedication.startDate}
                  onIonChange={(e) => setNewMedication(prev => ({ ...prev, startDate: e.detail.value as string }))}
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">복용 기간 (종료일)</IonLabel>
                <IonDatetime
                  presentation="date"
                  value={newMedication.endDate}
                  onIonChange={(e) => setNewMedication(prev => ({ ...prev, endDate: e.detail.value as string }))}
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">메모 (선택사항)</IonLabel>
                <IonInput
                  placeholder="복용 시 주의사항 등"
                  value={newMedication.notes}
                  onIonInput={(e) => setNewMedication(prev => ({ ...prev, notes: e.detail.value! }))}
                />
              </IonItem>
            </IonList>

            <IonButton
              expand="block"
              onClick={addMedication}
              disabled={!newMedication.name || !newMedication.dosage || !newMedication.frequency || newMedication.times.length === 0}
              className="add-button"
            >
              <IonIcon icon={medical} slot="start" />
              약물 등록
            </IonButton>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>오늘의 복약</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {medications.length === 0 ? (
              <p className="no-data">등록된 약물이 없습니다.</p>
            ) : (
              <IonList>
                {medications.map((medication) => (
                  <IonItem key={medication.id}>
                    <IonLabel>
                      <h2>{medication.name}</h2>
                      <h3>{medication.dosage}</h3>
                      <div className="medication-times">
                        {medication.times.map(time => (
                          <IonButton
                            key={time}
                            fill={isMedicationTaken(medication.id, time) ? 'solid' : 'outline'}
                            color={isMedicationTaken(medication.id, time) ? 'success' : 'primary'}
                            size="small"
                            onClick={() => toggleMedicationTaken(medication.id, time)}
                            className="time-button"
                          >
                            <IonIcon 
                              icon={isMedicationTaken(medication.id, time) ? checkmarkCircle : time} 
                              slot="start" 
                            />
                            {time}
                          </IonButton>
                        ))}
                      </div>
                      {medication.notes && (
                        <p className="notes">메모: {medication.notes}</p>
                      )}
                    </IonLabel>
                    <IonButton
                      slot="end"
                      fill="clear"
                      color="danger"
                      onClick={() => deleteMedication(medication.id)}
                    >
                      삭제
                    </IonButton>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default MedicationManagement;
