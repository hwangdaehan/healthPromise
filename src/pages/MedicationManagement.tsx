import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonButton,
  IonCard,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonList,
  IonIcon,
  IonChip,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonModal,
  IonSpinner,
  IonAlert,
} from '@ionic/react';
import { medical, time, checkmarkCircle, closeCircle, arrowBack, add, trash, notifications, notificationsOff, close } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { FirestoreService, Medicine } from '../services/firestoreService';
import { getCurrentUserSession } from '../services/userService';
import { getMedicineHistory, addMedicineHistory } from '../services/medicineHistoryService';
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMedicineRecordModal, setShowMedicineRecordModal] = useState(false);
  const [showRecordBottomSheet, setShowRecordBottomSheet] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
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

  // 사용자 ID 가져오기 (Home과 동일한 방식)
  const getUserId = async (): Promise<string> => {
    try {
      const userSession = await getCurrentUserSession();
      
      if (userSession && userSession.user) {
        return userSession.user.uid;
      }
    } catch (error) {
      console.log('사용자 세션 확인 실패:', error);
    }
    
    return '';
  };

  // 컴포넌트 마운트 시 기존 약물 데이터 불러오기
  useEffect(() => {
    const loadMedications = async () => {
      try {
        const userId = await getUserId();
        
        if (!userId) {
          return;
        }
        
        const medicines = await FirestoreService.getMedicinesByUserId(userId);
        
        // Firestore 데이터를 로컬 Medication 형식으로 변환
        const convertedMedications: Medication[] = medicines.map(medicine => ({
          id: medicine.dataId || '',
          name: medicine.name,
          dosage: medicine.quantity,
          frequency: 'custom', // Firestore에는 frequency가 없으므로 기본값 설정
          times: medicine.times.map(time => `${time}:00`), // "08" -> "08:00" 형식으로 변환
          startDate: '',
          endDate: '',
          notes: '',
          notifications: medicine.isNoti,
        }));
        
        setMedications(convertedMedications);
      } catch (error) {
        console.error('약물 데이터 불러오기 중 오류 발생:', error);
        alert('약물 데이터를 불러오는 중 오류가 발생했습니다: ' + error);
      }
    };

    loadMedications();
  }, []);

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

  const addMedication = async () => {
    if (!newMedication.name || !newMedication.dosage || !newMedication.frequency || newMedication.times.length === 0) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    try {
      const userId = await getUserId();
      
      if (!userId) {
        alert('사용자 정보가 없습니다. 다시 로그인해주세요.');
        return;
      }
      
      // 복용 시간을 "08", "15", "23" 형식으로 변환
      const timesFormatted = newMedication.times.map(time => {
        const hour = time.split(':')[0];
        return hour.padStart(2, '0');
      });

      const medicineData: Omit<Medicine, 'dataId'> = {
        name: newMedication.name,
        quantity: newMedication.dosage,
        times: timesFormatted,
        isNoti: newMedication.notifications,
        userId: userId,
      };

      const dataId = await FirestoreService.addMedicine(medicineData);
      
      // 로컬 상태도 업데이트
      const medication: Medication = {
        id: dataId,
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
        notifications: true,
      });

      setShowAddModal(false);
      alert('약물이 성공적으로 등록되었습니다!');
    } catch (error) {
      console.error('약물 등록 중 오류 발생:', error);
      alert('약물 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const deleteMedication = async (id: string) => {
    try {
      await FirestoreService.deleteMedicine(id);
      setMedications(prev => prev.filter(item => item.id !== id));
      setRecords(prev => prev.filter(record => record.medicationId !== id));
      alert('약물이 삭제되었습니다.');
    } catch (error) {
      console.error('약물 삭제 중 오류 발생:', error);
      alert('약물 삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
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

  // 복용 기록 바텀 시트 열기
  const openRecordBottomSheet = (medication: Medication) => {
    setSelectedMedication(medication);
    setRecordError(null);
    setShowRecordBottomSheet(true);
  };

  // 복용 기록 저장 (현재 시간으로 자동 저장)
  const saveRecord = async () => {
    if (!selectedMedication) return;

    setRecordLoading(true);
    setRecordError(null);

    try {
      const userId = await getUserId();
      if (!userId) {
        setRecordError('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      // 현재 시간으로 자동 저장
      const currentDateTime = new Date();

      await addMedicineHistory({
        medicineDataId: selectedMedication.id,
        eatDate: currentDateTime,
        regDate: new Date(),
        userId: userId,
        dataId: '', // Firestore에서 자동 생성
      });

      setShowRecordBottomSheet(false);
      alert('복용 기록이 저장되었습니다!');
    } catch (err) {
      console.error('복용 기록 저장 실패:', err);
      setRecordError('복용 기록 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setRecordLoading(false);
    }
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
        
        {/* 복약 등록 버튼 */}
        <IonButton
          expand="block"
          onClick={() => setShowAddModal(true)}
          className="add-medication-button"
        >
          <IonIcon icon={add} slot="start" />
          복약 등록하기
        </IonButton>


        {/* 등록된 복약 목록 */}
        <div className="medications-list">
          {medications.length === 0 ? (
            <div className="empty-state">
              <IonIcon icon={medical} className="empty-icon" />
              <p>등록된 복약이 없습니다.</p>
              <p>위의 버튼을 눌러 복약을 등록해보세요.</p>
            </div>
          ) : (
            medications.map((medication) => (
              <IonCard key={medication.id} className="medication-card">
                {/* 상단 이미지 영역 */}
                <div className="medication-image-area">
                  <IonIcon icon={medical} className="medication-icon" />
                  <div className={`notification-badge ${medication.notifications ? 'enabled' : 'disabled'}`}>
                    <IonIcon icon={medication.notifications ? notifications : notificationsOff} />
                  </div>
                </div>

                {/* 중앙 텍스트 정보 영역 */}
                <div className="medication-content">
                  <div className="medication-label">복약</div>
                  <div className="medication-title-row">
                    <h3 className="medication-name">{medication.name}</h3>
                    <div className="medication-dosage-badge">
                      1회 <span className="dosage-number">{medication.dosage}</span>정
                    </div>
                  </div>
                  
                  <div className="medication-times">
                    <div className="times-label">복용 시간</div>
                    <div className="times-chips">
                      {medication.times.map((time, index) => (
                        <IonChip key={index} className="time-chip">
                          {time}
                        </IonChip>
                      ))}
                    </div>
                  </div>

                  {/* 하단 액션 버튼 영역 */}
                  <div className="medication-actions">
                    <IonButton
                      fill="outline"
                      className="action-button secondary"
                      onClick={() => openRecordBottomSheet(medication)}
                    >
                      복용 기록
                    </IonButton>
                    <IonButton
                      fill="solid"
                      className="action-button primary"
                      onClick={() => deleteMedication(medication.id)}
                    >
                      <IonIcon icon={trash} slot="start" />
                      삭제
                    </IonButton>
                  </div>
                </div>
              </IonCard>
            ))
          )}
        </div>

        {/* 약물 등록 모달 */}
        <IonModal isOpen={showAddModal} onDidDismiss={() => setShowAddModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>복약 등록</IonTitle>
              <IonButton 
                fill="clear" 
                onClick={() => setShowAddModal(false)}
                slot="end"
              >
                닫기
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div className="modal-form">
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

              <IonButton
                expand="block"
                onClick={addMedication}
                disabled={!newMedication.name || !newMedication.dosage || newMedication.times.length === 0}
                className="large-add-button"
              >
                <IonIcon icon={medical} slot="start" />
                약물 등록하기
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* 복용 기록 등록 모달 */}
        <IonModal 
          isOpen={showRecordBottomSheet} 
          onDidDismiss={() => setShowRecordBottomSheet(false)}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>복용 기록 등록</IonTitle>
              <IonButton 
                fill="clear" 
                onClick={() => setShowRecordBottomSheet(false)}
                slot="end"
              >
                <IonIcon icon={close} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedMedication && (
              <div className="simple-record-form">
                <div className="medication-info">
                  <IonIcon icon={medical} className="medication-icon-large" />
                  <h2>{selectedMedication.name}</h2>
                  <p className="dosage-info">1회 {selectedMedication.dosage}정</p>
                </div>

                <div className="circular-button-container">
                  <IonButton
                    className="circular-record-button"
                    onClick={saveRecord}
                    disabled={recordLoading}
                    fill="clear"
                  >
                    {recordLoading ? (
                      <IonSpinner name="crescent" />
                    ) : (
                      <IonIcon icon={checkmarkCircle} />
                    )}
                  </IonButton>
                  <p className="button-label">눌러서 복용완료!</p>
                </div>

                <IonAlert
                  isOpen={!!recordError}
                  onDidDismiss={() => setRecordError(null)}
                  header="오류"
                  message={recordError || ''}
                  buttons={['확인']}
                />
              </div>
            )}
          </IonContent>
        </IonModal>

      </IonContent>
    </IonPage>
  );
};

export default MedicationManagement;
