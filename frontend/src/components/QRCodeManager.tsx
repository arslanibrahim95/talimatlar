import React, { useState, useEffect } from 'react';
import { Instruction, InstructionQRCode } from '../types';
import { qrCodeService } from '../services/qrCodeService';
import { instructionService } from '../services/instructionService';

interface QRCodeManagerProps {
  instruction: Instruction;
  onQRCodeGenerated?: (qrCode: InstructionQRCode) => void;
  onQRCodeDeleted?: () => void;
}

const QRCodeManager: React.FC<QRCodeManagerProps> = ({
  instruction,
  onQRCodeGenerated,
  onQRCodeDeleted
}) => {
  const [qrCode, setQrCode] = useState<InstructionQRCode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQRCode();
  }, [instruction.id]);

  const loadQRCode = async () => {
    try {
      setIsLoading(true);
      const existingQRCode = await qrCodeService.getQRCode(instruction.id);
      setQrCode(existingQRCode);
    } catch (error) {
      console.error('Failed to load QR code:', error);
      setError('QR kod yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const generateQRCode = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const options: any = {};
      if (expiryDate) {
        options.expiresAt = expiryDate;
      }
      if (customUrl) {
        options.customUrl = customUrl;
      }

      const newQRCode = await qrCodeService.generateQRCode(instruction.id, options);
      setQrCode(newQRCode);
      setShowOptions(false);
      onQRCodeGenerated?.(newQRCode);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      setError('QR kod oluşturulurken hata oluştu');
    } finally {
      setIsGenerating(false);
    }
  };

  const deactivateQRCode = async () => {
    if (!qrCode) return;
    
    try {
      await qrCodeService.deactivateQRCode(qrCode.id);
      setQrCode({ ...qrCode, isActive: false });
    } catch (error) {
      console.error('Failed to deactivate QR code:', error);
      setError('QR kod devre dışı bırakılırken hata oluştu');
    }
  };

  const activateQRCode = async () => {
    if (!qrCode) return;
    
    try {
      await qrCodeService.activateQRCode(qrCode.id);
      setQrCode({ ...qrCode, isActive: true });
    } catch (error) {
      console.error('Failed to activate QR code:', error);
      setError('QR kod etkinleştirilirken hata oluştu');
    }
  };

  const extendExpiry = async () => {
    if (!qrCode || !expiryDate) return;
    
    try {
      await qrCodeService.extendQRCodeExpiry(qrCode.id, expiryDate);
      setQrCode({ ...qrCode, expiresAt: expiryDate });
      setShowOptions(false);
    } catch (error) {
      console.error('Failed to extend expiry:', error);
      setError('Süre uzatılırken hata oluştu');
    }
  };

  const downloadQRCode = () => {
    if (!qrCode?.qrCodeImage) return;
    
    const link = document.createElement('a');
    link.href = qrCode.qrCodeImage;
    link.download = `qr-code-${instruction.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyAccessUrl = () => {
    if (!qrCode?.accessUrl) return;
    
    navigator.clipboard.writeText(qrCode.accessUrl).then(() => {
      // Show success message
      alert('Erişim URL\'i kopyalandı!');
    }).catch(() => {
      setError('URL kopyalanamadı');
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          QR Kod Yönetimi
        </h3>
        {!qrCode && (
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            QR Kod Oluştur
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {showOptions && !qrCode && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Son Kullanma Tarihi (Opsiyonel)
              </label>
              <input
                type="datetime-local"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Özel URL (Opsiyonel)
              </label>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/custom-path"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={generateQRCode}
              disabled={isGenerating}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              {isGenerating ? 'Oluşturuluyor...' : 'QR Kod Oluştur'}
            </button>
            <button
              onClick={() => setShowOptions(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {qrCode && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                qrCode.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {qrCode.isActive ? 'Aktif' : 'Devre Dışı'}
              </span>
              {qrCode.expiresAt && (
                <span className="text-sm text-gray-500">
                  Son Kullanma: {new Date(qrCode.expiresAt).toLocaleDateString('tr-TR')}
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              {qrCode.isActive ? (
                <button
                  onClick={deactivateQRCode}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                >
                  Devre Dışı Bırak
                </button>
              ) : (
                <button
                  onClick={activateQRCode}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                >
                  Etkinleştir
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            <div className="text-center">
              <img
                src={qrCode.qrCodeImage}
                alt="QR Code"
                className="w-48 h-48 border border-gray-300 rounded-lg"
              />
              <div className="mt-2 text-sm text-gray-600">
                Tarama Sayısı: {qrCode.scanCount}
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Erişim URL'i
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={qrCode.accessUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm"
                  />
                  <button
                    onClick={copyAccessUrl}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
                  >
                    Kopyala
                  </button>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={downloadQRCode}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-medium"
                >
                  QR Kodu İndir
                </button>
                <button
                  onClick={() => setShowOptions(true)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm font-medium"
                >
                  Süreyi Uzat
                </button>
              </div>

              {showOptions && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Yeni Son Kullanma Tarihi
                    </label>
                    <input
                      type="datetime-local"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={extendExpiry}
                      disabled={!expiryDate}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
                    >
                      Süreyi Uzat
                    </button>
                    <button
                      onClick={() => setShowOptions(false)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!qrCode && !showOptions && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-6xl mb-4">📱</div>
          <p className="text-lg font-medium mb-2">QR Kod Henüz Oluşturulmamış</p>
          <p className="text-sm">
            Çalışanların talimata kolayca erişebilmesi için QR kod oluşturun.
          </p>
        </div>
      )}
    </div>
  );
};

export default QRCodeManager;
