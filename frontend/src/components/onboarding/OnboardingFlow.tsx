import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Checkbox } from '../ui/Checkbox';
import { Progress } from '../ui/Progress';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Shield, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Loader2
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  isCompleted: boolean;
}

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  department: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  marketingAccepted: boolean;
}

const PersonalInfoStep: React.FC<{
  data: UserData;
  onChange: (data: Partial<UserData>) => void;
  errors: Record<string, string>;
}> = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <User className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Kişisel Bilgileriniz
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Hesabınızı oluşturmak için gerekli bilgileri girin
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">Ad *</Label>
          <Input
            id="firstName"
            value={data.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            placeholder="Adınızı girin"
            className={errors.firstName ? 'border-red-500' : ''}
          />
          {errors.firstName && (
            <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
          )}
        </div>

        <div>
          <Label htmlFor="lastName">Soyad *</Label>
          <Input
            id="lastName"
            value={data.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            placeholder="Soyadınızı girin"
            className={errors.lastName ? 'border-red-500' : ''}
          />
          {errors.lastName && (
            <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="email">E-posta Adresi *</Label>
        <Input
          id="email"
          type="email"
          value={data.email}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder="ornek@email.com"
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">Telefon Numarası *</Label>
        <Input
          id="phone"
          type="tel"
          value={data.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder="+90 555 123 45 67"
          className={errors.phone ? 'border-red-500' : ''}
        />
        {errors.phone && (
          <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
        )}
      </div>
    </div>
  );
};

const CompanyInfoStep: React.FC<{
  data: UserData;
  onChange: (data: Partial<UserData>) => void;
  errors: Record<string, string>;
}> = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Building className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Şirket Bilgileri
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Çalıştığınız şirket hakkında bilgi verin
        </p>
      </div>

      <div>
        <Label htmlFor="company">Şirket Adı *</Label>
        <Input
          id="company"
          value={data.company}
          onChange={(e) => onChange({ company: e.target.value })}
          placeholder="Şirket adını girin"
          className={errors.company ? 'border-red-500' : ''}
        />
        {errors.company && (
          <p className="text-red-500 text-sm mt-1">{errors.company}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="position">Pozisyon *</Label>
          <Input
            id="position"
            value={data.position}
            onChange={(e) => onChange({ position: e.target.value })}
            placeholder="İş unvanınız"
            className={errors.position ? 'border-red-500' : ''}
          />
          {errors.position && (
            <p className="text-red-500 text-sm mt-1">{errors.position}</p>
          )}
        </div>

        <div>
          <Label htmlFor="department">Departman *</Label>
          <Input
            id="department"
            value={data.department}
            onChange={(e) => onChange({ department: e.target.value })}
            placeholder="Çalıştığınız departman"
            className={errors.department ? 'border-red-500' : ''}
          />
          {errors.department && (
            <p className="text-red-500 text-sm mt-1">{errors.department}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const SecurityStep: React.FC<{
  data: UserData;
  onChange: (data: Partial<UserData>) => void;
  errors: Record<string, string>;
}> = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Güvenlik Ayarları
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Hesabınız için güçlü bir şifre oluşturun
        </p>
      </div>

      <div>
        <Label htmlFor="password">Şifre *</Label>
        <Input
          id="password"
          type="password"
          value={data.password}
          onChange={(e) => onChange({ password: e.target.value })}
          placeholder="Güçlü bir şifre girin"
          className={errors.password ? 'border-red-500' : ''}
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password}</p>
        )}
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <p>Şifre en az 8 karakter olmalı ve şunları içermeli:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Büyük harf</li>
            <li>Küçük harf</li>
            <li>Rakam</li>
            <li>Özel karakter</li>
          </ul>
        </div>
      </div>

      <div>
        <Label htmlFor="confirmPassword">Şifre Tekrarı *</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={data.confirmPassword}
          onChange={(e) => onChange({ confirmPassword: e.target.value })}
          placeholder="Şifrenizi tekrar girin"
          className={errors.confirmPassword ? 'border-red-500' : ''}
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
        )}
      </div>
    </div>
  );
};

