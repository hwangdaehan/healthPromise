// 건강보험심사평가원 병원정보서비스 API
// https://www.data.go.kr/data/15001698/openapi.do

export interface HospitalInfo {
  ykiho: string; // 요양기호
  yadmNm: string; // 요양기관명
  clcd: string; // 종별코드
  clcdNm: string; // 종별명
  sidoCd: string; // 시도코드
  sidoCdNm: string; // 시도명
  sgguCd: string; // 시군구코드
  sgguCdNm: string; // 시군구명
  emdongNm: string; // 읍면동명
  postNo: string; // 우편번호
  addr: string; // 주소
  telno: string; // 전화번호
  hospUrl: string; // 홈페이지
  estbDd: string; // 개설일자
  drTotCnt: string; // 의사총수
  gdrCnt: string; // 일반의수
  intnCnt: string; // 인턴수
  resdntCnt: string; // 레지던트수
  sdrCnt: string; // 전문의수
  xpos: string; // X좌표
  ypos: string; // Y좌표
  distance?: number; // 거리 (검색 시 계산)
}

export interface HospitalSearchParams {
  yadmNm?: string; // 요양기관명
  clcd?: string; // 종별코드
  sidoCd?: string; // 시도코드
  sgguCd?: string; // 시군구코드
  pageNo?: number; // 페이지 번호
  numOfRows?: number; // 페이지당 결과 수
}

export interface HospitalSearchResult {
  hospitals: HospitalInfo[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

// API 키는 환경변수에서 가져오거나 실제 키로 교체해야 합니다
const API_KEY =
  import.meta.env.VITE_HOSPITAL_API_KEY ||
  'f59bba5ced858802b0bbd4ba54677b128e3e528bbf41a8a0c47c342838573cb9';
const BASE_URL = 'https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList';

export class HospitalService {
  /**
   * 병원 정보를 검색합니다
   * @param params 검색 파라미터
   * @returns 병원 검색 결과 (병원 정보, 총 개수, 페이지 정보 포함)
   */
  static async searchHospitals(params: HospitalSearchParams): Promise<HospitalSearchResult> {
    try {
      const searchParams = new URLSearchParams({
        serviceKey: API_KEY,
        pageNo: (params.pageNo || 1).toString(),
        numOfRows: (params.numOfRows || 10).toString(),
        _type: 'json', // JSON 형태로 응답 받기
      });

      // 검색 조건 추가
      if (params.yadmNm) {
        searchParams.append('yadmNm', params.yadmNm);
      }
      if (params.clcd) {
        searchParams.append('clcd', params.clcd);
      }
      if (params.sidoCd) {
        searchParams.append('sidoCd', params.sidoCd);
      }
      if (params.sgguCd) {
        searchParams.append('sgguCd', params.sgguCd);
      }
      const response = await fetch(`${BASE_URL}?${searchParams}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('API 응답 텍스트:', responseText.substring(0, 200)); // 처음 200자만 로그

      const data = JSON.parse(responseText);

      // API 응답 구조에 따라 데이터 추출
      if (data.response && data.response.body) {
        const body = data.response.body;
        const totalCount = parseInt(body.totalCount) || 0;
        const currentPage = params.pageNo || 1;
        const numOfRows = params.numOfRows || 10;
        const totalPages = Math.ceil(totalCount / numOfRows);

        let hospitals: HospitalInfo[] = [];
        if (body.items && body.items.item) {
          const items = body.items.item;
          // 단일 객체인 경우 배열로 변환
          hospitals = Array.isArray(items) ? items : [items];
        }

        return {
          hospitals,
          totalCount,
          currentPage,
          totalPages,
        };
      }

      return {
        hospitals: [],
        totalCount: 0,
        currentPage: params.pageNo || 1,
        totalPages: 0,
      };
    } catch (error) {
      console.error('병원 검색 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 병원명으로 병원을 검색합니다
   * @param hospitalName 병원명
   * @returns 병원 검색 결과
   */
  static async searchByHospitalName(hospitalName: string): Promise<HospitalSearchResult> {
    return this.searchHospitals({ yadmNm: hospitalName });
  }

  /**
   * 지역별 병원을 검색합니다
   * @param sidoCd 시도코드
   * @param sgguCd 시군구코드 (선택사항)
   * @returns 병원 정보 배열
   */
  static async searchByRegion(sidoCd: string, sgguCd?: string): Promise<HospitalSearchResult> {
    return this.searchHospitals({ sidoCd, sgguCd });
  }

  /**
   * 병원 종별로 검색합니다
   * @param clcd 종별코드 (01: 상급종합병원, 11: 종합병원, 21: 병원, 31: 의원)
   * @returns 병원 검색 결과
   */
  static async searchByType(clcd: string): Promise<HospitalSearchResult> {
    return this.searchHospitals({ clcd });
  }
}

// 지역 코드 상수
export const REGION_CODES = {
  SEOUL: '110000', // 서울특별시
  BUSAN: '260000', // 부산광역시
  DAEGU: '270000', // 대구광역시
  INCHEON: '280000', // 인천광역시
  GWANGJU: '290000', // 광주광역시
  DAEJEON: '300000', // 대전광역시
  ULSAN: '310000', // 울산광역시
  GYEONGGI: '410000', // 경기도
  GANGWON: '420000', // 강원도
  CHUNGBUK: '430000', // 충청북도
  CHUNGNAM: '440000', // 충청남도
  JEONBUK: '450000', // 전라북도
  JEONNAM: '460000', // 전라남도
  GYEONGBUK: '470000', // 경상북도
  GYEONGNAM: '480000', // 경상남도
  JEJU: '490000', // 제주특별자치도
};

// 병원 종별 코드 상수
export const HOSPITAL_TYPE_CODES = {
  TERTIARY: '01', // 상급종합병원
  GENERAL: '11', // 종합병원
  HOSPITAL: '21', // 병원
  CLINIC: '31', // 의원
};
