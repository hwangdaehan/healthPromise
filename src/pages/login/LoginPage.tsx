import { useHistory } from 'react-router-dom';
import { useState } from 'react';
import { IonContent } from '@ionic/react';
import { AlertCircle } from 'lucide-react';
import { findUserByNameAndBirthDate } from '../../services/userService';

export default function LoginPage() {
  const history = useHistory();

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setLoading] = useState(false);

  const validateBirthDate = (date: string) => {
    // 숫자 8자리 체크
    const numberPattern = /^\d{8}$/;
    if (!numberPattern.test(date)) {
      return false;
    }

    // YYYYMMDD 형식으로 파싱
    const year = parseInt(date.substring(0, 4));
    const month = parseInt(date.substring(4, 6));
    const day = parseInt(date.substring(6, 8));

    // 기본 범위 체크
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear) {
      return false;
    }
    if (month < 1 || month > 12) {
      return false;
    }
    if (day < 1 || day > 31) {
      return false;
    }

    // 월별 일수 체크
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // 윤년 체크
    if (month === 2 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)) {
      daysInMonth[1] = 29;
    }

    return day <= daysInMonth[month - 1];
  };

  const handleLogin = async () => {
    if (!name.trim()) {
      setErrorMsg('이름을 입력해주세요.');
      return;
    }

    if (!birthDate || birthDate.trim().length !== 8) {
      setErrorMsg('생년월일을 8자리로 입력해주세요.');
      return;
    }

    if (!validateBirthDate(birthDate.trim())) {
      setErrorMsg('올바른 생년월일을 입력해주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Firebase user 컬렉션에서 이름과 생년월일로 사용자 찾기
      const userProfile = await findUserByNameAndBirthDate(name.trim(), birthDate);

      let userData;

      if (userProfile) {
        // Firebase에서 사용자 정보를 찾은 경우 - 모든 정보를 세션에 저장
        userData = {
          uid: userProfile.uid, // Firebase 사용자 ID 추가
          name: userProfile.name || name.trim(),
          birthDate: userProfile.birthDate
            ? typeof userProfile.birthDate === 'object' && 'toDate' in userProfile.birthDate
              ? (userProfile.birthDate as { toDate: () => Date }).toDate().toISOString()
              : String(userProfile.birthDate)
            : birthDate,
          gender: userProfile.gender || '',
          sido: userProfile.sido || '',
          sigungu: userProfile.sigungu || '',
          email: userProfile.email || '',
          phoneNumber: userProfile.phoneNumber || '',
          address: userProfile.address || '',
          pushToken: userProfile.pushToken || '',
          emergencyContact: userProfile.emergencyContact || null,
          medicalInfo: userProfile.medicalInfo || null,
          loginTime: new Date().toISOString(),
        };

        console.log('사용자 정보를 찾았습니다:', userProfile);
      } else {
        // Firebase에서 사용자 정보를 찾지 못한 경우 (기본값으로 저장)
        userData = {
          name: name.trim(),
          birthDate: birthDate,
          gender: '',
          sido: '',
          sigungu: '',
          email: '',
          phoneNumber: '',
          address: '',
          pushToken: '',
          emergencyContact: null,
          medicalInfo: null,
          loginTime: new Date().toISOString(),
        };

        console.log('사용자 정보를 찾지 못했습니다. 기본값으로 저장합니다.');
      }

      // 사용자 정보를 localStorage에 저장
      localStorage.setItem(
        'userInfo',
        JSON.stringify({
          name: userData.name,
          birthDate: userData.birthDate,
          gender: userData.gender,
          sido: userData.sido,
          sigungu: userData.sigungu,
        })
      );

      // 로그인 성공 후 홈으로 리다이렉트
      history.replace('/home');
    } catch (error) {
      console.error('사용자 정보 확인 실패:', error);
      setErrorMsg('사용자 정보를 확인하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonContent>
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 mx-auto w-full max-w-sm">
        <div>
          <img src="/main_logo.svg" alt="건강약속 로고" className="w-11" />
          <h1 className="text-3xl leading-[1.4] font-semibold text-gray-900 mt-3">
            안녕하세요
            <br />
            건강약속입니다
          </h1>
        </div>

        <div className="mt-12">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-6"
          >
            <div>
              <label htmlFor="name" className="block text-base font-medium text-gray-900">
                이름
              </label>
              <div className="mt-2">
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="이름을 입력하세요"
                  className="block w-full rounded-xl bg-white border px-3 py-3 text-lg text-gray-900 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-1 focus:outline-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="birthday" className="block text-base font-medium text-gray-900">
                  생년월일
                </label>
              </div>
              <div className="mt-2">
                <input
                  id="birthday"
                  name="birthday"
                  type="text"
                  value={birthDate}
                  onChange={e => {
                    const value = e.target.value.replace(/\D/g, ''); // 숫자만 허용
                    setBirthDate(value);
                  }}
                  maxLength={8}
                  pattern="\d{8}"
                  required
                  placeholder="예) 19941024"
                  className="block w-full rounded-xl bg-white border px-3 py-3 text-lg text-gray-900 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-1 focus:outline-emerald-500"
                />
              </div>
            </div>
            {errorMsg && (
              <div className="flex items-center px-3 py-3 mb-4 text-base text-red-600 border border-red-300 rounded-lg bg-red-50">
                <AlertCircle className="w-4 h-4 mr-2" />
                <div>{errorMsg}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-full bg-emerald-500 px-3 py-4 text-xl font-semibold text-white shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
            </div>
          </form>

          <button
            onClick={() => history.push('/register')}
            className="block mx-auto mt-10 text-center text-base text-gray-500"
          >
            간단한 정보 입력하고{' '}
            <span className="font-semibold text-emerald-500 hover:text-emerald-400">시작하기</span>
          </button>
        </div>
      </div>
    </IonContent>
  );
}
