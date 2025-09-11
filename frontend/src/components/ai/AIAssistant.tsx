import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  Bot, 
  Send, 
  Loader2, 
  Sparkles, 
  FileText, 
  Search,
  Lightbulb,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    suggestions?: string[];
    confidence?: number;
    sources?: string[];
  };
}

interface AIAssistantProps {
  onInstructionGenerated?: (instruction: string) => void;
  onDocumentAnalyzed?: (analysis: any) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  onInstructionGenerated,
  onDocumentAnalyzed
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Merhaba! Claude Talimat AI asistanınızım. Size nasıl yardımcı olabilirim?',
      timestamp: new Date(),
      metadata: {
        suggestions: [
          'Yeni bir talimat oluştur',
          'Mevcut talimatları analiz et',
          'Güvenlik prosedürü öner',
          'Doküman yükle ve analiz et'
        ]
      }
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Simulate AI response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await generateAIResponse(inputValue);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: response.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI response error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const generateAIResponse = async (input: string): Promise<{ content: string; metadata?: any }> => {
    // This would be replaced with actual AI API call
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('talimat') && lowerInput.includes('oluştur')) {
      return {
        content: `Yeni bir talimat oluşturmak için size yardımcı olabilirim. Hangi konuda talimat hazırlamak istiyorsunuz? Örneğin:
        
        • İş güvenliği prosedürleri
        • Acil durum planları
        • Ekipman kullanım talimatları
        • Kalite kontrol süreçleri
        
        Lütfen detayları paylaşın, size uygun bir talimat şablonu hazırlayayım.`,
        metadata: {
          suggestions: [
            'İş güvenliği prosedürü oluştur',
            'Acil durum planı hazırla',
            'Ekipman kullanım kılavuzu yap'
          ]
        }
      };
    }
    
    if (lowerInput.includes('analiz') || lowerInput.includes('incele')) {
      return {
        content: `Doküman analizi için size yardımcı olabilirim. Yüklediğiniz dokümanları inceleyerek:
        
        • Güvenlik risklerini tespit edebilirim
        • Eksik bilgileri belirleyebilirim
        • İyileştirme önerileri sunabilirim
        • Uyumluluk kontrolü yapabilirim
        
        Hangi dokümanı analiz etmek istiyorsunuz?`,
        metadata: {
          suggestions: [
            'PDF doküman yükle',
            'Word dokümanı analiz et',
            'Güvenlik raporu incele'
          ]
        }
      };
    }
    
    if (lowerInput.includes('güvenlik') || lowerInput.includes('risk')) {
      return {
        content: `Güvenlik konularında size yardımcı olabilirim. İş güvenliği açısından:
        
        • Risk değerlendirmesi yapabilirim
        • Güvenlik prosedürleri önerebilirim
        • Acil durum planları hazırlayabilirim
        • Eğitim materyalleri oluşturabilirim
        
        Hangi güvenlik konusunda yardım istiyorsunuz?`,
        metadata: {
          suggestions: [
            'Risk değerlendirmesi yap',
            'Güvenlik prosedürü oluştur',
            'Acil durum planı hazırla'
          ]
        }
      };
    }
    
    return {
      content: `Anladım. Size nasıl yardımcı olabilirim? Aşağıdaki konularda destek sağlayabilirim:
      
      🤖 **Talimat Oluşturma**: Yeni iş güvenliği talimatları hazırlama
      📊 **Doküman Analizi**: Mevcut dokümanları inceleme ve analiz etme
      🔒 **Güvenlik Değerlendirmesi**: Risk analizi ve güvenlik önerileri
      📚 **Eğitim Materyalleri**: Personel eğitimi için içerik oluşturma
      📋 **Uyumluluk Kontrolü**: Mevzuat uyumluluğu kontrolü
      
      Hangi konuda yardım istiyorsunuz?`,
      metadata: {
        suggestions: [
          'Talimat oluştur',
          'Doküman analiz et',
          'Güvenlik değerlendirmesi yap',
          'Eğitim materyali hazırla'
        ]
      }
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-blue-600" />
          <span>AI Asistan</span>
          <Sparkles className="w-4 h-4 text-yellow-500" />
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.type === 'assistant' && (
                    <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.metadata?.suggestions && (
                      <div className="mt-2 space-y-1">
                        {message.metadata.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="block w-full text-left text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                          >
                            💡 {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="AI asistanına soru sorun..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Enter tuşuna basarak gönderin • Shift+Enter ile yeni satır
          </div>
        </div>
      </CardContent>
    </div>
  );
};

export default AIAssistant;
