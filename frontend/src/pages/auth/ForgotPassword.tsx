import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const forgotPasswordSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Gerçek uygulamada API çağrısı yapılacak
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSuccess(true);
    } catch (err) {
      setError('Şifre sıfırlama emaili gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">✓</span>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Email Gönderildi
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Şifre sıfırlama linki email adresinize gönderildi.
            </p>
          </div>
          
          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Giriş sayfasına dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">🔒</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Şifremi Unuttum
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Email adresinizi girin, şifre sıfırlama linki gönderelim
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <Input
              label="Email Adresi"
              type="email"
              placeholder="ornek@email.com"
              {...form.register('email')}
              error={form.formState.errors.email?.message}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Şifre Sıfırlama Linki Gönder'}
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Giriş sayfasına dön
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
