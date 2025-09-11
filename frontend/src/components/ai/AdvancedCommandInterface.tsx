import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
// import { Badge } from '../ui/badge';
// import { Alert, AlertDescription } from '../ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Clock, 
  Terminal,
  Zap,
  Database,
  Users,
  Server,
  HardDrive,
  MemoryStick,
  Network,
  Shield,
  Trash2
} from 'lucide-react';

interface CommandHistory {
  command: string;
  result: any;
  timestamp: Date;
  success: boolean;
  executionTime: number;
}

interface CommandCategory {
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  commands: string[];
  description: string;
}

const AdvancedCommandInterface: React.FC = () => {
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentCommand, setCurrentCommand] = useState('');
  const [error, setError] = useState<string | null>(null);

  const commandCategories: CommandCategory[] = [
    {
      category: 'Sistem Yönetimi',
      icon: Server,
      description: 'Sistem performansı ve durumu',
      commands: [
        'Sistem performansını analiz et',
        'Log dosyalarını filtrele: hata',
        'Backup oluştur',
        'Sistem güncellemelerini kontrol et',
        'Servis durumunu kontrol et'
      ]
    },
    {
      category: 'Veritabanı',
      icon: Database,
      description: 'Veritabanı yönetimi ve optimizasyonu',
      commands: [
        'Veritabanını optimize et',
        'Cache\'i temizle',
        'Veritabanı boyutunu kontrol et',
        'Yavaş sorguları analiz et',
        'Veritabanı bağlantılarını kontrol et'
      ]
    },
    {
      category: 'Kullanıcı Yönetimi',
      icon: Users,
      description: 'Kullanıcı hesapları ve yetkileri',
      commands: [
        'Yeni kullanıcı ekle: Ahmet Yılmaz, admin@example.com',
        'Kullanıcı yetkilerini güncelle',
        'Kullanıcı aktivitelerini analiz et',
        'Pasif kullanıcıları listele',
        'Kullanıcı oturumlarını kontrol et'
      ]
    },
    {
      category: 'Disk ve Bellek',
      icon: HardDrive,
      description: 'Disk ve bellek kullanımı',
      commands: [
        'Disk kullanımını analiz et',
        'Bellek kullanımını analiz et',
        'Büyük dosyaları bul',
        'Gereksiz dosyaları temizle',
        'Disk alanı uyarısı ayarla'
      ]
    },
    {
      category: 'Network',
      icon: Network,
      description: 'Ağ bağlantıları ve trafiği',
      commands: [
        'Network trafiğini analiz et',
        'Bağlantı limitlerini kontrol et',
        'Firewall kurallarını gözden geçir',
        'Network performansını optimize et',
        'Ağ güvenliğini kontrol et'
      ]
    },
    {
      category: 'Güvenlik',
      icon: Shield,
      description: 'Güvenlik taraması ve kontrolleri',
      commands: [
        'Güvenlik taraması yap',
        'Güvenlik açıklarını kontrol et',
        'Güvenlik duvarı durumunu kontrol et',
        'SSL sertifikalarını kontrol et',
        'Güvenlik loglarını analiz et'
      ]
    }
  ];

  const executeAdvancedCommand = async (command: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/ai/commands/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          command, 
          context: {
            userId: 'current_user',
            sessionId: 'advanced_commands',
            previousCommands: commandHistory.slice(-5).map(h => h.command),
            systemState: {}
          }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        const newHistory: CommandHistory = {
          command,
          result: result.data,
          timestamp: new Date(),
          success: result.data.success,
          executionTime: result.data.executionTime || 0
        };
        
        setCommandHistory(prev => [newHistory, ...prev.slice(0, 19)]); // Keep last 20 commands
        
        if (result.data.suggestions) {
          setSuggestions(result.data.suggestions);
        }
      } else {
        setError(result.error || 'Komut işlenirken hata oluştu');
      }
    } catch (error) {
      console.error('Command execution error:', error);
      setError('Komut gönderilirken hata oluştu');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomCommand = () => {
    if (currentCommand.trim()) {
      executeAdvancedCommand(currentCommand.trim());
      setCurrentCommand('');
    }
  };

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'system_performance':
        return <Server className="w-4 h-4" />;
      case 'log_filter':
        return <Terminal className="w-4 h-4" />;
      case 'backup_result':
        return <Database className="w-4 h-4" />;
      case 'system_updates':
        return <Zap className="w-4 h-4" />;
      case 'database_optimization':
        return <Database className="w-4 h-4" />;
      case 'cache_clear':
        return <Trash2 className="w-4 h-4" />;
      case 'user_added':
        return <Users className="w-4 h-4" />;
      case 'service_status':
        return <Server className="w-4 h-4" />;
      case 'disk_usage':
        return <HardDrive className="w-4 h-4" />;
      case 'memory_usage':
        return <MemoryStick className="w-4 h-4" />;
      case 'network_analysis':
        return <Network className="w-4 h-4" />;
      case 'security_scan':
        return <Shield className="w-4 h-4" />;
      case 'system_cleanup':
        return <Trash2 className="w-4 h-4" />;
      default:
        return <Terminal className="w-4 h-4" />;
    }
  };

  const renderCommandResult = (result: any) => {
    if (!result) return null;

    switch (result.type) {
      case 'system_performance':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm font-medium text-blue-800 dark:text-blue-200">CPU Kullanımı</div>
                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {result.data.metrics?.cpu?.usage?.toFixed(1) || 'N/A'}%
                </div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm font-medium text-green-800 dark:text-green-200">Bellek Kullanımı</div>
                <div className="text-lg font-bold text-green-900 dark:text-green-100">
                  {result.data.metrics?.memory?.percentage || 'N/A'}%
                </div>
              </div>
            </div>
            {result.data.recommendations && (
              <div>
                <div className="text-sm font-medium mb-2">Öneriler:</div>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {result.data.recommendations.map((rec: string, index: number) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 'log_filter':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{result.data.totalCount} log kaydı</Badge>
              <Badge variant="secondary">Filtre: {result.data.filter}</Badge>
            </div>
            {result.data.summary && (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Toplam</div>
                  <div>{result.data.summary.total}</div>
                </div>
                <div>
                  <div className="font-medium">Hata</div>
                  <div className="text-red-600">{result.data.summary.recentErrors}</div>
                </div>
                <div>
                  <div className="font-medium">Kaynak</div>
                  <div>{Object.keys(result.data.summary.bySource).length}</div>
                </div>
              </div>
            )}
          </div>
        );

      case 'service_status':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={result.data.overallStatus === 'healthy' ? 'default' : 'destructive'}>
                {result.data.overallStatus === 'healthy' ? 'Tüm Servisler Sağlıklı' : 'Servis Sorunu'}
              </Badge>
              <Badge variant="outline">
                {result.data.healthyServices}/{result.data.totalServices} Aktif
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {result.data.services?.map((service: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span>{service.name}</span>
                  <Badge variant={service.status === 'healthy' ? 'default' : 'destructive'} className="text-xs">
                    {service.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {result.message || 'Komut başarıyla işlendi'}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Custom Command Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Özel Komut
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              placeholder="Komut girin... (örn: Sistem performansını analiz et)"
              onKeyPress={(e) => e.key === 'Enter' && handleCustomCommand()}
              disabled={isProcessing}
            />
            <Button 
              onClick={handleCustomCommand}
              disabled={isProcessing || !currentCommand.trim()}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Çalıştır'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Command Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {commandCategories.map((category, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <category.icon className="w-4 h-4" />
                {category.category}
              </CardTitle>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {category.description}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {category.commands.map((cmd, cmdIndex) => (
                  <Button
                    key={cmdIndex}
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start text-xs h-auto p-2"
                    onClick={() => executeAdvancedCommand(cmd)}
                    disabled={isProcessing}
                  >
                    {cmd}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Command History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Komut Geçmişi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {commandHistory.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Henüz komut çalıştırılmadı
              </div>
            ) : (
              commandHistory.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    {getResultIcon(item.result?.type)}
                    <span className="font-medium text-sm">{item.command}</span>
                    <Badge 
                      variant={item.success ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {item.success ? 'Başarılı' : 'Hata'}
                    </Badge>
                    <span className="text-xs text-gray-500 ml-auto">
                      {formatExecutionTime(item.executionTime)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {item.result && (
                    <div className="ml-6">
                      {renderCommandResult(item.result)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Önerilen Komutlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => executeAdvancedCommand(suggestion)}
                  disabled={isProcessing}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedCommandInterface;
