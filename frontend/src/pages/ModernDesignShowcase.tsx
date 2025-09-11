import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { MODERN_GRADIENTS, THEME_COLORS } from '../constants/colors';

const ModernDesignShowcase: React.FC = () => {
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/50">
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            🎨 Modern Design System
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            2024-2025 tasarım trendleriyle oluşturulmuş modern, glassmorphism efektli bileşenler ve mikro-etkileşimler
          </p>
          <div className="flex justify-center gap-4 mt-8">
            <Badge variant="default" className="text-lg px-6 py-2">
              ✨ Glassmorphism
            </Badge>
            <Badge variant="success" className="text-lg px-6 py-2">
              🌈 Gradient 2.0
            </Badge>
            <Badge variant="warning" className="text-lg px-6 py-2">
              🎭 Micro-interactions
            </Badge>
          </div>
        </div>

        {/* Gradient Showcase */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            🌈 Modern Gradient Collection
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.entries(MODERN_GRADIENTS.modern).map(([name, gradient]) => (
              <Card key={name} className="group overflow-hidden">
                <div className={`h-32 ${gradient} relative`}>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                  <div className="absolute bottom-4 left-4 text-white font-bold text-lg capitalize">
                    {name}
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Modern {name} gradient kombinasyonu
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Interactive Components */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            🎮 Interactive Components
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Button Showcase */}
            <Card className="group">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <CardTitle className="flex items-center text-2xl">
                  <span className="text-3xl mr-3">🚀</span>
                  Modern Buttons
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Gelişmiş hover efektleri ve animasyonlar
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="primary" size="lg" className="animate-float">
                      ✨ Floating
                    </Button>
                    <Button variant="success" size="lg" className="animate-glow">
                      💫 Glowing
                    </Button>
                    <Button variant="warning" size="lg" className="animate-shimmer">
                      🌟 Shimmer
                    </Button>
                    <Button variant="danger" size="lg" className="animate-pulse">
                      💥 Pulsing
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Size Variants</h3>
                    <div className="flex items-center gap-4">
                      <Button variant="outline" size="sm">Small</Button>
                      <Button variant="outline" size="md">Medium</Button>
                      <Button variant="outline" size="lg">Large</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Input Showcase */}
            <Card className="group">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <CardTitle className="flex items-center text-2xl">
                  <span className="text-3xl mr-3">📝</span>
                  Modern Inputs
                </CardTitle>
                <CardDescription className="text-green-100">
                  Glassmorphism efektli form elemanları
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <Input
                    label="Modern Input Field"
                    placeholder="Type something amazing..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    }
                  />
                  
                  <Input
                    label="Search Input"
                    placeholder="Search for anything..."
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    }
                    rightIcon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    }
                  />
                  
                  <Input
                    label="Error State"
                    placeholder="This field has an error"
                    error="This field is required"
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Card Showcase */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            🃏 Modern Cards
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:scale-105 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">✨</span>
                  Glassmorphism
                </CardTitle>
                <CardDescription>
                  Modern cam efekti ile şeffaf tasarım
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge variant="default">Modern</Badge>
                  <Badge variant="success">2024</Badge>
                  <Badge variant="warning">Trendy</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🎨</span>
                  Gradient Header
                </CardTitle>
                <CardDescription className="text-purple-100">
                  Gradient başlıklı modern kart
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Bu kart modern gradient başlık kullanıyor ve glassmorphism efektleri içeriyor.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  Interactive
                </CardTitle>
                <CardDescription>
                  Hover efektleri ve animasyonlar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="primary" size="sm" className="w-full">
                    Interactive Button
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    Outline Button
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Badge Showcase */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            🏷️ Modern Badges
          </h2>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="default" className="text-lg px-6 py-3">
              🎯 Default Badge
            </Badge>
            <Badge variant="success" className="text-lg px-6 py-3">
              ✅ Success Badge
            </Badge>
            <Badge variant="warning" className="text-lg px-6 py-3">
              ⚠️ Warning Badge
            </Badge>
            <Badge variant="danger" className="text-lg px-6 py-3">
              ❌ Danger Badge
            </Badge>
            <Badge variant="outline" className="text-lg px-6 py-3">
              🔲 Outline Badge
            </Badge>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">
                🎉 Modern Design System Complete!
              </h3>
              <p className="text-gray-300 mb-6">
                Tüm bileşenler 2024-2025 tasarım trendleriyle güncellenmiş ve modern glassmorphism efektleri eklenmiştir.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" size="lg" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  🚀 Get Started
                </Button>
                <Button variant="primary" size="lg">
                  📚 Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ModernDesignShowcase;
