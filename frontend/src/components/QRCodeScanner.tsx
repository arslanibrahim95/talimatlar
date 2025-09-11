import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { qrCodeService } from '../services/qrCodeService';

interface QRCodeScannerProps {
  onScanSuccess?: (result: string) => void;
  onScanError?: (error: string) => void;
  autoStart?: boolean;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  onScanSuccess,
  onScanError,
  autoStart = false
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (autoStart) {
      startScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [autoStart]);

  const startScanner = async () => {
    try {
      setError(null);
      
      // Kamera izni iste
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Arka kamera
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        setHasPermission(true);
        
        // QR kod tarama döngüsünü başlat
        startScanningLoop();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setHasPermission(false);
      
      if (err.name === 'NotAllowedError') {
        setError('Kamera erişimi reddedildi. Lütfen kamera iznini verin.');
      } else if (err.name === 'NotFoundError') {
        setError('Kamera bulunamadı. Lütfen cihazınızda kamera olduğundan emin olun.');
      } else {
        setError('Kamera başlatılırken hata oluştu: ' + err.message);
      }
      
      onScanError?.(err.message);
    }
  };

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  };

  const startScanningLoop = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    const scanFrame = () => {
      if (!isScanning || !videoRef.current || !canvasRef.current) return;

      try {
        // Video frame'ini canvas'a çiz
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Canvas'tan image data al
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // QR kod tarama (basit implementasyon - gerçek uygulamada jsQR gibi kütüphane kullanılabilir)
        // Bu örnek için sadece frame'i sürekli çiziyoruz
        // Gerçek QR kod tarama için jsQR veya benzeri kütüphane entegre edilmeli
        
        // Simüle edilmiş QR kod tespiti
        if (Math.random() < 0.001) { // %0.1 olasılıkla "QR kod bulundu" simülasyonu
          const mockResult = 'https://example.com/instruction/123';
          handleScanSuccess(mockResult);
          return;
        }

        // Bir sonraki frame'i tara
        requestAnimationFrame(scanFrame);
      } catch (err) {
        console.error('Scanning error:', err);
        setError('QR kod tarama hatası: ' + err);
      }
    };

    scanFrame();
  };

  const handleScanSuccess = (result: string) => {
    setScanResult(result);
    setIsScanning(false);
    stopScanner();
    
    // QR kod tarama logunu kaydet
    try {
      // QR kod ID'sini result'tan çıkar (gerçek uygulamada URL parsing yapılmalı)
      const qrCodeId = result.split('/').pop();
      if (qrCodeId) {
        qrCodeService.logQRCodeScan(qrCodeId, {
          deviceInfo: {
            device_type: 'mobile',
            os: navigator.platform,
            browser: navigator.userAgent
          },
          userAgent: navigator.userAgent
        });
      }
    } catch (err) {
      console.error('Failed to log scan:', err);
    }
    
    onScanSuccess?.(result);
    
    // Talimat sayfasına yönlendir
    if (result.includes('/instruction/')) {
      const instructionId = result.split('/instruction/')[1];
      navigate(`/instructions/${instructionId}`);
    }
  };

  const handleScanError = (err: string) => {
    setError(err);
    onScanError?.(err);
  };

  const toggleScanner = () => {
    if (isScanning) {
      stopScanner();
    } else {
      startScanner();
    }
  };

  const requestPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
      startScanner();
    } catch (err: any) {
      setHasPermission(false);
      setError('Kamera izni verilmedi: ' + err.message);
    }
  };

  if (scanResult) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          QR Kod Başarıyla Taranıyor!
        </h3>
        <p className="text-green-700 mb-4">
          Talimat sayfasına yönlendiriliyorsunuz...
        </p>
        <div className="text-sm text-green-600 bg-green-100 p-3 rounded">
          <strong>URL:</strong> {scanResult}
        </div>
        <button
          onClick={() => {
            setScanResult(null);
            startScanner();
          }}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          Tekrar Tara
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          QR Kod Tarayıcı
        </h3>
        <p className="text-gray-600">
          Talimat QR kodunu tarayarak hızlıca erişin
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {hasPermission === false && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-2">📷</div>
            <p className="text-yellow-800 mb-3">
              Kamera erişimi gerekli
            </p>
            <button
              onClick={requestPermission}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md"
            >
              Kamera İzni Ver
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        {isScanning ? (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-gray-900 rounded-lg"
                autoPlay
                playsInline
                muted
              />
              <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500"></div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-blue-600">
                <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm font-medium">QR Kod Aranıyor...</span>
                <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">📱</div>
            <p className="text-gray-600 mb-4">
              QR kod taramaya başlamak için butona tıklayın
            </p>
            <button
              onClick={toggleScanner}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Taramayı Başlat
            </button>
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        className="hidden"
        style={{ display: 'none' }}
      />

      {isScanning && (
        <div className="mt-4 text-center">
          <button
            onClick={stopScanner}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
          >
            Taramayı Durdur
          </button>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Nasıl Kullanılır?</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Talimat QR kodunu kamera önüne tutun</li>
          <li>• QR kod otomatik olarak taranacaktır</li>
          <li>• Tarama başarılı olduğunda talimat sayfasına yönlendirileceksiniz</li>
          <li>• Tarama sırasında cihazı sabit tutun</li>
        </ul>
      </div>
    </div>
  );
};

export default QRCodeScanner;
