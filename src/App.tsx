import { Redirect, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getCurrentUserSession } from './services/userService';
import {
  IonApp,
  IonRouterOutlet,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  setupIonicReact
} from '@ionic/react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { IonReactRouter } from '@ionic/react-router';
import { home, calendar, medical, person, settings } from 'ionicons/icons';
import Home from './pages/Home';
import HospitalBooking from './pages/HospitalBooking';
import MedicationManagement from './pages/MedicationManagement';
import UserInfo from './components/UserInfo';
import Login from './components/Login';

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
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

interface UserData {
  name: string;
  birthDate: string;
  gender: string;
  시도: string;
  시군구: string;
}

const AppContent: React.FC = () => {
  const location = useLocation();
  const [backgroundColor, setBackgroundColor] = useState('transparent');
  const [userInfo, setUserInfo] = useState<UserData | null>(null);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // StatusBar 설정
    const setupStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Default });
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
      } catch (error) {
        console.log('StatusBar 설정 실패:', error);
      }
    };
    
    setupStatusBar();

    // 사용자 정보 확인
    checkUserAuthentication();
  }, []);

  const checkUserAuthentication = async () => {
    try {
      // Firebase 세션에서 사용자 정보 확인
      const userSession = await getCurrentUserSession();
      if (userSession && userSession.isAuthenticated) {
        setUserInfo({
          name: userSession.name || '',
          birthDate: userSession.birthDate || '',
          gender: userSession.gender || '',
          시도: userSession.sido || '',
          시군구: userSession.sigungu || ''
        });
        setIsAuthenticated(true);
        setShowUserInfo(false);
        setShowLogin(false);
        return;
      }
    } catch (error) {
      console.log('Firebase 세션 확인 실패:', error);
    }

    // localStorage에서 사용자 정보 확인
    const savedUserInfo = localStorage.getItem('userInfo');
    if (savedUserInfo) {
      try {
        const userData = JSON.parse(savedUserInfo);
        if (userData.name && userData.birthDate) {
          setUserInfo({
            name: userData.name,
            birthDate: userData.birthDate,
            gender: userData.gender || '',
            시도: userData.시도 || userData.sido || '',
            시군구: userData.시군구 || userData.sigungu || ''
          });
          setIsAuthenticated(true);
          setShowUserInfo(false);
          setShowLogin(false);
          return;
        }
      } catch (error) {
        console.log('localStorage 사용자 정보 파싱 실패:', error);
        localStorage.removeItem('userInfo'); // 잘못된 데이터 삭제
      }
    }

    // 사용자 정보가 없으면 로그인 화면 표시
    setShowLogin(true);
    setShowUserInfo(false);
    setIsAuthenticated(false);
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

  const handleUserInfoSave = (userData: UserData) => {
    localStorage.setItem('userInfo', JSON.stringify(userData));
    setUserInfo(userData);
    setShowUserInfo(false);
    setIsAuthenticated(true);
  };

  const handleLoginSuccess = (userData: { 
    name: string; 
    birthDate: string; 
    gender?: string; 
    sido?: string; 
    sigungu?: string; 
  }) => {
    // 로그인 성공 시 사용자 정보 설정
    setUserInfo({
      name: userData.name,
      birthDate: userData.birthDate,
      gender: userData.gender || '',
      시도: userData.sido || '',
      시군구: userData.sigungu || ''
    });
    setIsAuthenticated(true);
    setShowLogin(false);
    setShowUserInfo(false);
    
    // 사용자 정보 다시 확인 (localStorage에서 최신 데이터 가져오기)
    setTimeout(() => {
      checkUserAuthentication();
    }, 100);
  };

  const handleGoToRegister = () => {
    setShowLogin(false);
    setShowUserInfo(true);
  };

  // 로그인 화면 표시
  if (showLogin) {
    return (
      <div 
        className="app-background" 
        style={{ 
          background: backgroundColor,
          minHeight: '100vh',
          transition: 'background 0.8s ease-in-out'
        }}
      >
        <Login 
          onLoginSuccess={handleLoginSuccess}
          onGoToRegister={handleGoToRegister}
        />
      </div>
    );
  }

  // 사용자 정보 등록 화면 표시
  if (showUserInfo) {
    return (
      <div 
        className="app-background" 
        style={{ 
          background: backgroundColor,
          minHeight: '100vh',
          transition: 'background 0.8s ease-in-out'
        }}
      >
        <UserInfo onSave={handleUserInfoSave} />
      </div>
    );
  }

  return (
    <div 
      className="app-background" 
      style={{ 
        background: backgroundColor,
        minHeight: '100vh',
        transition: 'background 0.8s ease-in-out'
      }}
    >
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/home">
            <Home />
          </Route>
          <Route exact path="/hospital">
            <HospitalBooking />
          </Route>
          <Route exact path="/medication">
            <MedicationManagement />
          </Route>
          <Route exact path="/">
            <Redirect to="/home" />
          </Route>
        </IonRouterOutlet>
        
                    <IonTabBar slot="bottom" className="modern-tab-bar">
                      <IonTabButton tab="home" href="/home">
                        <IonIcon icon={home} />
                        <IonLabel>홈</IonLabel>
                      </IonTabButton>
                      <IonTabButton tab="hospital" href="/hospital">
                        <IonIcon icon={calendar} />
                        <IonLabel>예약</IonLabel>
                      </IonTabButton>
                      <IonTabButton tab="medication" href="/medication">
                        <IonIcon icon={medical} />
                        <IonLabel>복약</IonLabel>
                      </IonTabButton>
                    </IonTabBar>
      </IonTabs>
    </div>
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
