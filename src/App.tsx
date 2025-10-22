import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { IonApp, setupIonicReact } from '@ionic/react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { IonReactRouter } from '@ionic/react-router';
import AppRouter from './router/AppRouter';
import AuthGuard from './components/AuthGuard';
import SplashScreen from './components/SplashScreen';
import { MessagingService } from './services/messagingService';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
/* import '@ionic/react/css/palettes/dark.system.css'; */

/* Theme variables */
import './theme/variables.css';

/* Tailwind CSS */
import './index.css';

setupIonicReact();

const AppContent: React.FC = () => {
  const location = useLocation();
  const [backgroundColor, setBackgroundColor] = useState('transparent');
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // StatusBar 설정
    const setupStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Default });
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
        console.log('StatusBar 설정 성공');
      } catch (error) {
        console.error('StatusBar 설정 실패:', error);
        // StatusBar 실패해도 앱은 계속 실행
      }
    };

    // FCM 토큰 초기화 (웹과 네이티브 모두)
    const initializeFCM = async () => {
      try {
        // 로그인된 사용자가 있는지 확인
        const savedUserInfo = localStorage.getItem('userInfo');
        if (savedUserInfo) {
          const userInfo = JSON.parse(savedUserInfo);
          if (userInfo.uid) {
            console.log('FCM 토큰 초기화 시작');
            try {
              const fcmToken = await MessagingService.getFCMToken();
              if (fcmToken) {
                await MessagingService.saveUserFCMToken(userInfo.uid, fcmToken);
                console.log('FCM 토큰 갱신 완료:', fcmToken.substring(0, 20) + '...');
              }
            } catch (fcmError) {
              console.error('FCM 토큰 갱신 중 에러:', fcmError);
              // FCM 실패해도 앱은 계속 실행
            }
          }
        }
      } catch (error) {
        console.error('FCM 토큰 초기화 실패:', error);
        // FCM 실패해도 앱은 계속 실행
      }
    };

    setupStatusBar();
    initializeFCM();
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  useEffect(() => {
    const path = location.pathname;

    switch (path) {
      case '/hospital':
        setBackgroundColor('transparent');
        break;
      case '/medication':
        setBackgroundColor('transparent');
        break;
      case '/home':
      default:
        setBackgroundColor('transparent');
        break;
    }
  }, [location.pathname]);

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <AuthGuard>
      <div
        className="app-background"
        style={{
          background: backgroundColor,
          minHeight: '100vh',
          transition: 'background 0.8s ease-in-out',
        }}
      >
        <AppRouter showTabs={location.pathname !== '/login' && location.pathname !== '/register'} />
      </div>
    </AuthGuard>
  );
};

const App: React.FC = () => {
  return (
    <IonApp>
      <IonReactRouter>
        <AppContent />
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
