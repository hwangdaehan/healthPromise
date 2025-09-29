import React, { useEffect, useState } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { AdMobService } from '../services/admobService';
import './AdBanner.css';

interface AdBannerProps {
  onClose?: () => void;
}

const AdBanner: React.FC<AdBannerProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    const initializeAd = async () => {
      try {
        await AdMobService.initialize();
        await AdMobService.showBannerAd();
        setIsAdLoaded(true);
      } catch (error) {
        console.error('광고 초기화 실패:', error);
      }
    };

    initializeAd();

    // 컴포넌트 언마운트시 광고 제거
    return () => {
      AdMobService.hideBannerAd();
    };
  }, []);

  const handleClose = async () => {
    try {
      await AdMobService.hideBannerAd();
      setIsVisible(false);
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('광고 닫기 실패:', error);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="ad-banner-container">
      <div className="ad-banner-content">
        <div className="ad-banner-text">{isAdLoaded ? '' : '광고 로딩 중...'}</div>
        <IonButton
          fill="clear"
          size="small"
          onClick={handleClose}
          className="ad-banner-close-button"
        >
          <IonIcon icon={closeOutline} />
        </IonButton>
      </div>
    </div>
  );
};

export default AdBanner;
