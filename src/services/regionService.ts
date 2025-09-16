// 공공데이터포털 지역코드 API
// https://www.data.go.kr/iim/api/selectAPIAcountView.do

export interface RegionCode {
  코드: number;
  코드구분: string;
  코드명: string;
}

export interface RegionData {
  시도: RegionCode[];
  시군구: RegionCode[];
}

// API 키는 실제 키로 교체해야 합니다
const API_KEY = import.meta.env.VITE_REGION_API_KEY || 'f59bba5ced858802b0bbd4ba54677b128e3e528bbf41a8a0c47c342838573cb9';
const BASE_URL = 'https://api.odcloud.kr/api/15067469/v1/uddi:13d0a493-2417-4aee-a5d2-9f068fe399bc';

// 지역 데이터를 로컬 스토리지에 캐시
const REGION_CACHE_KEY = 'regionData';
const CACHE_EXPIRY_KEY = 'regionDataExpiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간

export class RegionService {
  /**
   * 지역 데이터를 가져옵니다 (캐시 우선)
   * @returns 지역 데이터 (시도, 시군구)
   */
  static async getRegionData(): Promise<RegionData> {
    // 캐시 강제 초기화 (하드코딩된 데이터 제거)
    this.clearCache();
    
    // API에서 데이터 가져오기
    const regionData = await this.fetchRegionDataFromAPI();
    
    // 캐시에 저장
    this.setCachedRegionData(regionData);
    
    return regionData;
  }

  /**
   * API에서 지역 데이터를 가져옵니다
   */
  private static async fetchRegionDataFromAPI(): Promise<RegionData> {
    try {
      // 올바른 API URL과 파라미터로 호출
      const url = `${BASE_URL}?page=1&perPage=999999&serviceKey=${API_KEY}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'Authorization': '*/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }
      
      const data = await response.json();
      
      // API 응답 구조에 따라 데이터 파싱
      return this.parseRegionData(data);
    } catch (error) {
      console.error('지역 데이터 API 호출 실패:', error);
      throw error;
    }
  }

  /**
   * API 응답 데이터를 파싱합니다
   */
  private static parseRegionData(apiResponse: any): RegionData {
    try {
      // 공공데이터포털 API 응답 구조에 맞게 파싱
      let allData: RegionCode[] = [];
      
      if (apiResponse.response && apiResponse.response.body && apiResponse.response.body.items) {
        const items = apiResponse.response.body.items.item;
        allData = Array.isArray(items) ? items : [items];
      } else if (apiResponse.data) {
        allData = Array.isArray(apiResponse.data) ? apiResponse.data : [apiResponse.data];
      } else if (apiResponse.items) {
        allData = Array.isArray(apiResponse.items) ? apiResponse.items : [apiResponse.items];
      }
      
      // 시도와 시군구로 분리
      const 시도 = allData.filter(item => item.코드구분 === "지역(시도)");
      const 시군구 = allData.filter(item => item.코드구분 === "지역(시군구)");

      return { 시도, 시군구 };
    } catch (error) {
      console.error('API 응답 파싱 실패:', error);
      throw new Error('지역 데이터 파싱에 실패했습니다.');
    }
  }

  /**
   * 캐시된 지역 데이터를 가져옵니다
   */
  private static getCachedRegionData(): RegionData | null {
    try {
      const cachedData = localStorage.getItem(REGION_CACHE_KEY);
      const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
      
      if (!cachedData || !expiry) {
        return null;
      }
      
      const now = new Date().getTime();
      if (now > parseInt(expiry)) {
        // 캐시 만료
        localStorage.removeItem(REGION_CACHE_KEY);
        localStorage.removeItem(CACHE_EXPIRY_KEY);
        return null;
      }
      
      return JSON.parse(cachedData);
    } catch (error) {
      console.error('캐시된 지역 데이터 로드 실패:', error);
      return null;
    }
  }

  /**
   * 지역 데이터를 캐시에 저장합니다
   */
  private static setCachedRegionData(data: RegionData): void {
    try {
      const expiry = new Date().getTime() + CACHE_DURATION;
      localStorage.setItem(REGION_CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_EXPIRY_KEY, expiry.toString());
    } catch (error) {
      console.error('지역 데이터 캐시 저장 실패:', error);
    }
  }

  /**
   * 캐시를 강제로 초기화합니다
   */
  private static clearCache(): void {
    try {
      localStorage.removeItem(REGION_CACHE_KEY);
      localStorage.removeItem(CACHE_EXPIRY_KEY);
    } catch (error) {
      console.error('캐시 초기화 실패:', error);
    }
  }

  /**
   * 선택된 시도에 해당하는 시군구 목록을 가져옵니다
   * @param 시도코드 선택된 시도 코드
   * @returns 해당 시도의 시군구 목록
   */
  static async get시군구By시도(시도코드: number): Promise<RegionCode[]> {
    const regionData = await this.getRegionData();
    
    // 시도 코드를 기반으로 시군구 필터링
    // 서울(11) -> 110001~110024, 부산(21) -> 210001~210016, 경기(31) -> 310001~310027
    const 시도코드Prefix = 시도코드 * 10000;
    
    return regionData.시군구.filter(item => {
      const itemPrefix = Math.floor(item.코드 / 1000) * 1000;
      return itemPrefix === 시도코드Prefix;
    });
  }

  /**
   * 시도 목록을 가져옵니다
   * @returns 시도 목록
   */
  static async get시도목록(): Promise<RegionCode[]> {
    const regionData = await this.getRegionData();
    return regionData.시도;
  }
}