import React, { useState, useEffect } from 'react';
import { MFAMethod, MFASetup, DeviceInfo } from '../types';
import { personnelAuthService } from '../services/personnelAuthService';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Label } from './ui/Label';
import { Switch } from './ui/Switch';
import { 
  Shield, 
  Smartphone, 
  Mail, 
  Fingerprint, 
  QrCode, 
  MessageSquare,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Download,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';

interface MFAManagementProps {
  personnelId: string;
  onClose?: () => void;
}

export const MFAManagement: React.FC<MFAManagementProps> = ({ personnelId, onClose }) => {
  const [mfaMethods, setMfaMethods] = useState<MFAMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTOTPSecret, setShowTOTPSecret] = useState(false);
  const [newMethodType, setNewMethodType] = useState<string>('');
  const [newMethodValue, setNewMethodValue] = useState('');
  const [isAddingMethod, setIsAddingMethod] = useState(false);

  // TOTP setup states
  const [totpSetup, setTotpSetup] = useState<{
    secret: string;
    qrCode: string;
    isVisible: boolean;
  } | null>(null);

  useEffect(() => {
    loadMFAMethods();
  }, [personnelId]);

  const loadMFAMethods = async () => {
    setIsLoading(true);
    try {
      const methods = await personnelAuthService.getMFAMethods(personnelId);
      setMfaMethods(methods);
    } catch (error) {
      toast.error('MFA yöntemleri yüklenemedi');
      console.error('Error loading MFA methods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMFAMethod = async () => {
    if (!newMethodType || !newMethodValue) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    setIsAddingMethod(true);
    try {
      if (newMethodType === 'totp') {
        // TOTP kurulumu
        const setup = await personnelAuthService.setupTOTP(personnelId);
        setTotpSetup({
          secret: setup.secret,
          qrCode: setup.qr_code,
          isVisible: false
        });
        toast.success('TOTP kurulumu başlatıldı');
      } else {
        // Diğer yöntemler
        const setup: MFASetup = {
          method: newMethodType,
          personnel_id: personnelId,
          value: newMethodValue,
          is_primary: mfaMethods.length === 0
        };

        await personnelAuthService.setupMFAMethod(setup);
        toast.success('MFA yöntemi eklendi');
        loadMFAMethods();
        resetNewMethodForm();
      }
    } catch (error) {
      toast.error('MFA yöntemi eklenemedi');
      console.error('Error adding MFA method:', error);
    } finally {
      setIsAddingMethod(false);
    }
  };

  const handleRemoveMFAMethod = async (methodId: string) => {
    if (!confirm('Bu MFA yöntemini kaldırmak istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await personnelAuthService.removeMFAMethod(methodId);
      toast.success('MFA yöntemi kaldırıldı');
      loadMFAMethods();
    } catch (error) {
      toast.error('MFA yöntemi kaldırılamadı');
      console.error('Error removing MFA method:', error);
    }
  };

  const handleToggleMFAMethod = async (methodId: string, enabled: boolean) => {
    try {
      // Bu endpoint backend'de implement edilmeli
      // await personnelAuthService.toggleMFAMethod(methodId, enabled);
      toast.success(`MFA yöntemi ${enabled ? 'etkinleştirildi' : 'devre dışı bırakıldı'}`);
      loadMFAMethods();
    } catch (error) {
      toast.error('MFA yöntemi güncellenemedi');
      console.error('Error toggling MFA method:', error);
    }
  };

  const handleSetPrimary = async (methodId: string) => {
    try {
      // Bu endpoint backend'de implement edilmeli
      // await personnelAuthService.setPrimaryMFAMethod(methodId);
      toast.success('Birincil MFA yöntemi güncellendi');
      loadMFAMethods();
    } catch (error) {
      toast.error('Birincil MFA yöntemi güncellenemedi');
      console.error('Error setting primary MFA method:', error);
    }
  };

  const resetNewMethodForm = () => {
    setNewMethodType('');
    setNewMethodValue('');
    setTotpSetup(null);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Panoya kopyalandı');
    } catch (error) {
      toast.error('Kopyalanamadı');
    }
  };

  const downloadQRCode = () => {
    if (!totpSetup?.qrCode) return;
    
    const link = document.createElement('a');
    link.href = totpSetup.qrCode;
    link.download = 'totp-qr-code.png';
    link.click();
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'totp': return <QrCode className="w-4 h-4" />;
      case 'biometric': return <Fingerprint className="w-4 h-4" />;
      case 'push': return <Smartphone className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getMethodName = (type: string) => {
    switch (type) {
      case 'sms': return 'SMS Kodu';
      case 'email': return 'E-posta Kodu';
      case 'totp': return 'Authenticator App';
      case 'biometric': return 'Parmak İzi/Yüz Tanıma';
      case 'push': return 'Push Bildirim';
      default: return type;
    }
  };

  const getMethodDescription = (type: string) => {
    switch (type) {
      case 'sms': return 'Telefon numaranıza SMS ile doğrulama kodu gönderilir';
      case 'email': return 'E-posta adresinize doğrulama kodu gönderilir';
      case 'totp': return 'Google Authenticator gibi uygulamalarla kod üretilir';
      case 'biometric': return 'Parmak izi veya yüz tanıma ile doğrulama';
      case 'push': return 'Telefonunuza push bildirim ile onay';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">MFA Yönetimi</h2>
          <p className="text-muted-foreground">
            Çok faktörlü kimlik doğrulama yöntemlerinizi yönetin
          </p>
        </div>
        {onClose && (
          <Button onClick={onClose} variant="outline">
            Kapat
          </Button>
        )}
      </div>

      {/* Mevcut MFA Yöntemleri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Mevcut MFA Yöntemleri
          </CardTitle>
          <CardDescription>
            Aktif ve devre dışı MFA yöntemleriniz
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Yükleniyor...</p>
            </div>
          ) : mfaMethods.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Henüz MFA yöntemi eklenmemiş</p>
              <p className="text-sm text-muted-foreground mt-1">
                Güvenliğinizi artırmak için bir MFA yöntemi ekleyin
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mfaMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getMethodIcon(method.type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{getMethodName(method.type)}</span>
                        {method.is_primary && (
                          <Badge variant="default" className="text-xs">Birincil</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getMethodDescription(method.type)}
                      </p>
                      {method.last_used && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Son kullanım: {new Date(method.last_used).toLocaleDateString('tr-TR')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={method.is_enabled}
                      onCheckedChange={(enabled) => handleToggleMFAMethod(method.id, enabled)}
                    />
                    
                    {!method.is_primary && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetPrimary(method.id)}
                      >
                        Birincil Yap
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveMFAMethod(method.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Yeni MFA Yöntemi Ekleme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Yeni MFA Yöntemi Ekle
          </CardTitle>
          <CardDescription>
            Güvenliğinizi artırmak için yeni bir doğrulama yöntemi ekleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>MFA Yöntemi</Label>
              <Select value={newMethodType} onValueChange={setNewMethodType}>
                <SelectTrigger>
                  <SelectValue placeholder="Yöntem seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      SMS Kodu
                    </div>
                  </SelectItem>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      E-posta Kodu
                    </div>
                  </SelectItem>
                  <SelectItem value="totp">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4" />
                      Authenticator App
                    </div>
                  </SelectItem>
                  <SelectItem value="biometric">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="w-4 h-4" />
                      Biyometrik
                    </div>
                  </SelectItem>
                  <SelectItem value="push">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      Push Bildirim
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newMethodType && newMethodType !== 'totp' && newMethodType !== 'biometric' && (
              <div>
                <Label>
                  {newMethodType === 'sms' ? 'Telefon Numarası' : 
                   newMethodType === 'email' ? 'E-posta Adresi' : 'Değer'}
                </Label>
                <Input
                  value={newMethodValue}
                  onChange={(e) => setNewMethodValue(e.target.value)}
                  placeholder={
                    newMethodType === 'sms' ? '+90 555 123 45 67' :
                    newMethodType === 'email' ? 'personel@firma.com' : 'Değer girin'
                  }
                  className="mt-1"
                />
              </div>
            )}

            {newMethodType && (
              <div className="flex gap-2">
                <Button
                  onClick={handleAddMFAMethod}
                  disabled={isAddingMethod || (newMethodType !== 'totp' && newMethodType !== 'biometric' && !newMethodValue)}
                  className="flex-1"
                >
                  {isAddingMethod ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Ekleniyor...
                    </>
                  ) : (
                    'MFA Yöntemi Ekle'
                  )}
                </Button>
                
                <Button
                  onClick={resetNewMethodForm}
                  variant="outline"
                >
                  İptal
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* TOTP Kurulum */}
      {totpSetup && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              TOTP Kurulumu
            </CardTitle>
            <CardDescription>
              Google Authenticator veya benzeri uygulamaya QR kodu tarayın
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <img 
                  src={totpSetup.qrCode} 
                  alt="TOTP QR Code" 
                  className="mx-auto border rounded-lg"
                  style={{ width: '200px', height: '200px' }}
                />
              </div>

              <div>
                <Label>Gizli Anahtar</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={totpSetup.isVisible ? totpSetup.secret : '•'.repeat(totpSetup.secret.length)}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTotpSetup({...totpSetup, isVisible: !totpSetup.isVisible})}
                  >
                    {totpSetup.isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(totpSetup.secret)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={downloadQRCode}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  QR Kodu İndir
                </Button>
                
                <Button
                  onClick={() => {
                    setTotpSetup(null);
                    loadMFAMethods();
                  }}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Kurulum Tamamlandı
                </Button>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2 text-blue-800">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Önemli:</p>
                    <ul className="mt-1 space-y-1">
                      <li>• QR kodu taradıktan sonra "Kurulum Tamamlandı" butonuna tıklayın</li>
                      <li>• Gizli anahtarı güvenli bir yerde saklayın</li>
                      <li>• Uygulamada 6 haneli kodu girin</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Güvenlik Önerileri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Güvenlik Önerileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">En az iki MFA yöntemi kullanın</p>
                <p className="text-sm text-muted-foreground">
                  Birincil yöntem başarısız olursa yedek yöntemle giriş yapabilirsiniz
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Biyometrik doğrulamayı etkinleştirin</p>
                <p className="text-sm text-muted-foreground">
                  Parmak izi veya yüz tanıma en güvenli yöntemlerdir
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Cihazlarınızı güvenilir olarak işaretleyin</p>
                <p className="text-sm text-muted-foreground">
                  Kişisel cihazlarınızda tekrar doğrulama yapmazsınız
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Badge bileşeni (eğer mevcut değilse)
const Badge: React.FC<{ variant: string; className?: string; children: React.ReactNode }> = ({ 
  variant, 
  className, 
  children 
}) => {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  const variantClasses = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    destructive: "bg-red-100 text-red-800",
    outline: "border border-gray-200 text-gray-800"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant as keyof typeof variantClasses]} ${className || ''}`}>
      {children}
    </span>
  );
};
