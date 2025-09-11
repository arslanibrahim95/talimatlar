import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { aiService } from '../../services/aiService';

/**
 * Message interface for chat conversation
 */
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'text' | 'command' | 'file' | 'system';
}

/**
 * Props interface for AIChat component
 */
interface AIChatProps {
  className?: string;
  onCommand?: (command: string) => void;
}

/**
 * AI Chat component for Claude Talimat system management
 * Provides interactive chat interface with AI assistant
 * Supports text messages, commands, and file handling
 * 
 * @param className - Additional CSS classes for styling
 * @param onCommand - Callback function for system commands
 * @returns AI chat interface component
 */
const AIChat: React.FC<AIChatProps> = ({ className, onCommand }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Scrolls chat to bottom when new messages arrive
   * Ensures latest messages are always visible
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Initializes chat session and adds welcome message
   * Creates new AI chat session for the user
   */
  useEffect(() => {
    const initSession = async () => {
      try {
        const session = await aiService.createChatSession('Claude Talimat Chat');
        setSessionId(session.id);
        
        // Add welcome message
        const welcomeMessage: Message = {
          id: 'welcome',
          role: 'assistant',
          content: 'Merhaba! Claude Talimat sistem yönetimi için size yardımcı olabilirim. Hangi konuda yardım istiyorsunuz?',
          timestamp: new Date(),
          type: 'text'
        };
        setMessages([welcomeMessage]);
      } catch (error) {
        console.error('Session initialization error:', error);
      }
    };

    initSession();
  }, []);

  /**
   * Handles sending user messages to AI service
   * Processes responses and detects system commands
   */
  const handleSendMessage = async () => {
    if (!input.trim() || !sessionId || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const message = await aiService.sendChatMessage(sessionId, input);
      
      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: message.content,
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Check if it's a system command
      if (message.content.includes('komut') || 
          message.content.includes('sistem')) {
        onCommand?.(input);
      }
    } catch (error) {
      console.error('Message send error:', error);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'system',
        content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
        timestamp: new Date(),
        type: 'system'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles Enter key press for sending messages
   * @param e - Keyboard event
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Handles file upload to chat
   * @param file - File to upload
   */
  const handleFileUpload = async (file: File) => {
    if (!sessionId) return;

    const fileMessage: Message = {
      id: `file_${Date.now()}`,
      role: 'user',
      content: `Dosya yüklendi: ${file.name}`,
      timestamp: new Date(),
      type: 'file'
    };

    setMessages(prev => [...prev, fileMessage]);

    try {
      // Process file with AI service
      const response = await aiService.processFile(sessionId, file);
      
      const aiResponse: Message = {
        id: `ai_file_${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('File processing error:', error);
      const errorMessage: Message = {
        id: `error_file_${Date.now()}`,
        role: 'system',
        content: 'Dosya işlenirken bir hata oluştu.',
        timestamp: new Date(),
        type: 'system'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  /**
   * Clears chat history and starts new session
   */
  const clearChat = async () => {
    if (sessionId) {
      try {
        await aiService.endChatSession(sessionId);
      } catch (error) {
        console.error('Session end error:', error);
      }
    }
    
    setMessages([]);
    setSessionId(null);
    
    // Initialize new session
    const initSession = async () => {
      try {
        const session = await aiService.createChatSession('Claude Talimat Chat');
        setSessionId(session.id);
        
        const welcomeMessage: Message = {
          id: 'welcome_new',
          role: 'assistant',
          content: 'Yeni sohbet başlatıldı. Size nasıl yardımcı olabilirim?',
          timestamp: new Date(),
          type: 'text'
        };
        setMessages([welcomeMessage]);
      } catch (error) {
        console.error('New session initialization error:', error);
      }
    };

    initSession();
  };

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Claude Talimat AI Asistanı</span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              disabled={isLoading}
            >
              Yeni Sohbet
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Messages Display */}
        <div className="h-96 overflow-y-auto space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.role === 'assistant'
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                }`}
              >
                <div className="text-sm font-medium mb-1">
                  {message.role === 'user' ? 'Siz' : 
                   message.role === 'assistant' ? 'Claude AI' : 'Sistem'}
                </div>
                <div className="text-sm">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Mesajınızı yazın veya komut girin..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? 'Gönderiliyor...' : 'Gönder'}
          </Button>
        </div>

        {/* File Upload */}
        <div className="flex items-center space-x-2">
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            accept=".pdf,.doc,.docx,.txt,.md"
            className="text-sm"
            disabled={isLoading}
          />
          <span className="text-xs text-gray-500">
            PDF, DOC, TXT dosyaları desteklenir
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChat;
