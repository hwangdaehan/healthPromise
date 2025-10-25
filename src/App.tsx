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

    // FCM 토큰 초기화 (유효성 검사 포함)
    const initializeFCM = async () => {
      try {
        console.log('🔄 FCM 초기화 시작 (지연 실행)');
        
        // 로그인된 사용자가 있는지 확인
        const savedUserInfo = localStorage.getItem('userInfo');
        
        if (savedUserInfo) {
          try {
            const userInfo = JSON.parse(savedUserInfo);
            
            if (userInfo.uid) {
              console.log('🔄 FCM 토큰 유효성 검사 및 갱신 시작');
              
              // 토큰 유효성 검사 후 필요시에만 갱신
              try {
                const token = await MessagingService.initializeAndSaveToken();
                if (token) {
                  console.log('✅ FCM 토큰 갱신 완료');
                } else {
                  console.log('⚠️ FCM 토큰 갱신 불필요 또는 실패');
                }
              } catch (fcmError) {
                console.error('❌ FCM 토큰 갱신 실패:', fcmError);
                // FCM 실패해도 앱은 계속 실행
              }
            } else {
              console.log('⚠️ 사용자 ID가 없음');
            }
          } catch (parseError) {
            console.error('❌ userInfo 파싱 실패:', parseError);
            // 파싱 실패해도 앱은 계속 실행
          }
        } else {
          console.log('⚠️ 로그인된 사용자가 없음');
        }
      } catch (error) {
        console.error('❌ FCM 초기화 실패:', error);
        // FCM 실패해도 앱은 계속 실행
      }
    };

    setupStatusBar();
    
    // FCM을 지연 실행 (앱이 완전히 로드된 후)
    setTimeout(() => {
      initializeFCM();
    }, 2000); // 2초 후 실행

    // 푸시 알림 메시지 처리
    const setupPushNotificationHandler = () => {
      try {
        const unsubscribe = MessagingService.onMessage((payload) => {
          console.log('📱 푸시 알림 메시지 수신:', payload);
          
          // 복약 알림인 경우 복용 기록 등록 페이지로 이동
          if (payload.data?.type === 'medicine') {
            console.log('💊 복약 알림 감지 - 복용 기록 등록 페이지로 이동');
            // URL 파라미터와 함께 복약 관리 페이지로 이동
            window.location.href = '/medication?action=record';
          }
        });

        // 컴포넌트 언마운트 시 구독 해제
        return unsubscribe;
      } catch (error) {
        console.error('푸시 알림 핸들러 설정 실패:', error);
        return () => {};
      }
    };

    const unsubscribe = setupPushNotificationHandler();
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
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
