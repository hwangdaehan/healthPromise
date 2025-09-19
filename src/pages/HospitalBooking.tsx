import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonList,
  IonRadio,
  IonRadioGroup,
  IonHeader,
  IonToolbar,
  IonTitle,
} from '@ionic/react';
import { arrowBack, search, location, call, chevronBack, chevronForward, star, starOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { App } from '@capacitor/app';
import { HospitalService, HospitalInfo } from '../services/hospitalService';
import { addFavoriteHospital, removeFavoriteHospital, isHospitalFavorite } from '../services/favoriteHospitalService';
import { RegionService } from '../services/regionService';
import AppointmentModal, { AppointmentData } from '../components/AppointmentModal';
import './HospitalBooking.css';

// 병원 카드 컴포넌트
interface HospitalCardProps {
  hospital: HospitalInfo;
}

const HospitalCard: React.FC<HospitalCardProps> = ({ hospital }) => {
  const [isSelected, setIsSelected] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  // 컴포넌트 마운트 시 즐겨찾기 상태 확인
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (hospital.ykiho) {
        const favorite = await isHospitalFavorite(hospital.ykiho);
        setIsFavorite(favorite);
      }
    };
    checkFavoriteStatus();
  }, [hospital.ykiho]);

  // 앱 상태 변화 감지 (전화걸기 후 복귀)
  useEffect(() => {
    const handleAppStateChange = () => {
      // 전화걸기 후 앱으로 돌아왔을 때 예약 모달 표시
      const lastCallTime = localStorage.getItem('lastCallTime');
      
      if (lastCallTime) {
        setShowAppointmentModal(true);
        localStorage.removeItem('lastCallTime');
      }
    };

    // Capacitor App Plugin으로 앱 상태 변화 감지
    const setupAppStateListener = async () => {
      try {
        // 앱 상태 변화 리스너 등록
        const listener = await App.addListener('appStateChange', ({ isActive }) => {
          console.log('앱 상태 변화:', isActive ? '활성화' : '비활성화');
          
          if (isActive) {
            // 앱이 다시 활성화됨 (통화 종료 후 복귀)
            setTimeout(() => {
              handleAppStateChange();
            }, 500); // 약간의 지연을 두어 안정성 확보
          }
        });

        // 컴포넌트 마운트 시에도 체크
        handleAppStateChange();

        // 정리 함수에서 리스너 제거
        return () => {
          listener.remove();
        };
      } catch (error) {
        console.error('앱 상태 리스너 설정 실패:', error);
        
        // 폴백: 기존 window focus 이벤트 사용
        const handleFocus = () => {
          handleAppStateChange();
        };

        window.addEventListener('focus', handleFocus);
        handleAppStateChange();

        return () => {
          window.removeEventListener('focus', handleFocus);
        };
      }
    };

    const cleanup = setupAppStateListener();

    return () => {
      if (cleanup) {
        cleanup.then(cleanupFn => cleanupFn && cleanupFn());
      }
    };
  }, []);

  const handleCardClick = () => {
    setIsSelected(!isSelected);
  };

  const handleCallClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    
    if (hospital.telno) {
      // 전화번호에서 숫자만 추출
      const phoneNumber = hospital.telno.replace(/[^0-9]/g, '');
      
      // 전화걸기 시간과 병원 정보 저장
      localStorage.setItem('lastCallTime', Date.now().toString());
      localStorage.setItem('lastCallHospital', JSON.stringify({
        name: hospital.yadmNm,
        phone: hospital.telno,
        address: hospital.addr
      }));
      
      // 전화 앱으로 연결
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    
    if (isLoadingFavorite) return;
    
    setIsLoadingFavorite(true);
    
    try {
      if (isFavorite) {
        // 즐겨찾기에서 제거 (현재는 전체 목록에서 제거하는 방식)
        // 실제로는 favoriteId가 필요하지만, 간단히 dataId로 처리
        console.log('즐겨찾기에서 제거:', hospital.yadmNm);
        setIsFavorite(false);
      } else {
        // 즐겨찾기에 추가
        await addFavoriteHospital({
          hospitalId: hospital.ykiho || '',
          hospitalName: hospital.yadmNm || '',
          address: hospital.addr || '',
          phoneNumber: hospital.telno || '',
          specialties: [],
          dataId: hospital.ykiho || '',
          name: hospital.yadmNm || '',
          telNo: hospital.telno || '',
        });
        console.log('즐겨찾기에 추가:', hospital.yadmNm);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('즐겨찾기 처리 실패:', error);
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  // 예약 저장 핸들러
  const handleSaveAppointment = (appointmentData: AppointmentData) => {
    console.log('예약 정보 저장:', appointmentData);
    // TODO: Firebase에 예약 정보 저장
    alert('예약이 등록되었습니다!');
  };

  // 예약 모달 닫기 핸들러
  const handleCloseAppointmentModal = () => {
    setShowAppointmentModal(false);
  };

  // 저장된 병원 정보 가져오기
  const getLastCallHospital = () => {
    const hospitalData = localStorage.getItem('lastCallHospital');
    if (hospitalData) {
      return JSON.parse(hospitalData);
    }
    return {
      name: hospital.yadmNm,
      phone: hospital.telno,
      address: hospital.addr
    };
  };

  return (
    <div 
      className={`hospital-card ${isSelected ? 'selected' : ''}`}
      onClick={handleCardClick}
    >
      <div className="hospital-info">
        <h2 className="hospital-name">{hospital.yadmNm}</h2>
        <div className="hospital-details">
          <div className="hospital-address">
            <IonIcon icon={location} className="detail-icon" />
            <span>{hospital.addr}</span>
          </div>
          {hospital.telno && (
            <div className="hospital-phone">
              <IonIcon icon={call} className="detail-icon" />
              <span>{hospital.telno}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* 액션 버튼들 */}
      <div className="hospital-actions">
        {/* 전화걸기 버튼 */}
        {hospital.telno && (
          <button 
            className="call-button"
            onClick={handleCallClick}
          >
            <IonIcon icon={call} />
            전화걸기
          </button>
        )}
        
        {/* 즐겨찾기 버튼 */}
        <button 
          className={`favorite-button ${isFavorite ? 'favorited' : ''}`}
          onClick={handleFavoriteClick}
          disabled={isLoadingFavorite}
        >
          <IonIcon icon={isFavorite ? star : starOutline} />
          {isLoadingFavorite ? '처리중...' : (isFavorite ? '즐겨찾기' : '즐겨찾기')}
        </button>
      </div>
      
      {/* 예약 등록 모달 */}
      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={handleCloseAppointmentModal}
        hospitalName={getLastCallHospital().name}
        hospitalPhone={getLastCallHospital().phone}
        hospitalAddress={getLastCallHospital().address}
        onSave={handleSaveAppointment}
      />
    </div>
  );
};

interface UserInfo {
  name: string;
  birthDate: string;
  gender: string;
  시도?: string;
  시군구?: string;
  sido?: string;
  sigungu?: string;
}

const HospitalBooking: React.FC = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [hospitalName, setHospitalName] = useState('');
  const [searchResults, setSearchResults] = useState<HospitalInfo[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // 검색을 시도했는지 추적
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(10); // 페이지당 10개 결과
  
  // 사용자 정보 및 검색 옵션
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [searchByLocation, setSearchByLocation] = useState(true); // 거주지 기준 검색 여부 (기본값: true - 내 지역 검색)
  const [regionNames, setRegionNames] = useState<{sido: string, sigungu: string} | null>(null);

  // 사용자 정보 로드
  useEffect(() => {
    // userSession에서 사용자 정보 로드
    const userSession = localStorage.getItem('userSession');
    if (userSession) {
      const sessionData = JSON.parse(userSession);
      console.log('HospitalBooking - 로드된 사용자 세션:', sessionData);
      setUserInfo(sessionData);
      
      // 지역명 가져오기
      if (sessionData.sido && sessionData.sigungu) {
        loadRegionNames(sessionData.sido, sessionData.sigungu);
      }
    } else {
      // 기존 localStorage 방식도 지원 (하위 호환성)
      const savedUserInfo = localStorage.getItem('userInfo');
      if (savedUserInfo) {
        const parsedUserInfo = JSON.parse(savedUserInfo);
        console.log('HospitalBooking - 로드된 사용자 정보 (기존 방식):', parsedUserInfo);
        setUserInfo(parsedUserInfo);
        
        // 지역명 가져오기
        if (parsedUserInfo.시도 && parsedUserInfo.시군구) {
          loadRegionNames(parsedUserInfo.시도, parsedUserInfo.시군구);
        }
      } else {
        console.log('HospitalBooking - 사용자 정보가 없습니다.');
      }
    }
  }, []);

  // 지역명 로드 함수
  const loadRegionNames = async (sidoCode: string, sigunguCode: string) => {
    try {
      const sidoList = await RegionService.get시도목록();
      const sigunguList = await RegionService.get시군구By시도(parseInt(sidoCode));
      
      const sidoName = sidoList.find(sido => sido.코드.toString() === sidoCode)?.코드명 || sidoCode;
      const sigunguName = sigunguList.find(sigungu => sigungu.코드.toString() === sigunguCode)?.코드명 || sigunguCode;
      
      setRegionNames({ sido: sidoName, sigungu: sigunguName });
    } catch (error) {
      console.error('지역명 로드 실패:', error);
      setRegionNames({ sido: sidoCode, sigungu: sigunguCode });
    }
  };

  // 병원 검색 함수
  const searchHospitals = async (page: number) => {
    if (!hospitalName.trim()) {
      console.log('병원명을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setSearchResults([]);
    setShowResults(false);
    setHasSearched(true); // 검색 시도했음을 표시
    
    try {
      // 검색 파라미터 설정
      const searchParams: any = {
        yadmNm: hospitalName,
        pageNo: page,
        numOfRows: itemsPerPage
      };

      // 거주지 기준 검색이 활성화되고 사용자 정보가 있는 경우
      if (searchByLocation && userInfo) {
        const sido = userInfo.시도 || userInfo.sido;
        const sigungu = userInfo.시군구 || userInfo.sigungu;
        
        if (sido && sigungu) {
          // 시도코드에 0000 붙이기
          const sidoCd = sido + '0000';
          const sgguCd = sigungu;
          
          searchParams.sidoCd = sidoCd;
          searchParams.sgguCd = sgguCd;
        }
      }

      const result = await HospitalService.searchHospitals(searchParams);
      setSearchResults(result.hospitals);
      setCurrentPage(result.currentPage);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
      setShowResults(true);
      
      // 검색 결과 영역으로 스크롤
      setTimeout(() => {
        const resultsElement = document.querySelector('.search-results-container');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (error) {
      console.error('병원 검색 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 페이지네이션 함수들
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      searchHospitals(page);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>건강 약속</IonTitle>
          <IonButton 
            fill="clear" 
            onClick={() => history.goBack()}
            className="back-button"
            slot="end"
          >
            <IonIcon icon={arrowBack} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>예약 병원을 검색해주세요</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonInput
                value={hospitalName}
                onIonInput={(e) => setHospitalName(e.detail.value!)}
                placeholder="병원명을 입력하세요"
                clearInput={true}
              />
            </IonItem>

            {/* 거주지 기준 검색 옵션 */}
            <div className="search-option-container">
              <div className="tab-buttons">
                <button 
                  className={`tab-button ${!searchByLocation ? 'active' : ''}`}
                  onClick={() => setSearchByLocation(false)}
                >
                  전체 보기
                </button>
                {userInfo && (userInfo.시도 || userInfo.sido) && (userInfo.시군구 || userInfo.sigungu) && (
                  <button 
                    className={`tab-button ${searchByLocation ? 'active' : ''}`}
                    onClick={() => setSearchByLocation(true)}
                  >
                    {regionNames ? `${regionNames.sigungu.replace(/동안구$/, '')} 보기` : '내 지역 보기'}
                  </button>
                )}
              </div>
            </div>

            <div className="custom-search-button" onClick={() => {
              setCurrentPage(1);
              searchHospitals(1);
            }}>
              <IonIcon icon={search} className="search-icon" />
              <span className="search-text">
                {isLoading ? '검색 중...' : '병원 검색하기'}
              </span>
            </div>
          </IonCardContent>
        </IonCard>

        {/* 검색 결과 카드들 */}
        {searchResults.length > 0 && (
          <div className="search-results-container">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>검색 결과 (총 {totalCount}개)</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="hospital-cards-list">
                  {searchResults.map((hospital, index) => (
                    <HospitalCard 
                      key={hospital.ykiho || index} 
                      hospital={hospital} 
                    />
                  ))}
                </div>
                
                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="pagination-container">
                    <div className="pagination-buttons">
                      <div className="pagination-info">
                        총 {totalPages} 페이지
                      </div>
                      <button 
                        className="pagination-btn prev-btn"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                      >
                        <IonIcon icon={chevronBack} />
                        이전
                      </button>
                      
                      <div className="page-numbers">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                              onClick={() => goToPage(pageNum)}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button 
                        className="pagination-btn next-btn"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                      >
                        다음
                        <IonIcon icon={chevronForward} />
                      </button>
                    </div>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* 검색 결과가 없을 때 */}
        {!isLoading && searchResults.length === 0 && hasSearched && (
          <div className="no-results-container">
            <IonCard>
              <IonCardContent>
                <p style={{ textAlign: 'center', color: '#666', fontSize: '18px' }}>
                  검색 결과가 없습니다.
                </p>
                <p style={{ textAlign: 'center', color: '#999', fontSize: '16px' }}>
                  다른 병원명으로 검색해보세요.
                </p>
              </IonCardContent>
            </IonCard>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default HospitalBooking;
