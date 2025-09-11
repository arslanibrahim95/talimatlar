import { InstructionQRCode, InstructionAccessLog } from '../types';
import { API_CONFIG, buildApiUrl } from '../config/api';

class QRCodeService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = buildApiUrl('INSTRUCTION_SERVICE', endpoint);
    const token = localStorage.getItem('auth_token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
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

  // QR kod oluştur
  async generateQRCode(instructionId: string, options?: {
    expiresAt?: string;
    customUrl?: string;
  }): Promise<InstructionQRCode> {
    try {
      const response = await this.request<InstructionQRCode>('/qr-codes', {
        method: 'POST',
        body: JSON.stringify({
          instructionId,
          ...options
        }),
      });
      return response;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw error;
    }
  }

  // Talimat için mevcut QR kodu getir
  async getQRCode(instructionId: string): Promise<InstructionQRCode | null> {
    try {
      const response = await this.request<InstructionQRCode>(`/qr-codes/${instructionId}`);
      return response;
    } catch (error) {
      if (error.message.includes('404')) {
        return null;
      }
      console.error('Failed to get QR code:', error);
      throw error;
    }
  }

  // QR kod tarama logu kaydet
  async logQRCodeScan(qrCodeId: string, scanData: {
    personnelId?: string;
    deviceInfo?: any;
    ipAddress?: string;
    userAgent?: string;
    location?: any;
  }): Promise<void> {
    try {
      await this.request(`/qr-codes/${qrCodeId}/scan`, {
        method: 'POST',
        body: JSON.stringify(scanData),
      });
    } catch (error) {
      console.error('Failed to log QR code scan:', error);
      // Log hatası kritik değil, sadece console'a yazdır
    }
  }

  // QR kod erişim loglarını getir
  async getAccessLogs(instructionId: string, page: number = 1, limit: number = 50): Promise<{
    data: InstructionAccessLog[];
    meta: any;
  }> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      const response = await this.request<{
        data: InstructionAccessLog[];
        meta: any;
      }>(`/qr-codes/${instructionId}/access-logs?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Failed to get access logs:', error);
      throw error;
    }
  }

  // QR kod istatistiklerini getir
  async getQRCodeStats(instructionId: string): Promise<{
    totalScans: number;
    uniqueScanners: number;
    lastScannedAt?: string;
    scanTrends: Array<{
      date: string;
      scanCount: number;
    }>;
  }> {
    try {
      const response = await this.request(`/qr-codes/${instructionId}/stats`);
      return response;
    } catch (error) {
      console.error('Failed to get QR code stats:', error);
      throw error;
    }
  }

  // QR kodu devre dışı bırak
  async deactivateQRCode(qrCodeId: string): Promise<void> {
    try {
      await this.request(`/qr-codes/${qrCodeId}/deactivate`, {
        method: 'PUT',
      });
    } catch (error) {
      console.error('Failed to deactivate QR code:', error);
      throw error;
    }
  }

  // QR kodu yeniden etkinleştir
  async activateQRCode(qrCodeId: string): Promise<void> {
    try {
      await this.request(`/qr-codes/${qrCodeId}/activate`, {
        method: 'PUT',
      });
    } catch (error) {
      console.error('Failed to activate QR code:', error);
      throw error;
    }
  }

  // QR kod süresini uzat
  async extendQRCodeExpiry(qrCodeId: string, newExpiryDate: string): Promise<void> {
    try {
      await this.request(`/qr-codes/${qrCodeId}/extend`, {
        method: 'PUT',
        body: JSON.stringify({ expiresAt: newExpiryDate }),
      });
    } catch (error) {
      console.error('Failed to extend QR code expiry:', error);
      throw error;
    }
  }

  // Toplu QR kod oluştur
  async generateBulkQRCodes(instructionIds: string[]): Promise<InstructionQRCode[]> {
    try {
      const response = await this.request<InstructionQRCode[]>('/qr-codes/bulk', {
        method: 'POST',
        body: JSON.stringify({ instructionIds }),
      });
      return response;
    } catch (error) {
      console.error('Failed to generate bulk QR codes:', error);
      throw error;
    }
  }

  // QR kod şablonlarını getir
  async getQRCodeTemplates(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    defaultExpiryDays: number;
    includeLogo: boolean;
    logoUrl?: string;
    customStyling?: any;
  }>> {
    try {
      const response = await this.request('/qr-codes/templates');
      return response;
    } catch (error) {
      console.error('Failed to get QR code templates:', error);
      throw error;
    }
  }

  // QR kod önizlemesi oluştur
  async generateQRCodePreview(instructionId: string, templateId?: string): Promise<{
    qrCodeImage: string;
    previewUrl: string;
    estimatedSize: {
      width: number;
      height: number;
    };
  }> {
    try {
      const params = new URLSearchParams();
      if (templateId) {
        params.append('templateId', templateId);
      }
      
      const response = await this.request(`/qr-codes/${instructionId}/preview?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Failed to generate QR code preview:', error);
      throw error;
    }
  }
}

export const qrCodeService = new QRCodeService();
