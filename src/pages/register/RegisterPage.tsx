import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonAlert } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { Check } from 'lucide-react';
import SubHeader from '../../components/SubHeader';
import { RegionService, RegionCode } from '../../services/regionService';
import { upsertUserProfile, checkPhoneNumberExists } from '../../services/userService';

interface UserInfo {
  name: string;
  birthDate: string;
  gender: string;
  시도: string;
  시군구: string;
  telNo: string;
}

export default function RegisterPage() {
  const history = useHistory();
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '',
    birthDate: '',
    gender: '',
    시도: '',
    시군구: '',
    telNo: '',
  });

  // 지역 데이터 상태
  const [시도목록, set시도목록] = useState<RegionCode[]>([]);
  const [시군구목록, set시군구목록] = useState<RegionCode[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);
  const [isLoading시군구, setIsLoading시군구] = useState(false);
  const [phoneError, setPhoneError] = useState<string>('');
  const [phoneSuccess, setPhoneSuccess] = useState<string>('');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  // 지역 데이터 로드
  useEffect(() => {
    loadRegionData();
  }, []);

  const loadRegionData = async () => {
    setIsLoadingRegions(true);
    try {
      const 시도목록 = await RegionService.get시도목록();
      set시도목록(시도목록);
    } catch (error) {
      console.error('지역 데이터 로드 실패:', error);
    } finally {
      setIsLoadingRegions(false);
    }
  };

  const load시군구목록 = async (시도코드: number) => {
    setIsLoading시군구(true);
    try {
      const 시군구목록 = await RegionService.get시군구By시도(시도코드);
      set시군구목록(시군구목록);
    } catch (error) {
      console.error('시군구 목록 로드 실패:', error);
    } finally {
      setIsLoading시군구(false);
    }
  };

  // 휴대폰번호에서 - 제거하는 함수 (저장용)
  const formatPhoneNumber = (phoneNumber: string): string => {
    return phoneNumber.replace(/-/g, '');
  };

  // 휴대폰번호에 - 추가하는 함수 (표시용)
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

  // 휴대폰번호 중복 체크 함수
  const checkPhoneDuplicate = async (phoneNumber: string) => {
    const cleanPhoneNumber = formatPhoneNumber(phoneNumber);
    if (!cleanPhoneNumber || cleanPhoneNumber.length < 10) {
      setPhoneError('');
      setPhoneSuccess('');
      return;
    }

    setIsCheckingPhone(true);
    setPhoneError('');
    setPhoneSuccess('');

    try {
      const exists = await checkPhoneNumberExists(cleanPhoneNumber);
      if (exists) {
        setPhoneError('이미 사용 중인 휴대폰번호입니다.');
        setPhoneSuccess('');
      } else {
        setPhoneError('');
        setPhoneSuccess('사용가능한 휴대폰번호입니다.');
      }
    } catch (error) {
      console.error('휴대폰번호 중복 체크 실패:', error);
      setPhoneError('휴대폰번호 확인 중 오류가 발생했습니다.');
      setPhoneSuccess('');
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const updateUserInfo = (field: keyof UserInfo, value: string) => {
    if (field === '시도') {
      // 시도 변경 시 시군구 초기화
      setUserInfo(prev => ({
        ...prev,
        [field]: value,
        시군구: '',
      }));
      // 시군구 목록 즉시 로드
      load시군구목록(parseInt(value));
    } else if (field === 'telNo') {
      // 휴대폰번호 입력 시 에러/성공 메시지 초기화
      setPhoneError('');
      setPhoneSuccess('');
      // 입력값을 자동으로 포맷팅하여 표시
      const formattedValue = formatPhoneDisplay(value);
      setUserInfo(prev => ({
        ...prev,
        [field]: formattedValue,
      }));
    } else {
      setUserInfo(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSave = async () => {
    // 휴대폰번호 중복 체크
    if (userInfo.telNo) {
      const cleanPhoneNumber = formatPhoneNumber(userInfo.telNo);
      const exists = await checkPhoneNumberExists(cleanPhoneNumber);
      if (exists) {
        setPhoneError('이미 사용 중인 휴대폰번호입니다.');
        return;
      }
    }

    if (
      userInfo.name &&
      userInfo.birthDate &&
      userInfo.gender &&
      userInfo.시도 &&
      userInfo.시군구 &&
      userInfo.telNo &&
      !phoneError
    ) {
      setIsSaving(true);

      try {
        const result = await upsertUserProfile({
          birthDate: userInfo.birthDate,
          gender: userInfo.gender as 'male' | 'female' | 'other',
          name: userInfo.name,
          sido: userInfo.시도,
          sigungu: userInfo.시군구,
          telNo: formatPhoneNumber(userInfo.telNo),
        });

        if (result) {
          // 회원가입 성공 시 로컬스토리지에 저장 후 홈으로 이동
          localStorage.setItem(
            'userInfo',
            JSON.stringify({
              uid: result.uid,
              name: userInfo.name,
              birthDate: userInfo.birthDate,
              gender: userInfo.gender,
              sido: userInfo.시도,
              sigungu: userInfo.시군구,
              telNo: formatPhoneNumber(userInfo.telNo),
              loginTime: new Date().toISOString(),
            })
          );
          history.push('/home');
        } else {
          setErrorMessage('회원가입에 실패했습니다. 다시 시도해주세요.');
          setShowErrorAlert(true);
        }
      } catch (e) {
        console.error('Firebase 저장 실패:', e);
        setErrorMessage(
          `회원가입 중 오류가 발생했습니다: ${e instanceof Error ? e.message : '알 수 없는 오류'}`
        );
        setShowErrorAlert(true);
      } finally {
        setIsSaving(false);
      }
    } else {
      setErrorMessage('모든 필수 항목을 입력해주세요.');
      setShowErrorAlert(true);
    }
  };

  return (
    <IonPage>
      <SubHeader title="회원가입" />
      <IonContent>
        <div className="flex min-h-full flex-col px-6 py-8 mx-auto w-full max-w-sm">
          {/* 환영 배너 */}
          <div className="mb-8">
            <h1 className="text-2xl leading-[1.4] font-semibold text-gray-900">
              환영합니다! 👋
              <br />
              기본 정보를 입력해주세요
            </h1>
            <p className="mt-2 text-base text-gray-600">
              건강한 하루를 위한 첫 걸음을 시작해보세요
            </p>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-5"
          >
            {/* 이름 */}
            <div>
              <label htmlFor="name" className="block text-base font-medium text-gray-900">
                이름
              </label>
              <div className="mt-2">
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={userInfo.name}
                  onChange={e => updateUserInfo('name', e.target.value)}
                  required
                  placeholder="이름을 입력하세요"
                  className="block w-full rounded-xl bg-white border px-3 py-3 text-lg text-gray-900 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-1 focus:outline-emerald-500"
                />
              </div>
            </div>

            {/* 생년월일 */}
            <div>
              <label htmlFor="birthDate" className="block text-base font-medium text-gray-900">
                생년월일
              </label>
              <div className="mt-2">
                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  value={userInfo.birthDate}
                  onChange={e => updateUserInfo('birthDate', e.target.value)}
                  min="1900-01-01"
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="block w-full rounded-xl bg-white border px-3 py-3 text-lg text-gray-900 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-1 focus:outline-emerald-500"
                />
              </div>
            </div>

            {/* 휴대폰번호 */}
            <div>
              <label htmlFor="phone" className="block text-base font-medium text-gray-900">
                휴대폰번호
              </label>
              <div className="mt-2">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={userInfo.telNo}
                  onChange={e => updateUserInfo('telNo', e.target.value)}
                  onBlur={() => checkPhoneDuplicate(userInfo.telNo)}
                  maxLength={13}
                  required
                  placeholder="010-1234-5678"
                  className="block w-full rounded-xl bg-white border px-3 py-3 text-lg text-gray-900 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-1 focus:outline-emerald-500"
                />
              </div>
              {phoneError && <div className="text-sm text-red-600 mt-1">{phoneError}</div>}
              {phoneSuccess && <div className="text-sm text-green-600 mt-1">{phoneSuccess}</div>}
              {isCheckingPhone && (
                <div className="text-sm text-blue-600 mt-1">휴대폰번호 확인 중...</div>
              )}
            </div>

            {/* 성별 */}
            <div>
              <label className="block text-base font-medium text-gray-900 mb-2">성별</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => updateUserInfo('gender', 'male')}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 text-base font-medium transition-colors flex items-center justify-center gap-2 ${
                    userInfo.gender === 'male'
                      ? 'border-emerald-500 bg-emerald-100 text-emerald-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {userInfo.gender === 'male' && <Check className="w-5 h-5" />}
                  남성
                </button>
                <button
                  type="button"
                  onClick={() => updateUserInfo('gender', 'female')}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 text-base font-medium transition-colors flex items-center justify-center gap-2 ${
                    userInfo.gender === 'female'
                      ? 'border-emerald-500 bg-emerald-100 text-emerald-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {userInfo.gender === 'female' && <Check className="w-5 h-5" />}
                  여성
                </button>
              </div>
            </div>

            {/* 거주 지역 */}
            <div>
              <label className="block text-base font-medium text-gray-900 mb-2">거주 지역</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <select
                    value={userInfo.시도}
                    onChange={e => updateUserInfo('시도', e.target.value)}
                    disabled={isLoadingRegions}
                    required
                    className="block w-full rounded-xl bg-white border px-3 py-3 text-base text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-emerald-500"
                  >
                    <option value="">시/도 선택</option>
                    {시도목록.map(시도 => (
                      <option key={시도.코드} value={시도.코드.toString()}>
                        {시도.코드명}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={userInfo.시군구}
                    onChange={e => updateUserInfo('시군구', e.target.value)}
                    disabled={!userInfo.시도 || isLoading시군구}
                    required
                    className="block w-full rounded-xl bg-white border px-3 py-3 text-base text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-emerald-500 disabled:bg-gray-100"
                  >
                    <option value="">
                      {!userInfo.시도 ? '먼저 시/도 선택' : '시/군/구 선택'}
                    </option>
                    {시군구목록.map(시군구 => (
                      <option key={시군구.코드} value={시군구.코드.toString()}>
                        {시군구.코드명}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={
                  !userInfo.name ||
                  !userInfo.birthDate ||
                  !userInfo.gender ||
                  !userInfo.시도 ||
                  !userInfo.시군구 ||
                  !userInfo.telNo ||
                  !!phoneError ||
                  isCheckingPhone ||
                  isSaving
                }
                className="flex w-full justify-center rounded-full bg-emerald-500 px-3 py-4 text-xl font-semibold text-white shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '가입 중...' : '시작하기'}
              </button>
            </div>
          </form>
        </div>
      </IonContent>

      {/* 에러 알림 */}
      <IonAlert
        isOpen={showErrorAlert}
        onDidDismiss={() => setShowErrorAlert(false)}
        header="오류"
        message={errorMessage}
        buttons={['확인']}
      />
    </IonPage>
  );
}
