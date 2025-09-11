import { 
  Personnel, 
  PersonnelCreate, 
  PersonnelUpdate, 
  PaginatedResponse,
  InstructionReading,
  InstructionReadingCreate,
  InstructionReadingStats,
  DepartmentStats,
  InstructionAssignment,
  InstructionAssignmentCreate,
  BulkPersonnelResult
} from '../types';
import { API_CONFIG, buildApiUrl } from '../config/api';

class PersonnelService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = buildApiUrl('AUTH_SERVICE', endpoint);
    const token = localStorage.getItem('auth_token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || `HTTP error! status: ${response.status}`;
        console.error(`API request failed for ${endpoint}:`, errorMessage);
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  // Personnel CRUD operations
  async getPersonnel(page: number = 1, limit: number = 20, search?: string, department?: string): Promise<PaginatedResponse<Personnel>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(department && { department })
    });

    return this.request<PaginatedResponse<Personnel>>(`/personnel?${params}`);
  }

  async getPersonnelById(id: string): Promise<Personnel> {
    return this.request<Personnel>(`/personnel/${id}`);
  }

  async createPersonnel(data: PersonnelCreate): Promise<Personnel> {
    return this.request<Personnel>('/personnel', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePersonnel(id: string, data: PersonnelUpdate): Promise<Personnel> {
    return this.request<Personnel>(`/personnel/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePersonnel(id: string): Promise<void> {
    return this.request<void>(`/personnel/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkUploadPersonnel(file: File, department?: string, manager_id?: string): Promise<BulkPersonnelResult> {
    const formData = new FormData();
    formData.append('file', file);
    if (department) formData.append('department', department);
    if (manager_id) formData.append('manager_id', manager_id);

    const token = localStorage.getItem('auth_token');
    const url = buildApiUrl('AUTH_SERVICE', '/personnel/bulk-upload');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Instruction reading tracking
  async getInstructionReadings(
    personnel_id?: string, 
    instruction_id?: string,
    page: number = 1, 
    limit: number = 20
  ): Promise<PaginatedResponse<InstructionReading>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(personnel_id && { personnel_id }),
      ...(instruction_id && { instruction_id })
    });

    return this.request<PaginatedResponse<InstructionReading>>(`/instruction-readings?${params}`);
  }

  async createInstructionReading(data: InstructionReadingCreate): Promise<InstructionReading> {
    return this.request<InstructionReading>('/instruction-readings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInstructionReading(id: string, data: Partial<InstructionReadingCreate>): Promise<InstructionReading> {
    return this.request<InstructionReading>(`/instruction-readings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getPersonnelReadingStats(personnel_id?: string): Promise<InstructionReadingStats[]> {
    const params = personnel_id ? `?personnel_id=${personnel_id}` : '';
    return this.request<InstructionReadingStats[]>(`/instruction-readings/stats${params}`);
  }

  async getDepartmentStats(): Promise<DepartmentStats[]> {
    return this.request<DepartmentStats[]>('/instruction-readings/department-stats');
  }

  // Instruction assignments
  async getInstructionAssignments(
    personnel_id?: string,
    instruction_id?: string,
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<InstructionAssignment>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(personnel_id && { personnel_id }),
      ...(instruction_id && { instruction_id }),
      ...(status && { status })
    });

    return this.request<PaginatedResponse<InstructionAssignment>>(`/instruction-assignments?${params}`);
  }

  async createInstructionAssignment(data: InstructionAssignmentCreate): Promise<InstructionAssignment> {
    return this.request<InstructionAssignment>('/instruction-assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInstructionAssignment(id: string, data: Partial<InstructionAssignmentCreate>): Promise<InstructionAssignment> {
    return this.request<InstructionAssignment>(`/instruction-assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInstructionAssignment(id: string): Promise<void> {
    return this.request<void>(`/instruction-assignments/${id}`, {
      method: 'DELETE',
    });
  }

  // Bulk operations
  async assignInstructionToMultiplePersonnel(
    instruction_id: string,
    personnel_ids: string[],
    due_date?: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<InstructionAssignment[]> {
    return this.request<InstructionAssignment[]>('/instruction-assignments/bulk', {
      method: 'POST',
      body: JSON.stringify({
        instruction_id,
        personnel_ids,
        due_date,
        priority
      }),
    });
  }

  // Toplu talimat atama (kriterlere göre)
  async bulkAssignByCriteria(assignment: BulkInstructionAssignment): Promise<BulkAssignmentResult> {
    return this.request<BulkAssignmentResult>('/instruction-assignments/bulk-by-criteria', {
      method: 'POST',
      body: JSON.stringify(assignment),
    });
  }

  // Atama şablonlarını listele
  async getAssignmentTemplates(): Promise<AssignmentTemplate[]> {
    return this.request<AssignmentTemplate[]>('/instruction-assignments/templates');
  }

  // Atama şablonu oluştur
  async createAssignmentTemplate(template: AssignmentTemplateCreate): Promise<AssignmentTemplate> {
    return this.request<AssignmentTemplate>('/instruction-assignments/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  }

  // Atama şablonu güncelle
  async updateAssignmentTemplate(id: string, template: Partial<AssignmentTemplateCreate>): Promise<AssignmentTemplate> {
    return this.request<AssignmentTemplate>(`/instruction-assignments/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(template),
    });
  }

  // Atama şablonu sil
  async deleteAssignmentTemplate(id: string): Promise<void> {
    return this.request<void>(`/instruction-assignments/templates/${id}`, {
      method: 'DELETE',
    });
  }

  // Vardiya bilgilerini listele
  async getWorkShifts(): Promise<WorkShift[]> {
    return this.request<WorkShift[]>('/work-shifts');
  }

  // Yetenek bilgilerini listele
  async getSkills(): Promise<Skill[]> {
    return this.request<Skill[]>('/skills');
  }

  // Lokasyon bilgilerini listele
  async getLocations(): Promise<Location[]> {
    return this.request<Location[]>('/locations');
  }

  // Kriterlere göre personel sayısını hesapla
  async getPersonnelCountByCriteria(criteria: AssignmentCriteria): Promise<{
    total: number;
    by_department: Record<string, number>;
    by_position: Record<string, number>;
    preview: Personnel[];
  }> {
    return this.request<{
      total: number;
      by_department: Record<string, number>;
      by_position: Record<string, number>;
      preview: Personnel[];
    }>('/personnel/count-by-criteria', {
      method: 'POST',
      body: JSON.stringify(criteria),
    });
  }

  // Toplu atama geçmişi
  async getBulkAssignmentHistory(page: number = 1, limit: number = 20): Promise<PaginatedResponse<{
    id: string;
    instruction_title: string;
    assigned_by: string;
    assigned_at: string;
    total_assigned: number;
    success_count: number;
    criteria_summary: string;
  }>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    return this.request<PaginatedResponse<{
      id: string;
      instruction_title: string;
      assigned_by: string;
      assigned_at: string;
      total_assigned: number;
      success_count: number;
      criteria_summary: string;
    }>>(`/instruction-assignments/bulk-history?${params}`);
  }

  // Export functionality
  async exportPersonnelData(format: 'csv' | 'excel' = 'csv', filters?: any): Promise<Blob> {
    const params = new URLSearchParams({
      format,
      ...(filters && { filters: JSON.stringify(filters) })
    });

    const token = localStorage.getItem('auth_token');
    const url = buildApiUrl('AUTH_SERVICE', `/personnel/export?${params}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  async exportReadingReport(format: 'csv' | 'excel' = 'csv', filters?: any): Promise<Blob> {
    const params = new URLSearchParams({
      format,
      ...(filters && { filters: JSON.stringify(filters) })
    });

    const token = localStorage.getItem('auth_token');
    const url = buildApiUrl('AUTH_SERVICE', `/instruction-readings/export?${params}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }
}

export const personnelService = new PersonnelService();
