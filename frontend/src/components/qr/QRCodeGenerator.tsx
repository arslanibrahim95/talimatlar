import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { 
  QrCode, 
  Download, 
  Share2, 
  Copy, 
  Eye,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface QRCodeConfig {
  size: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
  color: {
    foreground: string;
    background: string;
  };
}

interface QRCodeData {
  type: 'instruction' | 'document' | 'url' | 'text' | 'contact';
  content: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

const QRCodeGenerator: React.FC = () => {
  const [qrData, setQrData] = useState<QRCodeData>({
    type: 'instruction',
    content: '',
    title: '',
    description: ''
  });
  
  const [config, setConfig] = useState<QRCodeConfig>({
    size: 256,
    errorCorrectionLevel: 'M',
    margin: 4,
    color: {
      foreground: '#000000',
      background: '#ffffff'
    }
  });
  
  const [generatedQR, setGeneratedQR] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);

  const generateQRCode = async () => {
    if (!qrData.content.trim()) {
      setError('İçerik boş olamaz');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccess('');

    try {
      // Simulate QR code generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, you would use a QR code library like qrcode.js
      // For now, we'll create a placeholder
      const qrCodeData = {
        type: qrData.type,
        content: qrData.content,
        title: qrData.title,
        description: qrData.description,
        metadata: qrData.metadata,
        config: config,
        timestamp: new Date().toISOString()
      };

      // Create a data URL for the QR code (placeholder)
      const canvas = document.createElement('canvas');
      canvas.width = config.size;
      canvas.height = config.size;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw background
        ctx.fillStyle = config.color.background;
        ctx.fillRect(0, 0, config.size, config.size);
        
        // Draw QR code pattern (simplified)
        ctx.fillStyle = config.color.foreground;
        const cellSize = config.size / 25;
        for (let i = 0; i < 25; i++) {
          for (let j = 0; j < 25; j++) {
            if ((i + j) % 3 === 0) {
              ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
            }
          }
        }
        
        // Add text overlay
        ctx.fillStyle = config.color.foreground;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code', config.size / 2, config.size - 10);
      }
      
      const dataURL = canvas.toDataURL('image/png');
      setGeneratedQR(dataURL);
      setSuccess('QR kod başarıyla oluşturuldu');
    } catch (error) {
      console.error('QR generation error:', error);
      setError('QR kod oluşturulurken bir hata oluştu');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQR = () => {
    if (!generatedQR) return;
    
    const link = document.createElement('a');
    link.download = `qr-code-${qrData.type}-${Date.now()}.png`;
    link.href = generatedQR;
    link.click();
  };

  const copyQR = () => {
    if (!generatedQR) return;
    
    // Copy the data URL to clipboard
    navigator.clipboard.writeText(generatedQR).then(() => {
      setSuccess('QR kod kopyalandı');
    }).catch(() => {
      setError('Kopyalama başarısız');
    });
  };

  const shareQR = async () => {
    if (!generatedQR) return;
    
    try {
      // Convert data URL to blob
      const response = await fetch(generatedQR);
      const blob = await response.blob();
      
      if (navigator.share && navigator.canShare({ files: [new File([blob], 'qr-code.png', { type: 'image/png' })] })) {
        await navigator.share({
          title: qrData.title || 'QR Kod',
          text: qrData.description || 'Oluşturulan QR kod',
          files: [new File([blob], 'qr-code.png', { type: 'image/png' })]
        });
      } else {
        // Fallback to copying link
        const shareUrl = `${window.location.origin}/qr/${btoa(qrData.content)}`;
        await navigator.clipboard.writeText(shareUrl);
        setSuccess('Paylaşım linki kopyalandı');
      }
    } catch (error) {
      console.error('Share error:', error);
      setError('Paylaşım başarısız');
    }
  };

  const getQRContentPlaceholder = (type: string) => {
    switch (type) {
      case 'instruction':
        return 'https://claude-talimat.com/instruction/123';
      case 'document':
        return 'https://claude-talimat.com/document/456';
      case 'url':
        return 'https://example.com';
      case 'text':
        return 'Merhaba, bu bir QR kod mesajıdır';
      case 'contact':
        return 'BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL:+1234567890\nEMAIL:john@example.com\nEND:VCARD';
      default:
        return '';
    }
  };

  const getQRTypeLabel = (type: string) => {
    switch (type) {
      case 'instruction':
        return 'Talimat';
      case 'document':
        return 'Doküman';
      case 'url':
        return 'URL';
      case 'text':
        return 'Metin';
      case 'contact':
        return 'İletişim';
      default:
        return 'Bilinmeyen';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="w-6 h-6 text-blue-600" />
            <span>QR Kod Oluşturucu</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Type Selection */}
          <div>
            <Label htmlFor="qrType">QR Kod Türü</Label>
            <Select
              value={qrData.type}
              onValueChange={(value) => {
                setQrData(prev => ({
                  ...prev,
                  type: value as QRCodeData['type'],
                  content: getQRContentPlaceholder(value)
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="QR kod türü seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instruction">Talimat</SelectItem>
                <SelectItem value="document">Doküman</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="text">Metin</SelectItem>
                <SelectItem value="contact">İletişim</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Başlık</Label>
            <Input
              id="title"
              value={qrData.title}
              onChange={(e) => setQrData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={`${getQRTypeLabel(qrData.type)} başlığı`}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Input
              id="description"
              value={qrData.description || ''}
              onChange={(e) => setQrData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="QR kod açıklaması (isteğe bağlı)"
            />
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content">İçerik *</Label>
            <Input
              id="content"
              value={qrData.content}
              onChange={(e) => setQrData(prev => ({ ...prev, content: e.target.value }))}
              placeholder={getQRContentPlaceholder(qrData.type)}
            />
            <p className="text-sm text-gray-500 mt-1">
              {qrData.type === 'instruction' && 'Talimat URL\'si girin'}
              {qrData.type === 'document' && 'Doküman URL\'si girin'}
              {qrData.type === 'url' && 'Web sitesi URL\'si girin'}
              {qrData.type === 'text' && 'Görüntülenecek metni girin'}
              {qrData.type === 'contact' && 'vCard formatında iletişim bilgisi girin'}
            </p>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateQRCode}
            disabled={isGenerating || !qrData.content.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Settings className="w-4 h-4 mr-2 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4 mr-2" />
                QR Kod Oluştur
              </>
            )}
          </Button>

          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">{success}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated QR Code */}
      {generatedQR && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-green-600" />
              <span>Oluşturulan QR Kod</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="inline-block p-4 bg-white rounded-lg shadow-lg">
                <img
                  src={generatedQR}
                  alt="Generated QR Code"
                  className="max-w-full h-auto"
                  ref={qrRef}
                />
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Tür:</strong> {getQRTypeLabel(qrData.type)}</p>
                {qrData.title && <p><strong>Başlık:</strong> {qrData.title}</p>}
                {qrData.description && <p><strong>Açıklama:</strong> {qrData.description}</p>}
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <Button onClick={downloadQR} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  İndir
                </Button>
                <Button onClick={copyQR} variant="outline" size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Kopyala
                </Button>
                <Button onClick={shareQR} variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Paylaş
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Code Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <span>QR Kod Ayarları</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="size">Boyut (px)</Label>
              <Input
                id="size"
                type="number"
                value={config.size}
                onChange={(e) => setConfig(prev => ({ ...prev, size: parseInt(e.target.value) || 256 }))}
                min="64"
                max="1024"
                step="32"
              />
            </div>
            
            <div>
              <Label htmlFor="errorCorrection">Hata Düzeltme</Label>
              <Select
                value={config.errorCorrectionLevel}
                onValueChange={(value) => setConfig(prev => ({ ...prev, errorCorrectionLevel: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Düşük (L)</SelectItem>
                  <SelectItem value="M">Orta (M)</SelectItem>
                  <SelectItem value="Q">Yüksek (Q)</SelectItem>
                  <SelectItem value="H">En Yüksek (H)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="foregroundColor">Ön Plan Rengi</Label>
              <div className="flex space-x-2">
                <Input
                  id="foregroundColor"
                  type="color"
                  value={config.color.foreground}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    color: { ...prev.color, foreground: e.target.value }
                  }))}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={config.color.foreground}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    color: { ...prev.color, foreground: e.target.value }
                  }))}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="backgroundColor">Arka Plan Rengi</Label>
              <div className="flex space-x-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={config.color.background}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    color: { ...prev.color, background: e.target.value }
                  }))}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={config.color.background}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    color: { ...prev.color, background: e.target.value }
                  }))}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeGenerator;
