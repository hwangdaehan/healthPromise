import { Redirect, Route } from 'react-router-dom';
import { IonRouterOutlet, IonTabs, IonTabBar, IonTabButton } from '@ionic/react';
import Home from '../pages/Home';
import HospitalBooking from '../pages/HospitalBooking';
import MedicationManagement from '../pages/MedicationManagement';
import FavoriteHospitals from '../pages/FavoriteHospitals';
import MyPage from '../pages/MyPage';
import LoginPage from '../pages/login/LoginPage';
import RegisterPage from '../pages/register/RegisterPage';

interface AppRouterProps {
  showTabs?: boolean;
}

const AppRouter: React.FC<AppRouterProps> = ({ showTabs = true }) => {
  if (!showTabs) {
    return (
      <IonRouterOutlet>
        <Route exact path="/login">
          <LoginPage />
        </Route>
        <Route exact path="/register">
          <RegisterPage />
        </Route>
        <Route exact path="/home">
          <Home />
        </Route>
        <Route exact path="/hospital">
          <HospitalBooking />
        </Route>
        <Route exact path="/medication">
          <MedicationManagement />
        </Route>
        <Route exact path="/favorite-hospitals">
          <FavoriteHospitals />
        </Route>
        <Route exact path="/mypage">
          <MyPage />
        </Route>
        <Route exact path="/">
          <Redirect to="/home" />
        </Route>
      </IonRouterOutlet>
    );
  }

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/login">
          <LoginPage />
        </Route>
        <Route exact path="/register">
          <RegisterPage />
        </Route>
        <Route exact path="/home">
          <Home />
        </Route>
        <Route exact path="/hospital">
          <HospitalBooking />
        </Route>
        <Route exact path="/medication">
          <MedicationManagement />
        </Route>
        <Route exact path="/favorite-hospitals">
          <FavoriteHospitals />
        </Route>
        <Route exact path="/mypage">
          <MyPage />
        </Route>
        <Route exact path="/">
          <Redirect to="/home" />
        </Route>
      </IonRouterOutlet>

      <IonTabBar slot="bottom" className="modern-tab-bar">
        <IonTabButton tab="home" href="/home">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="#ffffff"
            style={{
              display: 'block',
              marginBottom: '0px',
            }}
          >
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        </IonTabButton>
        <IonTabButton tab="hospital" href="/hospital">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="#ffffff"
            style={{
              display: 'block',
              marginBottom: '0px',
            }}
          >
            <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z" />
          </svg>
        </IonTabButton>
        <IonTabButton tab="medication" href="/medication">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="#ffffff"
            style={{
              display: 'block',
              marginBottom: '0px',
            }}
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </IonTabButton>
        <IonTabButton tab="mypage" href="/mypage">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="#ffffff"
            style={{
              display: 'block',
              marginBottom: '0px',
            }}
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default AppRouter;
