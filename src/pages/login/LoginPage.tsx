import { useHistory } from 'react-router-dom';
import { useState } from 'react';
import { IonContent } from '@ionic/react';
import { AlertCircle } from 'lucide-react';
import { findUserByPhoneAndName } from '../../services/userService';
import { MessagingService } from '../../services/messagingService';

export default function LoginPage() {
  const history = useHistory();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setLoading] = useState(false);

  // 휴대폰번호 포맷팅 함수
  const formatPhoneDisplay = (phoneNumber: string): string => {
    const cleanNumber = phoneNumber.replace(/-/g, '');
    if (cleanNumber.length <= 3) {
      return cleanNumber;
    } else if (cleanNumber.length <= 7) {
      return `${cleanNumber.slice(0, 3)}-${cleanNumber.slice(3)}`;
    } else {
      return `${cleanNumber.slice(0, 3)}-${cleanNumber.slice(3, 7)}-${cleanNumber.slice(7, 11)}`;
    }
  };

  // 휴대폰번호에서 - 제거하는 함수
  const formatPhoneNumber = (phoneNumber: string): string => {
    return phoneNumber.replace(/-/g, '');
  };

  const handleLogin = async () => {
    if (!name.trim()) {
      setErrorMsg('이름을 입력해주세요.');
      return;
    }

    if (!phoneNumber.trim()) {
      setErrorMsg('휴대폰번호를 입력해주세요.');
      return;
    }

    const cleanPhoneNumber = formatPhoneNumber(phoneNumber);
    if (cleanPhoneNumber.length < 10) {
      setErrorMsg('올바른 휴대폰번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Firebase user 컬렉션에서 전화번호와 이름으로 사용자 찾기
      const userProfile = await findUserByPhoneAndName(cleanPhoneNumber, name.trim());

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
            : '',
          gender: userProfile.gender || '',
          sido: userProfile.sido || '',
          sigungu: userProfile.sigungu || '',
          email: userProfile.email || '',
          phoneNumber: userProfile.phoneNumber || '',
          telNo: userProfile.telNo || cleanPhoneNumber,
          address: userProfile.address || '',
          pushToken: userProfile.pushToken || '',
          emergencyContact: userProfile.emergencyContact || null,
          medicalInfo: userProfile.medicalInfo || null,
          loginTime: new Date().toISOString(),
        };

        console.log('사용자 정보를 찾았습니다:', userProfile);
        localStorage.setItem('userInfo', JSON.stringify(userData));
        
        // FCM 토큰 갱신 (웹과 네이티브 모두)
        try {
          console.log('=== 로그인 후 FCM 토큰 갱신 시작 ===');
          console.log('userProfile.uid:', userProfile.uid);
          console.log('Capacitor 환경:', (window as any).Capacitor ? '있음' : '없음');
          console.log('네이티브 플랫폼:', (window as any).Capacitor?.isNativePlatform() ? '네이티브' : '웹');
          
          const fcmToken = await MessagingService.getFCMToken();
          console.log('getFCMToken 결과:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'null');
          
          if (fcmToken && userProfile.uid) {
            console.log('FCM 토큰과 userId 모두 있음, 저장 시작');
            await MessagingService.saveUserFCMToken(userProfile.uid, fcmToken);
            console.log('FCM 토큰 갱신 완료:', fcmToken.substring(0, 20) + '...');
          } else {
            console.log('FCM 토큰을 가져올 수 없음 - fcmToken:', !!fcmToken, 'userProfile.uid:', !!userProfile.uid);
          }
        } catch (error) {
          console.error('FCM 토큰 갱신 실패:', error);
        }
        
        history.push('/home');
      } else {
        // 사용자를 찾지 못한 경우
        setErrorMsg('존재하지 않는 계정입니다.');
      }
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
                <label htmlFor="phone" className="block text-base font-medium text-gray-900">
                  휴대폰번호
                </label>
              </div>
              <div className="mt-2">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={e => {
                    const formattedValue = formatPhoneDisplay(e.target.value);
                    setPhoneNumber(formattedValue);
                  }}
                  maxLength={13}
                  required
                  placeholder="010-1234-5678"
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
