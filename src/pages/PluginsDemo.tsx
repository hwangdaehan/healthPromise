import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonAlert,
  IonIcon,
} from '@ionic/react';
import { camera, notifications, call } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Browser } from '@capacitor/browser';
import './PluginsDemo.css';

const PluginsDemo: React.FC = () => {
  const [cameraResult, setCameraResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const takePicture = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      setCameraResult(image.webPath || '');
    } catch (err) {
      setError('Failed to take picture');
    }
  };

  const scheduleNotification = async () => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Health Promise',
            body: 'This is a test notification from your app!',
            id: 1,
            schedule: { at: new Date(Date.now() + 1000) },
          },
        ],
      });
    } catch (err) {
      setError('Failed to schedule notification');
    }
  };

  const openBrowser = async () => {
    try {
      await Browser.open({ url: 'tel:+1234567890' });
    } catch (err) {
      setError('Failed to open browser');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Capacitor Plugins Demo</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Camera Plugin</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonButton expand="block" onClick={takePicture}>
              <IonIcon icon={camera} slot="start" />
              Take Picture
            </IonButton>
            {cameraResult && (
              <div className="camera-result">
                <img src={cameraResult} alt="Camera result" />
              </div>
            )}
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Local Notifications</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonButton expand="block" onClick={scheduleNotification}>
              <IonIcon icon={notifications} slot="start" />
              Schedule Test Notification
            </IonButton>
            <p>This will show a notification in 1 second.</p>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Browser Plugin</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonButton expand="block" onClick={openBrowser}>
              <IonIcon icon={call} slot="start" />
              Test Phone Call (tel:)
            </IonButton>
            <p>This will attempt to open the phone dialer.</p>
          </IonCardContent>
        </IonCard>

        <IonAlert
          isOpen={!!error}
          onDidDismiss={() => setError(null)}
          header="Error"
          message={error || ''}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default PluginsDemo;
