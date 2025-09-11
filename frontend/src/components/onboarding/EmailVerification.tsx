import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
  onResend: () => Promise<void>;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({
  email,
  onVerified,
  onBack,
  onResend
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      setError('Doğrulama kodu gerekli');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('Doğrulama kodu 6 haneli olmalıdır');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would call your actual verification API
      console.log('Verifying code:', verificationCode, 'for email:', email);
      
      setSuccess(true);
      setTimeout(() => {
        onVerified();
      }, 1500);
    } catch (error) {
      console.error('Verification error:', error);
      setError('Doğrulama kodu geçersiz veya süresi dolmuş');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    setTimeLeft(300); // Reset timer

    try {
      await onResend();
      // Show success message
    } catch (error) {
      console.error('Resend error:', error);
      setError('Kod gönderilirken bir hata oluştu');
    } finally {
      setIsResending(false);
    }
  };

  const handleCodeChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(numericValue);
    setError('');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  E-posta Doğrulandı!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Hesabınız başarıyla oluşturuldu ve e-posta adresiniz doğrulandı.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <div className="text-center">
              <Mail className="mx-auto h-12 w-12 text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                E-posta Doğrulama
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                <strong>{email}</strong> adresine gönderilen 6 haneli doğrulama kodunu girin
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="verificationCode">Doğrulama Kodu</Label>
              <Input
                id="verificationCode"
                value={verificationCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="123456"
                className={`text-center text-2xl font-mono tracking-widest ${
                  error ? 'border-red-500' : ''
                }`}
                maxLength={6}
                autoComplete="one-time-code"
              />
              {error && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <XCircle className="w-4 h-4 mr-1" />
                  {error}
                </p>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Kod gelmedi mi?{' '}
                <button
                  onClick={handleResend}
                  disabled={isResending || timeLeft > 0}
                  className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <span className="flex items-center">
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Gönderiliyor...
                    </span>
                  ) : timeLeft > 0 ? (
                    `Tekrar gönder (${formatTime(timeLeft)})`
                  ) : (
                    'Tekrar gönder'
                  )}
                </button>
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleVerify}
                disabled={isVerifying || verificationCode.length !== 6}
                className="w-full"
              >
                {isVerifying ? (
                  <span className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Doğrulanıyor...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Doğrula
                  </span>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={onBack}
                className="w-full"
                disabled={isVerifying}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri Dön
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <p>
                E-posta gelmedi mi? Spam klasörünü kontrol edin veya{' '}
                <button
                  onClick={handleResend}
                  disabled={isResending || timeLeft > 0}
                  className="text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                >
                  tekrar gönderin
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailVerification;