const TermsStep: React.FC<{
  data: UserData;
  onChange: (data: Partial<UserData>) => void;
  errors: Record<string, string>;
}> = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Sözleşmeler ve İzinler
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Lütfen sözleşmeleri okuyup onaylayın
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="termsAccepted"
            checked={data.termsAccepted}
            onCheckedChange={(checked) => onChange({ termsAccepted: !!checked })}
            className={errors.termsAccepted ? 'border-red-500' : ''}
          />
          <div className="flex-1">
            <Label htmlFor="termsAccepted" className="text-sm">
              <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                Kullanım Sözleşmesi
              </a>
              'ni okudum ve kabul ediyorum *
            </Label>
            {errors.termsAccepted && (
              <p className="text-red-500 text-sm mt-1">{errors.termsAccepted}</p>
            )}
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="privacyAccepted"
            checked={data.privacyAccepted}
            onCheckedChange={(checked) => onChange({ privacyAccepted: !!checked })}
            className={errors.privacyAccepted ? 'border-red-500' : ''}
          />
          <div className="flex-1">
            <Label htmlFor="privacyAccepted" className="text-sm">
              <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                Gizlilik Politikası
              </a>
              'nı okudum ve kabul ediyorum *
            </Label>
            {errors.privacyAccepted && (
              <p className="text-red-500 text-sm mt-1">{errors.privacyAccepted}</p>
            )}
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="marketingAccepted"
            checked={data.marketingAccepted}
            onCheckedChange={(checked) => onChange({ marketingAccepted: !!checked })}
          />
          <div className="flex-1">
            <Label htmlFor="marketingAccepted" className="text-sm">
              Pazarlama e-postaları ve bildirimler almak istiyorum (isteğe bağlı)
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};

const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [userData, setUserData] = useState<UserData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    department: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
    privacyAccepted: false,
    marketingAccepted: false,
  });

  const steps: OnboardingStep[] = [
    {
      id: 'personal',
      title: 'Kişisel Bilgiler',
      description: 'Temel bilgilerinizi girin',
      component: PersonalInfoStep,
      isCompleted: false,
    },
    {
      id: 'company',
      title: 'Şirket Bilgileri',
      description: 'Çalıştığınız şirket hakkında bilgi',
      component: CompanyInfoStep,
      isCompleted: false,
    },
    {
      id: 'security',
      title: 'Güvenlik',
      description: 'Hesap güvenliği ayarları',
      component: SecurityStep,
      isCompleted: false,
    },
    {
      id: 'terms',
      title: 'Sözleşmeler',
      description: 'Sözleşmeleri onaylayın',
      component: TermsStep,
      isCompleted: false,
    },
  ];

  const validateStep = (stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (stepIndex) {
      case 0: // Personal Info
        if (!userData.firstName.trim()) newErrors.firstName = 'Ad gereklidir';
        if (!userData.lastName.trim()) newErrors.lastName = 'Soyad gereklidir';
        if (!userData.email.trim()) {
          newErrors.email = 'E-posta gereklidir';
        } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
          newErrors.email = 'Geçerli bir e-posta adresi girin';
        }
        if (!userData.phone.trim()) {
          newErrors.phone = 'Telefon numarası gereklidir';
        } else if (!/^\+?[\d\s\-\(\)]+$/.test(userData.phone)) {
          newErrors.phone = 'Geçerli bir telefon numarası girin';
        }
        break;

      case 1: // Company Info
        if (!userData.company.trim()) newErrors.company = 'Şirket adı gereklidir';
        if (!userData.position.trim()) newErrors.position = 'Pozisyon gereklidir';
        if (!userData.department.trim()) newErrors.department = 'Departman gereklidir';
        break;

      case 2: // Security
        if (!userData.password) {
          newErrors.password = 'Şifre gereklidir';
        } else if (userData.password.length < 8) {
          newErrors.password = 'Şifre en az 8 karakter olmalıdır';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(userData.password)) {
          newErrors.password = 'Şifre güçlü değil';
        }
        if (userData.password !== userData.confirmPassword) {
          newErrors.confirmPassword = 'Şifreler eşleşmiyor';
        }
        break;

      case 3: // Terms
        if (!userData.termsAccepted) newErrors.termsAccepted = 'Kullanım sözleşmesini kabul etmelisiniz';
        if (!userData.privacyAccepted) newErrors.privacyAccepted = 'Gizlilik politikasını kabul etmelisiniz';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would call your actual registration API
      console.log('User data:', userData);
      
      // Show success message or redirect
      alert('Hesabınız başarıyla oluşturuldu!');
    } catch (error) {
      console.error('Registration error:', error);
      alert('Hesap oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserData = (updates: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...updates }));
    // Clear errors when user starts typing
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Claude Talimat'a Hoş Geldiniz
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Hesabınızı oluşturmak için birkaç adımı tamamlayın
              </p>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Adım {currentStep + 1} / {steps.length}</span>
                <span>%{Math.round(progress)}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-center mt-6 space-x-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    index <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            <CurrentStepComponent
              data={userData}
              onChange={updateUserData}
              errors={errors}
            />

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0 || isLoading}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Geri</span>
              </Button>

              <Button
                onClick={handleNext}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : currentStep === steps.length - 1 ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>
                  {isLoading
                    ? 'İşleniyor...'
                    : currentStep === steps.length - 1
                    ? 'Hesabı Oluştur'
                    : 'İleri'}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingFlow;
