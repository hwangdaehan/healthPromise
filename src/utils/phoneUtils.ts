// 휴대전화번호를 하이픈 없이 저장하고, 표시할 때만 포맷 적용하는 유틸리티

export const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';

  // 숫자만 추출
  const numbersOnly = phoneNumber.replace(/\D/g, '');

  // 11자리 휴대폰 번호인 경우에만 포맷 적용
  if (numbersOnly.length === 11 && numbersOnly.startsWith('010')) {
    return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 7)}-${numbersOnly.slice(7)}`;
  }

  return phoneNumber;
};

export const normalizePhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';

  // 모든 하이픈, 공백, 괄호 등 제거하고 숫자만 남김
  return phoneNumber.replace(/\D/g, '');
};

export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  const normalized = normalizePhoneNumber(phoneNumber);

  // 11자리이고 010으로 시작하는지 확인
  return normalized.length === 11 && normalized.startsWith('010');
};