import { useHistory } from 'react-router-dom';
import UserInfo from '../components/UserInfo';

interface UserData {
  name: string;
  birthDate: string;
  gender: string;
  시도: string;
  시군구: string;
}

interface RegisterPageProps {
  onRegisterSuccess?: (userData: UserData) => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegisterSuccess }) => {
  const history = useHistory();

  const handleUserInfoSave = (userData: UserData) => {
    localStorage.setItem('userInfo', JSON.stringify(userData));

    if (onRegisterSuccess) {
      onRegisterSuccess(userData);
    }

    history.push('/home');
  };

  return (
    <div
      className="app-background"
      style={{
        background: 'transparent',
        minHeight: '100vh',
        transition: 'background 0.8s ease-in-out'
      }}
    >
      <UserInfo onSave={handleUserInfoSave} />
    </div>
  );
};

export default RegisterPage;