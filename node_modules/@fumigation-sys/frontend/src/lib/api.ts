import type {
  Warehouse,
  Officer,
  Commodity,
  Stack,
  FumigationExercise,
  FumigationChallenge,
  DashboardStats,
  FullReportResponse,
  ReportFilterState,
} from '../types';

const configuredApiBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const API_BASE = configuredApiBase ? `${configuredApiBase}/api` : '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`;
    try {
      const body = await res.json();
      if (body && body.message) {
        errorMsg = body.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  const json = await res.json();
  return json.data as T;
}

export const api = {
  // Warehouses
  async getWarehouses(activeOnly = false): Promise<Warehouse[]> {
    const res = await fetch(`${API_BASE}/warehouses${activeOnly ? '?active=true' : ''}`);
    return handleResponse<Warehouse[]>(res);
  },

  async createWarehouse(data: { warehouse_code: string; warehouse_name: string; location: string; is_active?: number }): Promise<Warehouse> {
    const res = await fetch(`${API_BASE}/warehouses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Warehouse>(res);
  },

  async updateWarehouse(id: number, data: Partial<Warehouse>): Promise<Warehouse> {
    const res = await fetch(`${API_BASE}/warehouses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Warehouse>(res);
  },

  // Officers
  async getOfficers(activeOnly = false): Promise<Officer[]> {
    const res = await fetch(`${API_BASE}/officers${activeOnly ? '?active=true' : ''}`);
    return handleResponse<Officer[]>(res);
  },

  async createOfficer(data: { employee_number: string; name: string; department: string; phone?: string; is_active?: number }): Promise<Officer> {
    const res = await fetch(`${API_BASE}/officers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Officer>(res);
  },

  async updateOfficer(id: number, data: Partial<Officer>): Promise<Officer> {
    const res = await fetch(`${API_BASE}/officers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Officer>(res);
  },

  // Commodities
  async getCommodities(activeOnly = false): Promise<Commodity[]> {
    const res = await fetch(`${API_BASE}/commodities${activeOnly ? '?active=true' : ''}`);
    return handleResponse<Commodity[]>(res);
  },

  async createCommodity(data: { commodity_name: string; default_unit?: string; is_active?: number }): Promise<Commodity> {
    const res = await fetch(`${API_BASE}/commodities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Commodity>(res);
  },

  async updateCommodity(id: number, data: Partial<Commodity>): Promise<Commodity> {
    const res = await fetch(`${API_BASE}/commodities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Commodity>(res);
  },

  // Stacks
  async getStacks(params?: { warehouse_id?: number | string; commodity_id?: number | string; status?: string; search?: string; active_only?: boolean }): Promise<Stack[]> {
    const query = new URLSearchParams();
    if (params?.warehouse_id) query.set('warehouse_id', String(params.warehouse_id));
    if (params?.commodity_id) query.set('commodity_id', String(params.commodity_id));
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.active_only) query.set('active_only', 'true');

    const res = await fetch(`${API_BASE}/stacks?${query.toString()}`);
    return handleResponse<Stack[]>(res);
  },

  async createStack(data: { warehouse_id: number; stack_number: string; commodity_id: number; current_quantity: number; unit?: string; status?: string }): Promise<Stack> {
    const res = await fetch(`${API_BASE}/stacks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Stack>(res);
  },

  async updateStack(id: number, data: Partial<Stack>): Promise<Stack> {
    const res = await fetch(`${API_BASE}/stacks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Stack>(res);
  },

  // Fumigation Exercises
  async getExercises(params?: { warehouse_id?: string; officer_id?: string; status?: string; search?: string; start_date?: string; end_date?: string; date_type?: string }): Promise<FumigationExercise[]> {
    const query = new URLSearchParams();
    if (params?.warehouse_id) query.set('warehouse_id', params.warehouse_id);
    if (params?.officer_id) query.set('officer_id', params.officer_id);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.start_date) query.set('start_date', params.start_date);
    if (params?.end_date) query.set('end_date', params.end_date);
    if (params?.date_type) query.set('date_type', params.date_type);

    const res = await fetch(`${API_BASE}/fumigation-exercises?${query.toString()}`);
    return handleResponse<FumigationExercise[]>(res);
  },

  async getExerciseById(id: number): Promise<FumigationExercise> {
    const res = await fetch(`${API_BASE}/fumigation-exercises/${id}`);
    return handleResponse<FumigationExercise>(res);
  },

  async createExercise(data: {
    exercise_number?: string;
    warehouse_id: number;
    planned_fumigation_date: string;
    planned_duration: number;
    responsible_officer_id: number;
    remarks?: string;
    stack_ids: number[];
  }): Promise<{ exercise: FumigationExercise; snapshots: unknown[] }> {
    const res = await fetch(`${API_BASE}/fumigation-exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{ exercise: FumigationExercise; snapshots: unknown[] }>(res);
  },

  async updateExercise(id: number, data: Partial<FumigationExercise>): Promise<FumigationExercise> {
    const res = await fetch(`${API_BASE}/fumigation-exercises/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<FumigationExercise>(res);
  },

  // Challenges
  async getChallenges(params?: { exercise_id?: number; category?: string; resolved?: boolean }): Promise<FumigationChallenge[]> {
    const query = new URLSearchParams();
    if (params?.exercise_id) query.set('exercise_id', String(params.exercise_id));
    if (params?.category) query.set('category', params.category);
    if (params?.resolved !== undefined) query.set('resolved', String(params.resolved));

    const res = await fetch(`${API_BASE}/challenges?${query.toString()}`);
    return handleResponse<FumigationChallenge[]>(res);
  },

  async createChallenge(exerciseId: number, data: { challenge_category: string; description: string; action_resolution?: string; resolved?: boolean; resolution_date?: string }): Promise<FumigationChallenge> {
    const res = await fetch(`${API_BASE}/fumigation-exercises/${exerciseId}/challenges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<FumigationChallenge>(res);
  },

  async updateChallenge(id: number, data: Partial<FumigationChallenge>): Promise<FumigationChallenge> {
    const res = await fetch(`${API_BASE}/challenges/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<FumigationChallenge>(res);
  },

  // Reports & Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    return handleResponse<DashboardStats>(res);
  },

  async getReport(filters: Partial<ReportFilterState>): Promise<FullReportResponse> {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== '') {
        query.set(key, String(val));
      }
    });
    const res = await fetch(`${API_BASE}/reports/fumigation?${query.toString()}`);
    return handleResponse<FullReportResponse>(res);
  },

  getExcelReportUrl(filters: Partial<ReportFilterState>): string {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== '') {
        query.set(key, String(val));
      }
    });
    return `${API_BASE}/reports/fumigation/excel?${query.toString()}`;
  },

  async resetSeedData(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/system/reset-seed`, { method: 'POST' });
    const body = await res.json();
    return body;
  },
};
