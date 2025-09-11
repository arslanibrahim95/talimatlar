import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';

interface CommandResult {
  type: string;
  data: any;
  message: string;
  suggestions?: string[];
}

interface AICommandProcessorProps {
  command: string;
  onResult: (result: CommandResult) => void;
  onError: (error: string) => void;
}

const AICommandProcessor: React.FC<AICommandProcessorProps> = ({ 
  command, 
  onResult, 
  onError 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CommandResult | null>(null);

  useEffect(() => {
    if (command) {
      processCommand(command);
    }
  }, [command]);

  const processCommand = async (cmd: string) => {
    setIsProcessing(true);
    setResult(null);

    try {
      const response = await fetch('http://localhost:8006/commands/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: cmd,
          sessionId: 'current_session', // TODO: Get from context
          userId: 'current_user' // TODO: Get from auth context
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
        onResult(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Command processing error:', error);
      onError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderResult = (result: CommandResult) => {
    switch (result.type) {
      case 'user_list':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold text-green-600 dark:text-green-400">
              {result.message}
            </h4>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {result.data.map((user: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="font-medium">{user.name || 'İsimsiz Kullanıcı'}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email || 'E-posta yok'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'system_status':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold text-blue-600 dark:text-blue-400">
              {result.message}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.data.map((service: any, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${
                    service.status === 'healthy' 
                      ? 'bg-green-500' 
                      : service.status === 'unhealthy'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}></div>
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {service.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'instruction_list':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold text-purple-600 dark:text-purple-400">
              {result.message}
            </h4>
            <div className="space-y-2">
              {result.data.map((instruction: any, index: number) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="font-medium">{instruction.title}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {instruction.description}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      instruction.status === 'published' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {instruction.status}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                      {instruction.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold text-indigo-600 dark:text-indigo-400">
              {result.message}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(result.data).map(([key, value]: [string, any]) => (
                <div key={key} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold text-red-600 dark:text-red-400">
              Hata
            </h4>
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-red-800 dark:text-red-200">{result.message}</div>
              {result.error && (
                <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {result.error}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-600 dark:text-gray-400">
              {result.message}
            </h4>
            {result.suggestions && (
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Önerilen komutlar:
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  if (isProcessing) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600 dark:text-gray-400">
              Komut işleniyor: "{command}"
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Komut Sonucu</CardTitle>
      </CardHeader>
      <CardContent>
        {renderResult(result)}
      </CardContent>
    </Card>
  );
};

export default AICommandProcessor;
