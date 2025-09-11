import React, { useState, useEffect } from 'react';
import { 
  PersonnelLoginRequest,
  PersonnelLoginResponse,
  PersonnelVerificationRequest,
  MFAMethod,
  DeviceInfo
} from '../types';
import { personnelAuthService } from '../services/personnelAuthService';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Label } from './ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { 
  Smartphone, 
  Mail, 
  User, 
  Shield, 
  Fingerprint, 
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  QrCode,
  Smartphone as PhoneIcon
} from 'lucide-react';
import { toast } from 'sonner';

export const PersonnelMobileLogin: React.FC = () => {
  const [loginStep, setLoginStep] = useState<'login' | 'verification' | 'success'>('login');
  const [loginMethod, setLoginMethod] = useState<'employee_id' | 'phone' | 'email'>('employee_id');
  const [verificationMethod, setVerificationMethod] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [employeeId, setEmployeeId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');

  // Available verification methods
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);
  const [mfaMethods, setMfaMethods] = useState<MFAMethod[]>([]);

  useEffect(() => {
    // Cihaz bilgilerini al
    const device = personnelAuthService.getDeviceInfo();
    setDeviceInfo(device);
  }, []);

  const handleLogin = async () => {
    if (!deviceInfo) {
      toast.error('Cihaz bilgileri alınamadı');
      return;
    }

    setIsLoading(true);
    try {
      const loginRequest: PersonnelLoginRequest = {
        employee_id: employeeId,
        phone: phone || undefined,
        email: email || undefined,
        device_info: deviceInfo,
        login_method: loginMethod
      };

      const response = await personnelAuthService.personnelLogin(loginRequest);
      
      if (response.success) {
        if (response.requires_verification) {
          setSessionId(response.session_id);
          setAvailableMethods(response.verification_methods);
          setLoginStep('verification');
          toast.success('Doğrulama kodu gönderildi');
        } else {
          setLoginStep('success');
          toast.success('Giriş başarılı!');
        }
      } else {
        toast.error(response.message || 'Giriş başarısız');
      }
    } catch (error) {
      toast.error('Giriş sırasında hata oluştu');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerificationCode = async () => {
    if (!verificationMethod) {
      toast.error('Lütfen doğrulama yöntemi seçin');
      return;
    }

    setIsLoading(true);
    try {
      await personnelAuthService.sendVerificationCode({
        method: verificationMethod,
        personnel_id: employeeId,
        phone: phone || undefined,
        email: email || undefined,
        device_id: deviceInfo?.device_id
      });

      toast.success('Doğrulama kodu gönderildi');
    } catch (error) {
      toast.error('Kod gönderilemedi');
      console.error('Send code error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || !sessionId) {
      toast.error('Lütfen doğrulama kodunu girin');
      return;
    }

    setIsLoading(true);
    try {
      const verifyRequest: PersonnelVerificationRequest = {
        session_id: sessionId,
        method: verificationMethod,
        code: verificationCode,
        device_id: deviceInfo?.device_id || ''
      };

      const response = await personnelAuthService.verifyCode(verifyRequest);
      
      if (response.success) {
        // Token'ları sakla
        if (response.access_token) {
          localStorage.setItem('personnel_token', response.access_token);
        }
        if (response.refresh_token) {
          localStorage.setItem('personnel_refresh_token', response.refresh_token);
        }

        // Cihaz güvenilir olarak işaretle
        if (response.device_trusted && deviceInfo) {
          await personnelAuthService.trustDevice(deviceInfo.device_id, response.personnel.id);
        }

        // Güvenlik log kaydı
        await personnelAuthService.logSecurityEvent(
          'successful_login',
          response.personnel.id,
          deviceInfo?.device_id || '',
          { method: verificationMethod, device_trusted: response.device_trusted }
        );

        setLoginStep('success');
        toast.success('Doğrulama başarılı! Giriş yapıldı.');
      } else {
        toast.error(response.message || 'Doğrulama başarısız');
      }
    } catch (error) {
      toast.error('Doğrulama sırasında hata oluştu');
      console.error('Verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!deviceInfo) return;

    try {
      // Biyometrik doğrulama (WebAuthn API kullanarak)
      if (navigator.credentials && window.PublicKeyCredential) {
        const credential = await navigator.credentials.get({
          publicKey: {
            challenge: new Uint8Array(32),
            rpId: window.location.hostname,
            userVerification: 'required'
          }
        });

        if (credential) {
          // Biyometrik veri ile doğrulama
          const success = await personnelAuthService.verifyBiometric(
            deviceInfo.device_id,
            employeeId,
            credential
          );

          if (success) {
            toast.success('Biyometrik doğrulama başarılı!');
            setLoginStep('success');
          } else {
            toast.error('Biyometrik doğrulama başarısız');
          }
        }
      } else {
        toast.error('Biyometrik doğrulama desteklenmiyor');
      }
    } catch (error) {
      toast.error('Biyometrik doğrulama sırasında hata oluştu');
      console.error('Biometric error:', error);
    }
  };

  const handlePushNotification = async () => {
    if (!deviceInfo) return;

    try {
      await personnelAuthService.sendPushNotification(deviceInfo.device_id, employeeId);
      toast.success('Push bildirim gönderildi. Telefonunuzda onaylayın.');
    } catch (error) {
      toast.error('Push bildirim gönderilemedi');
      console.error('Push notification error:', error);
    }
  };

  const resetForm = () => {
    setEmployeeId('');
    setPhone('');
    setEmail('');
    setVerificationCode('');
    setPassword('');
    setLoginStep('login');
    setSessionId('');
    setVerificationMethod('');
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'totp': return <QrCode className="w-4 h-4" />;
      case 'biometric': return <Fingerprint className="w-4 h-4" />;
      case 'push': return <Smartphone className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getMethodName = (method: string) => {
    switch (method) {
      case 'sms': return 'SMS Kodu';
      case 'email': return 'E-posta Kodu';
      case 'totp': return 'Authenticator App';
      case 'biometric': return 'Parmak İzi/Yüz Tanıma';
      case 'push': return 'Push Bildirim';
      default: return method;
    }
  };

  if (loginStep === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">Giriş Başarılı!</CardTitle>
            <CardDescription>
              Personel paneline yönlendiriliyorsunuz...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={resetForm} variant="outline" className="w-full">
              Yeni Giriş
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Personel Girişi</CardTitle>
          <CardDescription>
            {loginStep === 'login' 
              ? 'Giriş bilgilerinizi girin'
              : 'Doğrulama kodunu girin'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {loginStep === 'login' ? (
            <div className="space-y-4">
              <Tabs value={loginMethod} onValueChange={(value: any) => setLoginMethod(value)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="employee_id" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Personel No
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="flex items-center gap-2">
                    <PhoneIcon className="w-4 h-4" />
                    Telefon
                  </TabsTrigger>
                  <TabsTrigger value="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    E-posta
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="employee_id" className="space-y-4">
                  <div>
                    <Label htmlFor="employee_id">Personel No</Label>
                    <Input
                      id="employee_id"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="P001"
                      className="mt-1"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="phone" className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Telefon Numarası</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+90 555 123 45 67"
                      className="mt-1"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="email" className="space-y-4">
                  <div>
                    <Label htmlFor="email">E-posta Adresi</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="personel@firma.com"
                      className="mt-1"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div>
                <Label htmlFor="password">Şifre</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Şifrenizi girin"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                onClick={handleLogin} 
                disabled={isLoading || !employeeId || !password}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Giriş Yapılıyor...
                  </>
                ) : (
                  'Giriş Yap'
                )}
              </Button>

              {/* Biyometrik giriş seçeneği */}
              {deviceInfo?.device_type === 'mobile' && (
                <Button 
                  onClick={handleBiometricLogin}
                  variant="outline"
                  className="w-full"
                >
                  <Fingerprint className="w-4 h-4 mr-2" />
                  Parmak İzi ile Giriş
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Doğrulama Yöntemi Seçin</Label>
                <Select value={verificationMethod} onValueChange={setVerificationMethod}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Yöntem seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        <div className="flex items-center gap-2">
                          {getMethodIcon(method)}
                          {getMethodName(method)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {verificationMethod && (
                <>
                  <Button 
                    onClick={handleSendVerificationCode}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    {isLoading ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
                  </Button>

                  <div>
                    <Label htmlFor="verification_code">Doğrulama Kodu</Label>
                    <Input
                      id="verification_code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="6 haneli kodu girin"
                      className="mt-1"
                      maxLength={6}
                    />
                  </div>

                  <Button 
                    onClick={handleVerifyCode}
                    disabled={isLoading || !verificationCode}
                    className="w-full"
                  >
                    {isLoading ? 'Doğrulanıyor...' : 'Doğrula ve Giriş Yap'}
                  </Button>

                  {/* Alternatif doğrulama yöntemleri */}
                  <div className="space-y-2">
                    {verificationMethod === 'push' && (
                      <Button 
                        onClick={handlePushNotification}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Smartphone className="w-4 h-4 mr-2" />
                        Push Bildirim Gönder
                      </Button>
                    )}
                  </div>
                </>
              )}

              <Button 
                onClick={() => setLoginStep('login')}
                variant="ghost"
                className="w-full"
              >
                Geri Dön
              </Button>
            </div>
          )}
        </CardContent>

        {/* Cihaz bilgileri */}
        {deviceInfo && (
          <div className="px-6 pb-4">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <Smartphone className="w-3 h-3" />
                {deviceInfo.os} - {deviceInfo.device_type}
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3" />
                Cihaz ID: {deviceInfo.device_id.substring(0, 8)}...
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
