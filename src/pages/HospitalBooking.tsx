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
} from '@ionic/react';
import { arrowBack, search, location, call, chevronBack, chevronForward } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { App } from '@capacitor/app';
import { HospitalService, HospitalInfo } from '../services/hospitalService';
import './HospitalBooking.css';

// 병원 카드 컴포넌트
interface HospitalCardProps {
  hospital: HospitalInfo;
}

const HospitalCard: React.FC<HospitalCardProps> = ({ hospital }) => {
  const [isSelected, setIsSelected] = useState(false);

  const handleCardClick = () => {
    setIsSelected(!isSelected);
  };

  const handleCallClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    
    if (hospital.telno) {
      // 전화번호에서 숫자만 추출
      const phoneNumber = hospital.telno.replace(/[^0-9]/g, '');
      
      // 전화 앱으로 연결
      window.location.href = `tel:${phoneNumber}`;
      
      // 전화 통화 종료 감지 (Capacitor App 플러그인 사용)
      try {
        // 앱이 백그라운드로 갔다가 다시 포그라운드로 돌아올 때 감지
        const handleAppStateChange = () => {
          console.log('전화 통화 종료됨:', hospital.yadmNm);
          // 여기에 전화 통화 종료 후 실행할 로직 추가
          // 예: 통화 기록 저장, 사용자 피드백 등
        };

        // 앱 상태 변화 리스너 등록
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            // 앱이 다시 활성화되면 전화 통화가 종료된 것으로 간주
            setTimeout(handleAppStateChange, 500);
          }
        });
      } catch (error) {
        console.log('전화 통화 종료 감지 실패:', error);
        // 폴백: 단순 타이머 사용
        setTimeout(() => {
          console.log('전화 통화 종료됨 (폴백):', hospital.yadmNm);
        }, 3000);
      }
    }
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
      
      {/* 전화걸기 버튼 */}
      {hospital.telno && (
        <div className="hospital-actions">
          <button 
            className="call-button"
            onClick={handleCallClick}
          >
            <IonIcon icon={call} />
            전화걸기
          </button>
        </div>
      )}
    </div>
  );
};

interface UserInfo {
  name: string;
  birthDate: string;
  gender: string;
  시도: string;
  시군구: string;
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
  const [searchByLocation, setSearchByLocation] = useState(true); // 거주지 기준 검색 여부 (기본값: true)

  // 사용자 정보 로드
  useEffect(() => {
    const savedUserInfo = localStorage.getItem('userInfo');
    if (savedUserInfo) {
      const parsedUserInfo = JSON.parse(savedUserInfo);
      setUserInfo(parsedUserInfo);
    }
  }, []);

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
      if (searchByLocation && userInfo && userInfo.시도 && userInfo.시군구) {
        // 시도코드에 0000 붙이기
        const sidoCd = userInfo.시도 + '0000';
        const sgguCd = userInfo.시군구;
        
        searchParams.sidoCd = sidoCd;
        searchParams.sgguCd = sgguCd;
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
      <IonContent className="ion-padding">
        <div className="back-button-container">
          <IonButton 
            fill="clear" 
            onClick={() => history.goBack()}
            className="back-button"
          >
            <IonIcon icon={arrowBack} slot="start" />
            뒤로가기
          </IonButton>
        </div>
        
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>병원 명으로 예약하려는 병원을 검색해주세요</IonCardTitle>
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
            {userInfo && userInfo.시도 && userInfo.시군구 && (
              <div className="search-option-container">
                <div className="search-option-buttons">
                  <button 
                    className={`search-option-btn ${!searchByLocation ? 'active' : ''}`}
                    onClick={() => setSearchByLocation(false)}
                  >
                    전국 검색
                  </button>
                  <button 
                    className={`search-option-btn ${searchByLocation ? 'active' : ''}`}
                    onClick={() => setSearchByLocation(true)}
                  >
                    내 지역 검색
                  </button>
                </div>
              </div>
            )}

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
                    <div className="pagination-info">
                      {currentPage} / {totalPages} 페이지
                    </div>
                    <div className="pagination-buttons">
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
