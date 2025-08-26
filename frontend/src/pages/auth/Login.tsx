import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { cn } from '../../utils/cn';

const loginSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP kodu 6 haneli olmalıdır'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

const Login: React.FC = () => {
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, requestOtp, verifyOtp } = useAuthStore();
  const navigate = useNavigate();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await login(data.email, data.password);
      
      if (result.success) {
        navigate('/dashboard');
      } else if (result.requiresOtp) {
        setIsOtpMode(true);
        // OTP isteği gönder
        await requestOtp(data.email);
      } else {
        setError(result.error || 'Giriş başarısız');
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const onOtpSubmit = async (data: OtpFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await verifyOtp(data.otp);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'OTP doğrulama başarısız');
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setIsOtpMode(false);
    setError(null);
    otpForm.reset();
  };

  const handleResendOtp = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await requestOtp(loginForm.getValues('email'));
    } catch (err) {
      setError('OTP gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isOtpMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              OTP Doğrulama
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Email adresinize gönderilen 6 haneli kodu giriniz
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={otpForm.handleSubmit(onOtpSubmit)}>
            <div>
              <Input
                label="OTP Kodu"
                type="text"
                placeholder="123456"
                maxLength={6}
                {...otpForm.register('otp')}
                error={otpForm.formState.errors.otp?.message}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Doğrula'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleResendOtp}
                disabled={isLoading}
              >
                OTP'yi Tekrar Gönder
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleBackToLogin}
              >
                Giriş'e Dön
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">CT</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Hesabınıza Giriş Yapın
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Claude Talimat İş Güvenliği Yönetim Sistemi
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
          <div className="space-y-4">
            <Input
              label="Email Adresi"
              type="email"
              placeholder="ornek@email.com"
              {...loginForm.register('email')}
              error={loginForm.formState.errors.email?.message}
            />

            <Input
              label="Şifre"
              type="password"
              placeholder="••••••••"
              {...loginForm.register('password')}
              error={loginForm.formState.errors.password?.message}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Şifremi Unuttum
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Giriş Yap'}
            </Button>

            <div className="text-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Hesabınız yok mu?{' '}
              </span>
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Kayıt Olun
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
