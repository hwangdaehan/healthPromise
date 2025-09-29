import { useHistory } from 'react-router-dom';
import Login from '../components/Login';

interface LoginPageProps {
  onLoginSuccess?: (userData: {
    name: string;
    birthDate: string;
    gender?: string;
    sido?: string;
    sigungu?: string;
  }) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const history = useHistory();

  const handleLoginSuccess = (userData: {
    name: string;
    birthDate: string;
    gender?: string;
    sido?: string;
    sigungu?: string;
  }) => {
    // 사용자 정보를 localStorage에 저장
    localStorage.setItem('userInfo', JSON.stringify(userData));

    if (onLoginSuccess) {
      onLoginSuccess(userData);
    }

    // 홈으로 리다이렉트
    history.push('/home');
  };

  const handleGoToRegister = () => {
    history.push('/register');
  };

  return (
    <div
      className="app-background"
      style={{
        background: 'transparent',
        minHeight: '100vh',
        transition: 'background 0.8s ease-in-out',
      }}
    >
      <Login onLoginSuccess={handleLoginSuccess} onGoToRegister={handleGoToRegister} />
    </div>
  );
};

export default LoginPage;
