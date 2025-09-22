import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, RewardAdOptions } from '@capacitor-community/admob';

export class AdMobService {
  private static readonly APP_ID = 'ca-app-pub-4735367527487227~7019721685';
  
  // 실제 광고 단위 ID
  private static readonly BANNER_AD_ID = 'ca-app-pub-4735367527487227/6345219671'; // 메인 배너 광고
  private static readonly INTERSTITIAL_AD_ID = 'ca-app-pub-4735367527487227/6692364720'; // 앱 열기 광고
  private static readonly REWARDED_AD_ID = 'ca-app-pub-3940256099942544/5224354917'; // 테스트 보상형

  /**
   * AdMob 초기화
   */
  static async initialize(): Promise<void> {
    try {
      await AdMob.initialize({
        testingDevices: ['TEST_DEVICE_ID'], // 테스트 기기 ID (선택사항)
        initializeForTesting: false, // 실제 배포 모드
      });
      console.log('AdMob 초기화 완료');
    } catch (error) {
      console.error('AdMob 초기화 실패:', error);
    }
  }

  /**
   * 배너 광고 표시
   */
  static async showBannerAd(): Promise<void> {
    try {
      const options: BannerAdOptions = {
        adId: this.BANNER_AD_ID,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: false, // 실제 배포 모드
      };

      await AdMob.showBanner(options);
      console.log('배너 광고 표시 완료');
    } catch (error) {
      console.error('배너 광고 표시 실패:', error);
    }
  }

  /**
   * 배너 광고 숨기기
   */
  static async hideBannerAd(): Promise<void> {
    try {
      await AdMob.hideBanner();
      console.log('배너 광고 숨김 완료');
    } catch (error) {
      console.error('배너 광고 숨김 실패:', error);
    }
  }

  /**
   * 전면 광고 표시
   */
  static async showInterstitialAd(): Promise<boolean> {
    try {
      const options = {
        adId: this.INTERSTITIAL_AD_ID,
        isTesting: false, // 실제 배포 모드
      };

      await AdMob.prepareInterstitial(options);
      await AdMob.showInterstitial();
      console.log('전면 광고 표시 완료');
      return true;
    } catch (error) {
      console.error('전면 광고 표시 실패:', error);
      return false;
    }
  }

  /**
   * 보상형 광고 표시
   */
  static async showRewardedAd(): Promise<boolean> {
    try {
      const options = {
        adId: this.REWARDED_AD_ID,
        isTesting: false, // 실제 배포 모드
      };

      await AdMob.prepareRewardVideoAd(options);
      await AdMob.showRewardVideoAd();
      console.log('보상형 광고 표시 완료');
      return true;
    } catch (error) {
      console.error('보상형 광고 표시 실패:', error);
      return false;
    }
  }

  /**
   * 모든 광고 제거
   */
  static async removeAllAds(): Promise<void> {
    try {
      await AdMob.removeBanner();
      console.log('모든 광고 제거 완료');
    } catch (error) {
      console.error('광고 제거 실패:', error);
    }
  }
}
