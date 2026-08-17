export type StackStatus = 'Active' | 'Empty' | 'Closed' | 'Transferred' | 'Archived';
export type ExerciseStatus = 'Planned' | 'In Progress' | 'Completed' | 'Postponed' | 'Cancelled';

export type ChallengeCategory =
  | 'Chemical availability'
  | 'Labour'
  | 'Equipment'
  | 'Weather'
  | 'Warehouse condition'
  | 'Stack accessibility'
  | 'Transport'
  | 'Security'
  | 'Other';

export interface Warehouse {
  id: number;
  warehouse_code: string;
  warehouse_name: string;
  location: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  total_stacks?: number;
  active_stacks?: number;
}

export interface Officer {
  id: number;
  employee_number: string;
  name: string;
  department: string;
  phone?: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Commodity {
  id: number;
  commodity_name: string;
  default_unit: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Stack {
  id: number;
  warehouse_id: number;
  stack_number: string;
  commodity_id: number;
  current_quantity: number;
  unit: string;
  status: StackStatus;
  created_at: string;
  updated_at: string;
  warehouse_name?: string;
  warehouse_code?: string;
  commodity_name?: string;
}

export interface FumigationExerciseStackSnapshot {
  id: number;
  fumigation_exercise_id: number;
  stack_id: number;
  stack_number_snapshot: string;
  commodity_id: number;
  commodity_name_snapshot: string;
  quantity_snapshot: number;
  unit_snapshot: string;
  created_at: string;
  current_stack_quantity?: number;
  current_stack_status?: string;
}

export interface FumigationChallenge {
  id: number;
  fumigation_exercise_id: number;
  challenge_category: string;
  description: string;
  action_resolution?: string | null;
  resolved: number;
  resolution_date?: string | null;
  created_at: string;
  updated_at: string;
  exercise_number?: string;
  warehouse_name?: string;
  planned_fumigation_date?: string;
}

export interface FumigationExercise {
  id: number;
  exercise_number: string;
  warehouse_id: number;
  planned_fumigation_date: string;
  actual_fumigation_date?: string | null;
  planned_duration: number;
  actual_duration?: number | null;
  responsible_officer_id: number;
  status: ExerciseStatus;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
  warehouse_name?: string;
  warehouse_code?: string;
  officer_name?: string;
  officer_department?: string;
  stacks_count?: number;
  total_quantity?: number;
  unit_breakdown?: { unit: string; total_quantity: number }[];
  stacks?: FumigationExerciseStackSnapshot[];
  challenges?: FumigationChallenge[];
  challenges_count?: number;
  unresolved_challenges?: number;
}

export interface DashboardStats {
  totalWarehouses: number;
  totalActiveStacks: number;
  plannedExercises: number;
  completedExercises: number;
  inProgressExercises: number;
  postponedExercises: number;
  totalStacksFumigated: number;
  totalQuantityCovered: { unit: string; total: number }[];
  upcomingExercises: {
    id: number;
    exercise_number: string;
    warehouse_name: string;
    planned_date: string;
    duration: number;
    officer_name: string;
    stacks_count: number;
    status: ExerciseStatus;
  }[];
  recentChallenges: {
    id: number;
    exercise_number: string;
    warehouse_name: string;
    category: string;
    description: string;
    resolved: number;
    created_at: string;
  }[];
}

export interface ReportFilterState {
  startDate: string;
  endDate: string;
  dateType: 'planned' | 'actual';
  warehouseId: string;
  officerId: string;
  commodityId: string;
  status: string;
  stackNumber: string;
  search: string;
}

export interface ReportSummaryData {
  totalExercises: number;
  totalStacksFumigated: number;
  statusCounts: Record<string, number>;
  warehouseSummaries: {
    warehouse_name: string;
    exercises_count: number;
    stacks_count: number;
    quantitiesByUnit: { unit: string; total: number }[];
  }[];
  commoditySummaries: {
    commodity_name: string;
    unit: string;
    total_quantity: number;
    stacks_count: number;
  }[];
  totalQuantitiesByUnit: { unit: string; total: number }[];
}

export interface FullReportResponse {
  exercises: FumigationExercise[];
  filters: Partial<ReportFilterState>;
  reportingPeriodText: string;
  summary: ReportSummaryData;
}
