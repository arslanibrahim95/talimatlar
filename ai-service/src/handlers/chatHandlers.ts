// Chat-related handlers for AI service
import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { ChatMessage, ChatSession, AIResponse } from '../types/chat.ts';
import { getAIResponse } from '../services/aiService.ts';

// In-memory storage (production'da database kullanılacak)
const chatSessions: Map<string, ChatSession> = new Map();

/**
 * Create a new chat session
 */
export async function createChatSession(ctx: Context) {
  try {
    const { userId } = await ctx.request.body().value;
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: ChatSession = {
      id: sessionId,
      userId,
      messages: [],
      context: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    chatSessions.set(sessionId, session);
    
    ctx.response.body = {
      success: true,
      data: { sessionId, session }
    };
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get chat session by ID
 */
export function getChatSession(ctx: Context) {
  const sessionId = ctx.params?.sessionId;
  const session = chatSessions.get(sessionId);
  
  if (!session) {
    ctx.response.status = 404;
    ctx.response.body = {
      success: false,
      error: "Session not found"
    };
    return;
  }
  
  ctx.response.body = {
    success: true,
    data: session
  };
}

/**
 * Add message to chat session
 */
export async function addChatMessage(ctx: Context) {
  try {
    const sessionId = ctx.params?.sessionId;
    const { message, provider = 'openai' } = await ctx.request.body().value;
    
    const session = chatSessions.get(sessionId);
    if (!session) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "Session not found"
      };
      return;
    }
    
    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    session.messages.push(userMessage);
    
    // Get AI response
    const aiResponse = await getAIResponse(session.messages, provider);
    
    // Add AI response
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: aiResponse.content,
      timestamp: new Date()
    };
    session.messages.push(assistantMessage);
    session.updatedAt = new Date();
    
    ctx.response.body = {
      success: true,
      data: {
        userMessage,
        assistantMessage,
        usage: aiResponse.usage
      }
    };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get all chat sessions (for analytics)
 */
export function getAllChatSessions(): Map<string, ChatSession> {
  return chatSessions;
}
