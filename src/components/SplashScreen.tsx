import React, { useEffect, useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import './SplashScreen.css';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // 애니메이션 완료 후 콜백 호출
      setTimeout(() => {
        onFinish();
      }, 500); // 페이드아웃 애니메이션 시간
    }, 2000); // 2초 후 시작

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <IonPage className={`splash-screen ${isVisible ? 'visible' : 'fade-out'}`}>
      <IonContent className="splash-content">
        <div className="splash-container">
          <img 
            src="/main_logo.svg" 
            alt="건강약속 로고" 
            className="logo-image"
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SplashScreen;
