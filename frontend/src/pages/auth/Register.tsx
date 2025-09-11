import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir email adresi giriniz'),
  phone: z.string().min(10, 'Geçerli bir telefon numarası giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  confirmPassword: z.string(),
  company: z.string().optional(),
  position: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      const result = await register({
        first_name: data.name,
        email: data.email,
        password: data.password,
        last_name: data.name, // Use name as last_name for now
        phone: data.phone || ''
      });
      
      if (result.success) {
        setSuccess('Kayıt başarılı! Giriş yapabilirsiniz.');
        toast.success('Kayıt başarılı!');
        setTimeout(() => {
          navigate('/auth/login');
        }, 2000);
      } else {
        setError(result.error || 'Kayıt başarısız');
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Yeni hesap oluşturun
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Claude Talimat İş Güvenliği Yönetim Sistemi
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Hata
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Başarılı
                </h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                  {success}
                </div>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Ad Soyad"
              type="text"
              placeholder="Adınız ve soyadınız"
              {...form.register('name')}
              error={form.formState.errors.name?.message}
            />

            <Input
              label="Email Adresi"
              type="email"
              placeholder="ornek@email.com"
              {...form.register('email')}
              error={form.formState.errors.email?.message}
            />

            <Input
              label="Telefon Numarası"
              type="tel"
              placeholder="+90 5XX XXX XX XX"
              {...form.register('phone')}
              error={form.formState.errors.phone?.message}
            />

            <Input
              label="Şirket (Opsiyonel)"
              type="text"
              placeholder="Şirket adı"
              {...form.register('company')}
              error={form.formState.errors.company?.message}
            />

            <Input
              label="Pozisyon (Opsiyonel)"
              type="text"
              placeholder="Pozisyonunuz"
              {...form.register('position')}
              error={form.formState.errors.position?.message}
            />

            <Input
              label="Şifre"
              type="password"
              placeholder="En az 6 karakter"
              {...form.register('password')}
              error={form.formState.errors.password?.message}
            />

            <Input
              label="Şifre Tekrar"
              type="password"
              placeholder="Şifrenizi tekrar giriniz"
              {...form.register('confirmPassword')}
              error={form.formState.errors.confirmPassword?.message}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Kayıt olunuyor...
              </>
            ) : (
              'Kayıt Ol'
            )}
          </Button>

          <div className="text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Zaten hesabınız var mı?{' '}
            </span>
            <a
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Giriş yapın
            </a>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2024 Claude Talimat. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
