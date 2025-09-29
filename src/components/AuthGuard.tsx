import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { getCurrentUserSession } from '../services/userService';
import { MessagingService } from '../services/messagingService';

interface UserData {
  name: string;
  birthDate: string;
  gender: string;
  시도: string;
  시군구: string;
}

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    checkUserAuthentication();
  }, [location.pathname]);

  const checkUserAuthentication = async () => {
    try {
      // Firebase 세션에서 사용자 정보 확인
      const userSession = await getCurrentUserSession();
      if (userSession && userSession.isAuthenticated) {
        setIsAuthenticated(true);
        setIsLoading(false);
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
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.log('localStorage 사용자 정보 파싱 실패:', error);
        localStorage.removeItem('userInfo');
      }
    }

    // 사용자 정보가 없으면 로그인 페이지로 리다이렉트
    setIsAuthenticated(false);
    setIsLoading(false);

    // 현재 경로가 인증 관련 페이지가 아니면 로그인 페이지로 이동
    if (location.pathname !== '/login' && location.pathname !== '/register') {
      history.push('/login');
    }
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div
        className="app-background"
        style={{
          background: 'transparent',
          minHeight: '100vh',
          transition: 'background 0.8s ease-in-out',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div>로딩 중...</div>
      </div>
    );
  }

  // 인증되지 않은 경우, 인증 관련 페이지만 허용
  if (!isAuthenticated) {
    if (location.pathname === '/login' || location.pathname === '/register') {
      return <>{children}</>;
    }
    return null; // 다른 페이지는 접근 차단
  }

  // 인증된 경우, 인증 페이지 접근 시 홈으로 리다이렉트
  if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/register')) {
    history.push('/home');
    return null;
  }

  // 인증 완료 시 모든 페이지 접근 허용
  return <>{children}</>;
};

export default AuthGuard;