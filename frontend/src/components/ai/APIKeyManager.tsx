import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Switch } from '../ui/Switch';
// import { Badge } from '../ui/badge';
// import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';

interface APIKeyConfig {
  openai: {
    enabled: boolean;
    model: string;
    hasKey: boolean;
  };
  claude: {
    enabled: boolean;
    model: string;
    hasKey: boolean;
  };
  local: {
    enabled: boolean;
    endpoint: string;
    model: string;
  };
}

interface APIKeyManagerProps {
  onConfigUpdate?: (config: APIKeyConfig) => void;
}

const APIKeyManager: React.FC<APIKeyManagerProps> = ({ onConfigUpdate }) => {
  const [config, setConfig] = useState<APIKeyConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<Record<string, boolean | null>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [newKeys, setNewKeys] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      // Mock data kullan (backend olmadan)
      const mockConfig: APIKeyConfig = {
        openai: {
          enabled: true,
          model: 'gpt-4',
          hasKey: true
        },
        claude: {
          enabled: false,
          model: 'claude-3-sonnet',
          hasKey: false
        },
        local: {
          enabled: false,
          endpoint: 'http://localhost:8000',
          model: 'llama-3'
        }
      };
      setConfig(mockConfig);
      onConfigUpdate?.(mockConfig);
    } catch (error) {
      setError('Konfigürasyon yüklenirken hata oluştu');
      console.error('Config load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateAPIKey = async (provider: string, apiKey: string) => {
    if (!apiKey.trim()) {
      setValidationResults(prev => ({ ...prev, [provider]: false }));
      return false;
    }

    setIsValidating(true);
    setValidationResults(prev => ({ ...prev, [provider]: null }));
    
    try {
      // Mock validation (backend olmadan)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      
      // OpenAI için sk- ile başlayan key'leri kabul et
      const isValid = provider === 'openai' ? apiKey.startsWith('sk-') : apiKey.length > 10;
      
      setValidationResults(prev => ({ ...prev, [provider]: isValid }));
      
      if (isValid) {
        setSuccess(`${provider.toUpperCase()} API key doğrulandı`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(`${provider.toUpperCase()} API key geçersiz`);
        setTimeout(() => setError(null), 3000);
      }
      
      return isValid;
    } catch (error) {
      console.error('API key validation error:', error);
      setValidationResults(prev => ({ ...prev, [provider]: false }));
      setError(`${provider.toUpperCase()} API key doğrulanamadı`);
      setTimeout(() => setError(null), 3000);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const updateConfig = async (provider: string, updates: any) => {
    try {
      // Mock update (backend olmadan)
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
      
      setSuccess(`${provider.toUpperCase()} konfigürasyonu güncellendi`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Local state'i güncelle
      if (config) {
        const updatedConfig = { ...config };
        if (provider === 'openai') {
          updatedConfig.openai = { ...updatedConfig.openai, ...updates };
        } else if (provider === 'claude') {
          updatedConfig.claude = { ...updatedConfig.claude, ...updates };
        } else if (provider === 'local') {
          updatedConfig.local = { ...updatedConfig.local, ...updates };
        }
        setConfig(updatedConfig);
        onConfigUpdate?.(updatedConfig);
      }
    } catch (error) {
      console.error('Config update error:', error);
      setError('Konfigürasyon güncellenirken hata oluştu');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleKeyChange = (provider: string, value: string) => {
    setNewKeys(prev => ({ ...prev, [provider]: value }));
    setValidationResults(prev => ({ ...prev, [provider]: null }));
  };

  const handleKeySubmit = async (provider: string) => {
    const apiKey = newKeys[provider];
    if (!apiKey) return;

    const isValid = await validateAPIKey(provider, apiKey);
    if (isValid) {
      await updateConfig(provider, { apiKey, enabled: true });
      setNewKeys(prev => ({ ...prev, [provider]: '' }));
    }
  };

  const toggleKeyVisibility = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const getValidationIcon = (provider: string) => {
    const result = validationResults[provider];
    if (result === null) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (result === true) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusBadge = (provider: string) => {
    if (!config) return null;
    
    const providerConfig = config[provider as keyof APIKeyConfig];
    if (!providerConfig) return null;

    const isEnabled = providerConfig.enabled;
    const hasKey = 'hasKey' in providerConfig ? providerConfig.hasKey : true;
    
    if (isEnabled && hasKey) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Aktif</Badge>;
    } else if (hasKey) {
      return <Badge variant="secondary">Pasif</Badge>;
    } else {
      return <Badge variant="destructive">Yapılandırılmamış</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Konfigürasyon yükleniyor...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Konfigürasyon yüklenemedi. Lütfen sayfayı yenileyin.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* OpenAI Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>OpenAI</span>
              {getStatusBadge('openai')}
            </CardTitle>
            <Switch
              checked={config.openai.enabled}
              onCheckedChange={(enabled) => updateConfig('openai', { enabled })}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Model</Label>
              <Input
                value={config.openai.model}
                onChange={(e) => updateConfig('openai', { model: e.target.value })}
                placeholder="gpt-4"
              />
            </div>
            <div>
              <Label>API Key</Label>
              <div className="flex gap-2">
                <Input
                  type={showKeys.openai ? "text" : "password"}
                  placeholder="sk-..."
                  value={newKeys.openai || ''}
                  onChange={(e) => handleKeyChange('openai', e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleKeyVisibility('openai')}
                >
                  {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleKeySubmit('openai')}
                  disabled={isValidating || !newKeys.openai}
                >
                  {getValidationIcon('openai')}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claude Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>Claude (Anthropic)</span>
              {getStatusBadge('claude')}
            </CardTitle>
            <Switch
              checked={config.claude.enabled}
              onCheckedChange={(enabled) => updateConfig('claude', { enabled })}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Model</Label>
              <Input
                value={config.claude.model}
                onChange={(e) => updateConfig('claude', { model: e.target.value })}
                placeholder="claude-3-sonnet-20240229"
              />
            </div>
            <div>
              <Label>API Key</Label>
              <div className="flex gap-2">
                <Input
                  type={showKeys.claude ? "text" : "password"}
                  placeholder="sk-ant-..."
                  value={newKeys.claude || ''}
                  onChange={(e) => handleKeyChange('claude', e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleKeyVisibility('claude')}
                >
                  {showKeys.claude ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleKeySubmit('claude')}
                  disabled={isValidating || !newKeys.claude}
                >
                  {getValidationIcon('claude')}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Local Model Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>Local Model</span>
              {getStatusBadge('local')}
            </CardTitle>
            <Switch
              checked={config.local.enabled}
              onCheckedChange={(enabled) => updateConfig('local', { enabled })}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Endpoint</Label>
              <Input
                value={config.local.endpoint}
                onChange={(e) => updateConfig('local', { endpoint: e.target.value })}
                placeholder="http://localhost:11434"
              />
            </div>
            <div>
              <Label>Model</Label>
              <Input
                value={config.local.model}
                onChange={(e) => updateConfig('local', { model: e.target.value })}
                placeholder="llama2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Kullanım İstatistikleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>• API key'ler güvenli bir şekilde saklanır</p>
            <p>• Kullanım istatistikleri otomatik olarak takip edilir</p>
            <p>• Birden fazla provider arasında otomatik geçiş yapılabilir</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default APIKeyManager;
