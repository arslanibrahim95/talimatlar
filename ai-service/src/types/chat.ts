// Chat-related type definitions
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  context: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
}
