// API Key Configuration and Management
interface APIKeyConfig {
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
    enabled: boolean;
  };
  claude: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
    enabled: boolean;
  };
  local: {
    enabled: boolean;
    endpoint: string;
    model: string;
  };
}

interface UsageStats {
  provider: string;
  requests: number;
  tokens: number;
  cost: number;
  lastUsed: Date;
  errors: number;
}

export class APIKeyManager {
  private static instance: APIKeyManager;
  private config: APIKeyConfig;
  private usageStats: Map<string, UsageStats> = new Map();

  private constructor() {
    this.config = {
      openai: {
        apiKey: Deno.env.get('OPENAI_API_KEY') || '',
        model: 'gpt-4',
        maxTokens: 2000,
        temperature: 0.7,
        enabled: !!Deno.env.get('OPENAI_API_KEY')
      },
      claude: {
        apiKey: Deno.env.get('CLAUDE_API_KEY') || '',
        model: 'claude-3-sonnet-20240229',
        maxTokens: 2000,
        temperature: 0.7,
        enabled: !!Deno.env.get('CLAUDE_API_KEY')
      },
      local: {
        enabled: false,
        endpoint: 'http://localhost:11434',
        model: 'llama2'
      }
    };
  }

  static getInstance(): APIKeyManager {
    if (!APIKeyManager.instance) {
      APIKeyManager.instance = new APIKeyManager();
    }
    return APIKeyManager.instance;
  }

  getConfig(): APIKeyConfig {
    return { ...this.config };
  }

  async updateConfig(newConfig: Partial<APIKeyConfig>): Promise<boolean> {
    try {
      if (newConfig.openai) {
        this.config.openai = { ...this.config.openai, ...newConfig.openai };
        if (newConfig.openai.apiKey) {
          this.config.openai.enabled = await this.validateAPIKey('openai', newConfig.openai.apiKey);
        }
      }
      
      if (newConfig.claude) {
        this.config.claude = { ...this.config.claude, ...newConfig.claude };
        if (newConfig.claude.apiKey) {
          this.config.claude.enabled = await this.validateAPIKey('claude', newConfig.claude.apiKey);
        }
      }
      
      if (newConfig.local) {
        this.config.local = { ...this.config.local, ...newConfig.local };
      }
      
      return true;
    } catch (error) {
      console.error('Config update error:', error);
      return false;
    }
  }

  async validateAPIKey(provider: string, apiKey: string): Promise<boolean> {
    try {
      switch (provider) {
        case 'openai':
          return await this.validateOpenAIKey(apiKey);
        case 'claude':
          return await this.validateClaudeKey(apiKey);
        case 'local':
          return await this.validateLocalEndpoint(apiKey);
        default:
          return false;
      }
    } catch (error) {
      console.error(`API key validation error for ${provider}:`, error);
      return false;
    }
  }

  private async validateOpenAIKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async validateClaudeKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async validateLocalEndpoint(endpoint: string): Promise<boolean> {
    try {
      const response = await fetch(`${endpoint}/api/tags`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async getBestProvider(): Promise<string> {
    const providers = ['openai', 'claude', 'local'];
    
    for (const provider of providers) {
      if (this.isProviderEnabled(provider)) {
        return provider;
      }
    }
    
    throw new Error('No AI provider is available');
  }

  isProviderEnabled(provider: string): boolean {
    switch (provider) {
      case 'openai':
        return this.config.openai.enabled && !!this.config.openai.apiKey;
      case 'claude':
        return this.config.claude.enabled && !!this.config.claude.apiKey;
      case 'local':
        return this.config.local.enabled;
      default:
        return false;
    }
  }

  getProviderConfig(provider: string): any {
    switch (provider) {
      case 'openai':
        return this.config.openai;
      case 'claude':
        return this.config.claude;
      case 'local':
        return this.config.local;
      default:
        return null;
    }
  }

  async recordUsage(provider: string, tokens: number, cost: number = 0): Promise<void> {
    const stats = this.usageStats.get(provider) || {
      provider,
      requests: 0,
      tokens: 0,
      cost: 0,
      lastUsed: new Date(),
      errors: 0
    };
    
    stats.requests++;
    stats.tokens += tokens;
    stats.cost += cost;
    stats.lastUsed = new Date();
    
    this.usageStats.set(provider, stats);
  }

  async recordError(provider: string): Promise<void> {
    const stats = this.usageStats.get(provider) || {
      provider,
      requests: 0,
      tokens: 0,
      cost: 0,
      lastUsed: new Date(),
      errors: 0
    };
    
    stats.errors++;
    this.usageStats.set(provider, stats);
  }

  getUsageStats(): UsageStats[] {
    return Array.from(this.usageStats.values());
  }

  getUsageStatsForProvider(provider: string): UsageStats | null {
    return this.usageStats.get(provider) || null;
  }

  async rotateAPIKey(provider: string): Promise<boolean> {
    // In a real implementation, this would rotate the API key
    // For now, we'll just re-validate the current key
    const config = this.getProviderConfig(provider);
    if (config && config.apiKey) {
      return await this.validateAPIKey(provider, config.apiKey);
    }
    return false;
  }

  async getCostEstimate(provider: string, tokens: number): Promise<number> {
    // Cost estimates per 1K tokens
    const costPer1K = {
      'openai': {
        'gpt-4': 0.03,
        'gpt-3.5-turbo': 0.002
      },
      'claude': {
        'claude-3-sonnet-20240229': 0.015,
        'claude-3-haiku-20240307': 0.0025
      },
      'local': 0
    };
    
    const providerCosts = costPer1K[provider as keyof typeof costPer1K];
    if (!providerCosts) return 0;
    
    const model = this.getProviderConfig(provider)?.model;
    const costPerToken = providerCosts[model as keyof typeof providerCosts] || 0;
    
    return (tokens / 1000) * costPerToken;
  }
}

export default APIKeyManager;
