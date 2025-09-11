// AI service functions for different providers
import { ChatMessage, AIResponse } from '../types/chat.ts';
import APIKeyManager from '../config/apiKeys.ts';

const apiKeyManager = APIKeyManager.getInstance();

/**
 * Get AI response from specified provider
 */
export async function getAIResponse(messages: ChatMessage[], providerName: string): Promise<AIResponse> {
  try {
    if (!apiKeyManager.isProviderEnabled(providerName)) {
      throw new Error(`Provider ${providerName} is not enabled or configured`);
    }
    
    const providerConfig = apiKeyManager.getProviderConfig(providerName);
    if (!providerConfig) {
      throw new Error(`Provider configuration not found for ${providerName}`);
    }
    
    switch (providerName) {
      case 'openai':
        return await getOpenAIResponse(messages, providerConfig);
      case 'claude':
        return await getClaudeResponse(messages, providerConfig);
      case 'local':
        return await getLocalResponse(messages, providerConfig);
      default:
        throw new Error(`Unsupported provider: ${providerName}`);
    }
  } catch (error) {
    console.error(`Error in getAIResponse for provider ${providerName}:`, error);
    throw error;
  }
}

/**
 * Get response from OpenAI
 */
async function getOpenAIResponse(messages: ChatMessage[], providerConfig: any): Promise<AIResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${providerConfig.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: providerConfig.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      max_tokens: providerConfig.maxTokens,
      temperature: providerConfig.temperature
    })
  });
  
  if (!response.ok) {
    await apiKeyManager.recordError('openai');
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Record usage statistics
  await apiKeyManager.recordUsage('openai', data.usage.total_tokens);
  
  return {
    content: data.choices[0].message.content,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens
    },
    model: data.model,
    provider: 'openai'
  };
}

/**
 * Get response from Claude
 */
async function getClaudeResponse(messages: ChatMessage[], providerConfig: any): Promise<AIResponse> {
  // Claude API format
  const systemMessage = messages.find(msg => msg.role === 'system');
  const conversationMessages = messages.filter(msg => msg.role !== 'system');
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': providerConfig.apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: providerConfig.model,
      max_tokens: providerConfig.maxTokens,
      system: systemMessage?.content || "You are a helpful assistant for managing the Claude Talimat system.",
      messages: conversationMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    })
  });
  
  if (!response.ok) {
    await apiKeyManager.recordError('claude');
    throw new Error(`Claude API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Record usage statistics
  const totalTokens = data.usage.input_tokens + data.usage.output_tokens;
  await apiKeyManager.recordUsage('claude', totalTokens);
  
  return {
    content: data.content[0].text,
    usage: {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: totalTokens
    },
    model: data.model,
    provider: 'claude'
  };
}

/**
 * Get response from local model
 */
async function getLocalResponse(messages: ChatMessage[], providerConfig: any): Promise<AIResponse> {
  // Local model integration (Ollama, LM Studio, etc.)
  const response = await fetch(`${providerConfig.endpoint}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: providerConfig.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      stream: false
    })
  });
  
  if (!response.ok) {
    await apiKeyManager.recordError('local');
    throw new Error(`Local model API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Record usage statistics (estimate tokens)
  const estimatedTokens = data.message.content.length / 4; // Rough estimation
  await apiKeyManager.recordUsage('local', estimatedTokens);
  
  return {
    content: data.message.content,
    usage: {
      promptTokens: Math.floor(estimatedTokens * 0.7),
      completionTokens: Math.floor(estimatedTokens * 0.3),
      totalTokens: estimatedTokens
    },
    model: providerConfig.model,
    provider: 'local'
  };
}
