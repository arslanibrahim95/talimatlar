import { 
  PersonnelLoginRequest,
  PersonnelLoginResponse,
  PersonnelVerificationRequest,
  PersonnelVerificationResponse,
  MFAMethod,
  MFASetup,
  MFACodeRequest,
  MFACodeVerification,
  DeviceInfo
} from '../types';
import { API_CONFIG, buildApiUrl } from '../config/api';

class PersonnelAuthService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = buildApiUrl('AUTH_SERVICE', endpoint);
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Personel giriş işlemi
  async personnelLogin(request: PersonnelLoginRequest): Promise<PersonnelLoginResponse> {
    return this.request<PersonnelLoginResponse>('/personnel/auth/login', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Doğrulama kodu gönderme
  async sendVerificationCode(request: MFACodeRequest): Promise<void> {
    return this.request<void>('/personnel/auth/send-code', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Doğrulama kodu kontrolü
  async verifyCode(request: PersonnelVerificationRequest): Promise<PersonnelVerificationResponse> {
    return this.request<PersonnelVerificationResponse>('/personnel/auth/verify', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // MFA yöntemlerini listele
  async getMFAMethods(personnelId: string): Promise<MFAMethod[]> {
    return this.request<MFAMethod[]>(`/personnel/auth/mfa-methods/${personnelId}`);
  }

  // MFA yöntemi ekleme
  async setupMFAMethod(setup: MFASetup): Promise<MFAMethod> {
    return this.request<MFAMethod>('/personnel/auth/setup-mfa', {
      method: 'POST',
      body: JSON.stringify(setup),
    });
  }

  // MFA yöntemi silme
  async removeMFAMethod(methodId: string): Promise<void> {
    return this.request<void>(`/personnel/auth/mfa-methods/${methodId}`, {
      method: 'DELETE',
    });
  }

  // Cihaz güvenilir olarak işaretleme
  async trustDevice(deviceId: string, personnelId: string): Promise<void> {
    return this.request<void>('/personnel/auth/trust-device', {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId, personnel_id: personnelId }),
    });
  }

  // Güvenilir cihazları listele
  async getTrustedDevices(personnelId: string): Promise<DeviceInfo[]> {
    return this.request<DeviceInfo[]>(`/personnel/auth/trusted-devices/${personnelId}`);
  }

  // Cihaz güvenilirliğini kaldırma
  async untrustDevice(deviceId: string, personnelId: string): Promise<void> {
    return this.request<void>('/personnel/auth/untrust-device', {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId, personnel_id: personnelId }),
    });
  }

  // Biyometrik doğrulama
  async verifyBiometric(deviceId: string, personnelId: string, biometricData: any): Promise<boolean> {
    try {
      const response = await this.request<{ success: boolean }>('/personnel/auth/verify-biometric', {
        method: 'POST',
        body: JSON.stringify({
          device_id: deviceId,
          personnel_id: personnelId,
          biometric_data: biometricData
        }),
      });
      return response.success;
    } catch (error) {
      console.error('Biometric verification failed:', error);
      return false;
    }
  }

  // Push notification ile doğrulama
  async sendPushNotification(deviceId: string, personnelId: string): Promise<void> {
    return this.request<void>('/personnel/auth/send-push', {
      method: 'POST',
      body: JSON.stringify({
        device_id: deviceId,
        personnel_id: personnelId
      }),
    });
  }

  // TOTP (Time-based One-Time Password) kurulumu
  async setupTOTP(personnelId: string): Promise<{ secret: string; qr_code: string }> {
    return this.request<{ secret: string; qr_code: string }>('/personnel/auth/setup-totp', {
      method: 'POST',
      body: JSON.stringify({ personnel_id: personnelId }),
    });
  }

  // TOTP doğrulama
  async verifyTOTP(personnelId: string, code: string): Promise<boolean> {
    try {
      const response = await this.request<{ success: boolean }>('/personnel/auth/verify-totp', {
        method: 'POST',
        body: JSON.stringify({
          personnel_id: personnelId,
          code: code
        }),
      });
      return response.success;
    } catch (error) {
      console.error('TOTP verification failed:', error);
      return false;
    }
  }

  // Cihaz bilgilerini al
  getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    // Cihaz tipini belirle
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      deviceType = 'mobile';
      if (/iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent)) {
        deviceType = 'tablet';
      }
    }

    // OS bilgisini çıkar
    let os = 'Unknown';
    if (/Android/i.test(userAgent)) os = 'Android';
    else if (/iPhone|iPad|iPod/i.test(userAgent)) os = 'iOS';
    else if (/Windows/i.test(userAgent)) os = 'Windows';
    else if (/Mac/i.test(userAgent)) os = 'macOS';
    else if (/Linux/i.test(userAgent)) os = 'Linux';

    // Browser bilgisini çıkar
    let browser = 'Unknown';
    if (/Chrome/i.test(userAgent)) browser = 'Chrome';
    else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/Safari/i.test(userAgent)) browser = 'Safari';
    else if (/Edge/i.test(userAgent)) browser = 'Edge';

    // Cihaz ID oluştur (localStorage'da saklanır)
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('device_id', deviceId);
    }

    return {
      device_id: deviceId,
      device_type: deviceType,
      os: os,
      browser: browser,
      app_version: '1.0.0', // App version bilgisi
      location: undefined // Konum bilgisi kullanıcı izni ile alınır
    };
  }

  // Konum bilgisini al (kullanıcı izni gerekli)
  async getLocation(): Promise<{ latitude: number; longitude: number; city?: string; country?: string } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Reverse geocoding ile şehir/ülke bilgisi al
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
            );
            const data = await response.json();
            
            resolve({
              latitude,
              longitude,
              city: data.address?.city || data.address?.town,
              country: data.address?.country
            });
          } catch (error) {
            resolve({ latitude, longitude });
          }
        },
        () => resolve(null),
        { timeout: 10000, enableHighAccuracy: false }
      );
    });
  }

  // Güvenlik log kaydı
  async logSecurityEvent(event: string, personnelId: string, deviceId: string, details?: any): Promise<void> {
    try {
      await this.request<void>('/personnel/auth/security-log', {
        method: 'POST',
        body: JSON.stringify({
          event,
          personnel_id: personnelId,
          device_id: deviceId,
          timestamp: new Date().toISOString(),
          details,
          ip_address: await this.getClientIP()
        }),
      });
    } catch (error) {
      console.error('Security log failed:', error);
    }
  }

  // Client IP adresini al
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }
}

export const personnelAuthService = new PersonnelAuthService();
