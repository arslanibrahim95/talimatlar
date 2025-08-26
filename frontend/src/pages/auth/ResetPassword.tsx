import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('Geçersiz veya eksik token.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Gerçek uygulamada API çağrısı yapılacak
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSuccess(true);
    } catch (err) {
      setError('Şifre sıfırlanamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">⚠️</span>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Geçersiz Link
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Şifre sıfırlama linki geçersiz veya süresi dolmuş.
            </p>
          </div>
          
          <div className="text-center">
            <Link
              to="/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Yeni şifre sıfırlama linki iste
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">✓</span>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Şifre Güncellendi
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Şifreniz başarıyla güncellendi. Artık giriş yapabilirsiniz.
            </p>
          </div>
          
          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Giriş yap
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
            Yeni Şifre Belirle
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Yeni şifrenizi belirleyin
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Yeni Şifre"
              type="password"
              placeholder="••••••••"
              {...form.register('password')}
              error={form.formState.errors.password?.message}
            />

            <Input
              label="Şifre Tekrar"
              type="password"
              placeholder="••••••••"
              {...form.register('confirmPassword')}
              error={form.formState.errors.confirmPassword?.message}
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
              {isLoading ? <LoadingSpinner size="sm" /> : 'Şifreyi Güncelle'}
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

export default ResetPassword;
