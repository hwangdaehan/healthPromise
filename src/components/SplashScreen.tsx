import React, { useEffect, useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import './SplashScreen.css';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const showDurationMs = 1500; // static show
    const fadeDurationMs = 500;  // fade-out

    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, showDurationMs);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, showDurationMs + fadeDurationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <IonPage className={`splash-screen ${isFading ? 'fade-out' : ''}`}>
      <IonContent className="splash-content">
        <div className="splash-container">
          <img 
            src="/splash.svg" 
            alt="건강약속 스플래시" 
            className="logo-image"
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SplashScreen;
