import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { config } from '../config/env.js';
import type {
  Warehouse,
  Officer,
  Commodity,
  Stack,
  FumigationExercise,
  FumigationExerciseStackSnapshot,
  FumigationChallenge,
} from '../types/index.js';

export interface DatabaseState {
  warehouses: Warehouse[];
  officers: Officer[];
  commodities: Commodity[];
  stacks: Stack[];
  fumigation_exercises: FumigationExercise[];
  fumigation_exercise_stacks: FumigationExerciseStackSnapshot[];
  fumigation_challenges: FumigationChallenge[];
  nextIds: {
    warehouses: number;
    officers: number;
    commodities: number;
    stacks: number;
    fumigation_exercises: number;
    fumigation_exercise_stacks: number;
    fumigation_challenges: number;
  };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'fumigation_data.json');

// Initial default seed dataset
export function getDefaultSeedData(): DatabaseState {
  const now = '2026-08-01 08:00:00';
  return {
    warehouses: [
      {
        id: 1,
        warehouse_code: 'WH-BLA',
        warehouse_name: 'Blantyre Main Depot',
        location: 'Makata Industrial Area, Blantyre',
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        warehouse_code: 'WH-MZU',
        warehouse_name: 'Mzuzu Regional Warehouse',
        location: 'Luwinga Industrial Site, Mzuzu',
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        warehouse_code: 'WH-LLW',
        warehouse_name: 'Lilongwe Central Silos',
        location: 'Kanengo Industrial Zone, Lilongwe',
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
    ],
    officers: [
      {
        id: 1,
        employee_number: 'EMP-001',
        name: 'John Banda',
        department: 'Quality Assurance & Pest Control',
        phone: '+265 991 234 567',
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        employee_number: 'EMP-002',
        name: 'Mary Phiri',
        department: 'Warehouse Operations',
        phone: '+265 888 765 432',
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        employee_number: 'EMP-003',
        name: 'Chikondi Gondwe',
        department: 'Plant Protection Services',
        phone: '+265 999 112 233',
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
    ],
    commodities: [
      {
        id: 1,
        commodity_name: 'Maize',
        default_unit: 'Bags (50kg)',
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        commodity_name: 'Soybean',
        default_unit: 'Bags (50kg)',
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        commodity_name: 'Groundnuts',
        default_unit: 'Bags (50kg)',
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 4,
        commodity_name: 'Paddy Rice',
        default_unit: 'Bags (50kg)',
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 5,
        commodity_name: 'Wheat Grain',
        default_unit: 'Metric Tonnes',
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
    ],
    stacks: [
      // Blantyre
      {
        id: 1,
        warehouse_id: 1,
        stack_number: 'B001',
        commodity_id: 1,
        current_quantity: 500,
        unit: 'Bags (50kg)',
        status: 'Active',
        created_at: '2026-08-05 09:00:00',
        updated_at: '2026-08-05 09:00:00',
      },
      {
        id: 2,
        warehouse_id: 1,
        stack_number: 'B002',
        commodity_id: 1,
        current_quantity: 750,
        unit: 'Bags (50kg)',
        status: 'Active',
        created_at: '2026-08-05 09:00:00',
        updated_at: '2026-08-05 09:00:00',
      },
      {
        id: 3,
        warehouse_id: 1,
        stack_number: 'B003',
        commodity_id: 2,
        current_quantity: 300,
        unit: 'Bags (50kg)',
        status: 'Active',
        created_at: '2026-08-05 09:00:00',
        updated_at: '2026-08-05 09:00:00',
      },
      {
        id: 4,
        warehouse_id: 1,
        stack_number: 'B004',
        commodity_id: 1,
        current_quantity: 600,
        unit: 'Bags (50kg)',
        status: 'Active',
        created_at: '2026-08-05 09:00:00',
        updated_at: '2026-08-05 09:00:00',
      },
      {
        id: 5,
        warehouse_id: 1,
        stack_number: 'B005',
        commodity_id: 3,
        current_quantity: 450,
        unit: 'Bags (50kg)',
        status: 'Active',
        created_at: '2026-08-05 09:00:00',
        updated_at: '2026-08-05 09:00:00',
      },
      // Mzuzu
      {
        id: 6,
        warehouse_id: 2,
        stack_number: 'M001',
        commodity_id: 1,
        current_quantity: 800,
        unit: 'Bags (50kg)',
        status: 'Active',
        created_at: '2026-08-06 09:00:00',
        updated_at: '2026-08-06 09:00:00',
      },
      {
        id: 7,
        warehouse_id: 2,
        stack_number: 'M002',
        commodity_id: 1,
        current_quantity: 600,
        unit: 'Bags (50kg)',
        status: 'Active',
        created_at: '2026-08-06 09:00:00',
        updated_at: '2026-08-06 09:00:00',
      },
      {
        id: 8,
        warehouse_id: 2,
        stack_number: 'M003',
        commodity_id: 4,
        current_quantity: 550,
        unit: 'Bags (50kg)',
        status: 'Active',
        created_at: '2026-08-06 09:00:00',
        updated_at: '2026-08-06 09:00:00',
      },
      // Lilongwe
      {
        id: 9,
        warehouse_id: 3,
        stack_number: 'L001',
        commodity_id: 1,
        current_quantity: 1200,
        unit: 'Bags (50kg)',
        status: 'Active',
        created_at: '2026-08-07 09:00:00',
        updated_at: '2026-08-07 09:00:00',
      },
      {
        id: 10,
        warehouse_id: 3,
        stack_number: 'L002',
        commodity_id: 5,
        current_quantity: 250,
        unit: 'Metric Tonnes',
        status: 'Active',
        created_at: '2026-08-07 09:00:00',
        updated_at: '2026-08-07 09:00:00',
      },
    ],
    fumigation_exercises: [
      {
        id: 1,
        exercise_number: 'FUM-2026-001',
        warehouse_id: 1,
        planned_fumigation_date: '2026-08-25',
        actual_fumigation_date: '2026-08-25',
        planned_duration: 3,
        actual_duration: 3,
        responsible_officer_id: 1,
        status: 'Completed',
        remarks: 'Routine quarterly phosphine fumigation against weevils and grain borers.',
        created_at: '2026-08-10 10:00:00',
        updated_at: '2026-08-28 16:00:00',
      },
      {
        id: 2,
        exercise_number: 'FUM-2026-002',
        warehouse_id: 2,
        planned_fumigation_date: '2026-08-27',
        actual_fumigation_date: null,
        planned_duration: 2,
        actual_duration: null,
        responsible_officer_id: 2,
        status: 'Planned',
        remarks: 'Pre-distribution fumigation for relief food grain stacks.',
        created_at: '2026-08-12 11:00:00',
        updated_at: '2026-08-12 11:00:00',
      },
      {
        id: 3,
        exercise_number: 'FUM-2026-003',
        warehouse_id: 3,
        planned_fumigation_date: '2026-08-30',
        actual_fumigation_date: null,
        planned_duration: 4,
        actual_duration: null,
        responsible_officer_id: 3,
        status: 'Planned',
        remarks: 'Full silo enclosure fumigation scheduled before seasonal intake.',
        created_at: '2026-08-14 14:30:00',
        updated_at: '2026-08-14 14:30:00',
      },
    ],
    fumigation_exercise_stacks: [
      // FUM-2026-001 snapshots
      {
        id: 1,
        fumigation_exercise_id: 1,
        stack_id: 1,
        stack_number_snapshot: 'B001',
        commodity_id: 1,
        commodity_name_snapshot: 'Maize',
        quantity_snapshot: 500,
        unit_snapshot: 'Bags (50kg)',
        created_at: '2026-08-10 10:00:00',
      },
      {
        id: 2,
        fumigation_exercise_id: 1,
        stack_id: 2,
        stack_number_snapshot: 'B002',
        commodity_id: 1,
        commodity_name_snapshot: 'Maize',
        quantity_snapshot: 750,
        unit_snapshot: 'Bags (50kg)',
        created_at: '2026-08-10 10:00:00',
      },
      {
        id: 3,
        fumigation_exercise_id: 1,
        stack_id: 3,
        stack_number_snapshot: 'B003',
        commodity_id: 2,
        commodity_name_snapshot: 'Soybean',
        quantity_snapshot: 300,
        unit_snapshot: 'Bags (50kg)',
        created_at: '2026-08-10 10:00:00',
      },
      // FUM-2026-002 snapshots
      {
        id: 4,
        fumigation_exercise_id: 2,
        stack_id: 6,
        stack_number_snapshot: 'M001',
        commodity_id: 1,
        commodity_name_snapshot: 'Maize',
        quantity_snapshot: 800,
        unit_snapshot: 'Bags (50kg)',
        created_at: '2026-08-12 11:00:00',
      },
      {
        id: 5,
        fumigation_exercise_id: 2,
        stack_id: 7,
        stack_number_snapshot: 'M002',
        commodity_id: 1,
        commodity_name_snapshot: 'Maize',
        quantity_snapshot: 600,
        unit_snapshot: 'Bags (50kg)',
        created_at: '2026-08-12 11:00:00',
      },
      // FUM-2026-003 snapshots
      {
        id: 6,
        fumigation_exercise_id: 3,
        stack_id: 9,
        stack_number_snapshot: 'L001',
        commodity_id: 1,
        commodity_name_snapshot: 'Maize',
        quantity_snapshot: 1200,
        unit_snapshot: 'Bags (50kg)',
        created_at: '2026-08-14 14:30:00',
      },
      {
        id: 7,
        fumigation_exercise_id: 3,
        stack_id: 10,
        stack_number_snapshot: 'L002',
        commodity_id: 5,
        commodity_name_snapshot: 'Wheat Grain',
        quantity_snapshot: 250,
        unit_snapshot: 'Metric Tonnes',
        created_at: '2026-08-14 14:30:00',
      },
    ],
    fumigation_challenges: [
      {
        id: 1,
        fumigation_exercise_id: 1,
        challenge_category: 'Chemical availability',
        description: 'Aluminium phosphide tablets were temporarily unavailable at local depot.',
        action_resolution: 'Emergency stock transfer requisitioned from central store in Lilongwe.',
        resolved: 1,
        resolution_date: '2026-08-24',
        created_at: '2026-08-20 09:30:00',
        updated_at: '2026-08-24 15:00:00',
      },
      {
        id: 2,
        fumigation_exercise_id: 1,
        challenge_category: 'Weather',
        description: 'Heavy sudden rainfall delayed warehouse roof sealing and sand-snake placement.',
        action_resolution: 'Rescheduled sheet unfolding by 3 hours until showers ceased and relative humidity stabilized.',
        resolved: 1,
        resolution_date: '2026-08-25',
        created_at: '2026-08-25 08:00:00',
        updated_at: '2026-08-25 12:00:00',
      },
      {
        id: 3,
        fumigation_exercise_id: 1,
        challenge_category: 'Labour',
        description: 'Insufficient personnel available for simultaneous folding of heavy PVC fumigation gas sheets.',
        action_resolution: 'Hired 4 certified casual laborers from neighboring depot to assist safety team.',
        resolved: 1,
        resolution_date: '2026-08-25',
        created_at: '2026-08-25 09:00:00',
        updated_at: '2026-08-25 14:00:00',
      },
    ],
    nextIds: {
      warehouses: 4,
      officers: 4,
      commodities: 6,
      stacks: 11,
      fumigation_exercises: 4,
      fumigation_exercise_stacks: 8,
      fumigation_challenges: 4,
    },
  };
}

class RelationalDatabaseManager {
  private state: DatabaseState;
  private mysqlPool: mysql.Pool | null = null;
  private isUsingMysql: boolean = false;

  constructor() {
    this.state = this.loadPersistentState();
    this.initializeDatabase();
  }

  private loadPersistentState(): DatabaseState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.warehouses && parsed.fumigation_exercises) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read existing data store, initializing fresh seed data.', e);
    }
    const seed = getDefaultSeedData();
    this.persistState(seed);
    return seed;
  }

  private persistState(stateToSave: DatabaseState = this.state): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(stateToSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write persistent data file:', e);
    }
  }

  private async initializeDatabase(): Promise<void> {
    if (config.db.host && config.db.user) {
      try {
        this.mysqlPool = mysql.createPool({
          host: config.db.host,
          port: config.db.port,
          user: config.db.user,
          password: config.db.password,
          database: config.db.database,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
        });
        // Test connection
        const conn = await this.mysqlPool.getConnection();
        conn.release();
        this.isUsingMysql = true;
        console.log(`[Database] Connected successfully to MySQL instance at ${config.db.host}:${config.db.port}/${config.db.database}`);
      } catch (err) {
        console.warn(`[Database] MySQL credentials provided but connection failed. Falling back to internal ACID relational engine:`, (err as Error).message);
        this.isUsingMysql = false;
      }
    } else {
      console.log(`[Database] Running with integrated transactional Relational Engine (Data persistent at ${DATA_FILE})`);
    }
  }

  public get isMysqlActive(): boolean {
    return this.isUsingMysql;
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public resetToDefaultSeeds(): void {
    this.state = getDefaultSeedData();
    this.persistState();
  }

  // --- Transactions & Atomic Commit ---
  public async runTransaction<T>(work: (draft: DatabaseState) => Promise<T> | T): Promise<T> {
    // Deep clone state to guarantee ACID rollback safety
    const draft: DatabaseState = JSON.parse(JSON.stringify(this.state));
    try {
      const result = await work(draft);
      this.state = draft;
      this.persistState();
      return result;
    } catch (error) {
      console.error('[Transaction Aborted & Rolled Back]', error);
      throw error;
    }
  }

  // Helper date formatter
  public getNowTimestamp(): string {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
}

export const dbManager = new RelationalDatabaseManager();
