// Common utility functions for AI service
export interface SystemStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unreachable';
  responseTime: number;
  uptime?: string;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
}

export interface AnalyticsData {
  type: string;
  data: any;
  message: string;
}

export interface InstructionData {
  type: string;
  data: any;
  message: string;
}

/**
 * Check system status for multiple services
 */
export async function checkSystemStatus(): Promise<SystemStatus[]> {
  const services = [
    { name: 'Auth Service', url: 'http://localhost:8004/health' },
    { name: 'Analytics Service', url: 'http://localhost:8003/health' },
    { name: 'Instruction Service', url: 'http://localhost:8003/health' }
  ];
  
  const statuses = await Promise.allSettled(
    services.map(async (service) => {
      try {
        const response = await fetch(service.url);
        return {
          name: service.name,
          status: response.ok ? 'healthy' : 'unhealthy',
          responseTime: Date.now()
        };
      } catch {
        return {
          name: service.name,
          status: 'unreachable',
          responseTime: Date.now()
        };
      }
    })
  );
  
  return statuses.map(result => 
    result.status === 'fulfilled' ? result.value : { name: 'Unknown', status: 'unreachable', responseTime: Date.now() }
  );
}

/**
 * List users from auth service
 */
export async function listUsers(): Promise<UserData[]> {
  try {
    const response = await fetch('http://localhost:8004/users');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

/**
 * Get analytics data
 */
export async function getAnalytics(): Promise<AnalyticsData> {
  try {
    const response = await fetch('http://localhost:8003/analytics/dashboard');
    const data = await response.json();
    return {
      type: 'analytics',
      data: data,
      message: 'Analitik veriler alındı.'
    };
  } catch (error) {
    return {
      type: 'error',
      data: null,
      message: 'Analitik veriler alınamadı.'
    };
  }
}

/**
 * List instructions from instruction service
 */
export async function listInstructions(): Promise<InstructionData> {
  try {
    const response = await fetch('http://localhost:8003/instructions');
    const data = await response.json();
    return {
      type: 'instruction_list',
      data: data,
      message: `${data.length} talimat bulundu.`
    };
  } catch (error) {
    return {
      type: 'error',
      data: null,
      message: 'Talimat listesi alınamadı.'
    };
  }
}

/**
 * Format error response consistently
 */
export function formatErrorResponse(error: unknown, context: string): any {
  return {
    type: 'error',
    message: `${context} sırasında hata oluştu.`,
    error: error instanceof Error ? error.message : 'Unknown error'
  };
}

/**
 * Format success response consistently
 */
export function formatSuccessResponse(type: string, data: any, message: string): any {
  return {
    type,
    data,
    message
  };
}
