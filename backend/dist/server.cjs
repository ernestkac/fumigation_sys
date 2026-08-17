var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express2 = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_cors = __toESM(require("cors"), 1);

// config/env.ts
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var config = {
  port: Number(process.env.PORT),
  nodeEnv: process.env.NODE_ENV,
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  }
};

// routes/apiRoutes.ts
var import_express = require("express");

// db/db.ts
var import_promise = __toESM(require("mysql2/promise"), 1);
var RelationalDatabaseManager = class {
  mysqlPool = null;
  isUsingMysql = false;
  constructor() {
    this.initializeDatabase();
  }
  async initializeDatabase() {
    if (!config.db.host || !config.db.user || !config.db.database) {
      throw new Error("MySQL configuration is required. Set DB_HOST, DB_USER, DB_NAME, and DB_PASSWORD in the backend .env file.");
    }
    try {
      this.mysqlPool = import_promise.default.createPool({
        host: config.db.host,
        port: config.db.port || 3306,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      const conn = await this.mysqlPool.getConnection();
      conn.release();
      this.isUsingMysql = true;
      console.log(`[Database] Connected successfully to MySQL instance at ${config.db.host}:${config.db.port || 3306}/${config.db.database}`);
    } catch (err) {
      this.isUsingMysql = false;
      console.error("[Database] MySQL connection failed. Please verify the database is running and the credentials are correct.", err.message);
      throw err;
    }
  }
  get isMysqlActive() {
    return this.isUsingMysql;
  }
};
var dbManager = new RelationalDatabaseManager();

// controllers/warehouseController.ts
var getWarehouses = async (req, res) => {
  try {
    const state = dbManager.getState();
    const activeOnly = req.query.active === "true";
    let warehouses = [...state.warehouses];
    if (activeOnly) {
      warehouses = warehouses.filter((w) => w.is_active === 1);
    }
    const enriched = warehouses.map((w) => {
      const warehouseStacks = state.stacks.filter((s) => s.warehouse_id === w.id);
      const activeStacks = warehouseStacks.filter((s) => s.status === "Active");
      return {
        ...w,
        total_stacks: warehouseStacks.length,
        active_stacks: activeStacks.length
      };
    });
    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch warehouses", error: error.message });
  }
};
var getWarehouseById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const state = dbManager.getState();
    const warehouse = state.warehouses.find((w) => w.id === id);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }
    const warehouseStacks = state.stacks.filter((s) => s.warehouse_id === warehouse.id);
    res.json({
      success: true,
      data: {
        ...warehouse,
        stacks: warehouseStacks
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error retrieving warehouse" });
  }
};
var createWarehouse = async (req, res) => {
  try {
    const { warehouse_code, warehouse_name, location, is_active = 1 } = req.body;
    if (!warehouse_code || !warehouse_name || !location) {
      return res.status(400).json({
        success: false,
        message: "Warehouse code, warehouse name, and location are required."
      });
    }
    const created = await dbManager.runTransaction((draft) => {
      const existing = draft.warehouses.find(
        (w) => w.warehouse_code.trim().toLowerCase() === warehouse_code.trim().toLowerCase()
      );
      if (existing) {
        throw new Error(`Warehouse code '${warehouse_code}' is already registered.`);
      }
      const now = dbManager.getNowTimestamp();
      const newWarehouse = {
        id: draft.nextIds.warehouses++,
        warehouse_code: warehouse_code.trim().toUpperCase(),
        warehouse_name: warehouse_name.trim(),
        location: location.trim(),
        is_active: is_active ? 1 : 0,
        created_at: now,
        updated_at: now
      };
      draft.warehouses.push(newWarehouse);
      return newWarehouse;
    });
    res.status(201).json({ success: true, message: "Warehouse registered successfully", data: created });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
var updateWarehouse = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { warehouse_code, warehouse_name, location, is_active } = req.body;
    const updated = await dbManager.runTransaction((draft) => {
      const idx = draft.warehouses.findIndex((w) => w.id === id);
      if (idx === -1) {
        throw new Error("Warehouse not found");
      }
      if (warehouse_code) {
        const duplicate = draft.warehouses.find(
          (w) => w.id !== id && w.warehouse_code.trim().toLowerCase() === warehouse_code.trim().toLowerCase()
        );
        if (duplicate) {
          throw new Error(`Warehouse code '${warehouse_code}' is already in use by another warehouse.`);
        }
        draft.warehouses[idx].warehouse_code = warehouse_code.trim().toUpperCase();
      }
      if (warehouse_name) draft.warehouses[idx].warehouse_name = warehouse_name.trim();
      if (location) draft.warehouses[idx].location = location.trim();
      if (is_active !== void 0) draft.warehouses[idx].is_active = is_active ? 1 : 0;
      draft.warehouses[idx].updated_at = dbManager.getNowTimestamp();
      return draft.warehouses[idx];
    });
    res.json({ success: true, message: "Warehouse updated successfully", data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// controllers/officerController.ts
var getOfficers = async (req, res) => {
  try {
    const state = dbManager.getState();
    const activeOnly = req.query.active === "true";
    let officers = [...state.officers];
    if (activeOnly) {
      officers = officers.filter((o) => o.is_active === 1);
    }
    res.json({ success: true, data: officers });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch officers", error: error.message });
  }
};
var createOfficer = async (req, res) => {
  try {
    const { employee_number, name, department, phone, is_active = 1 } = req.body;
    if (!employee_number || !name || !department) {
      return res.status(400).json({
        success: false,
        message: "Employee number, name, and department are required."
      });
    }
    const created = await dbManager.runTransaction((draft) => {
      const existing = draft.officers.find(
        (o) => o.employee_number.trim().toLowerCase() === employee_number.trim().toLowerCase()
      );
      if (existing) {
        throw new Error(`Officer with employee number '${employee_number}' already exists.`);
      }
      const now = dbManager.getNowTimestamp();
      const newOfficer = {
        id: draft.nextIds.officers++,
        employee_number: employee_number.trim().toUpperCase(),
        name: name.trim(),
        department: department.trim(),
        phone: phone ? phone.trim() : null,
        is_active: is_active ? 1 : 0,
        created_at: now,
        updated_at: now
      };
      draft.officers.push(newOfficer);
      return newOfficer;
    });
    res.status(201).json({ success: true, message: "Officer registered successfully", data: created });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
var updateOfficer = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { employee_number, name, department, phone, is_active } = req.body;
    const updated = await dbManager.runTransaction((draft) => {
      const idx = draft.officers.findIndex((o) => o.id === id);
      if (idx === -1) {
        throw new Error("Officer not found");
      }
      if (employee_number) {
        const duplicate = draft.officers.find(
          (o) => o.id !== id && o.employee_number.trim().toLowerCase() === employee_number.trim().toLowerCase()
        );
        if (duplicate) {
          throw new Error(`Employee number '${employee_number}' already belongs to another officer.`);
        }
        draft.officers[idx].employee_number = employee_number.trim().toUpperCase();
      }
      if (name) draft.officers[idx].name = name.trim();
      if (department) draft.officers[idx].department = department.trim();
      if (phone !== void 0) draft.officers[idx].phone = phone ? phone.trim() : null;
      if (is_active !== void 0) draft.officers[idx].is_active = is_active ? 1 : 0;
      draft.officers[idx].updated_at = dbManager.getNowTimestamp();
      return draft.officers[idx];
    });
    res.json({ success: true, message: "Officer updated successfully", data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// controllers/commodityController.ts
var getCommodities = async (req, res) => {
  try {
    const state = dbManager.getState();
    const activeOnly = req.query.active === "true";
    let commodities = [...state.commodities];
    if (activeOnly) {
      commodities = commodities.filter((c) => c.is_active === 1);
    }
    res.json({ success: true, data: commodities });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch commodities", error: error.message });
  }
};
var createCommodity = async (req, res) => {
  try {
    const { commodity_name, default_unit = "Bags (50kg)", is_active = 1 } = req.body;
    if (!commodity_name) {
      return res.status(400).json({
        success: false,
        message: "Commodity name is required."
      });
    }
    const created = await dbManager.runTransaction((draft) => {
      const existing = draft.commodities.find(
        (c) => c.commodity_name.trim().toLowerCase() === commodity_name.trim().toLowerCase()
      );
      if (existing) {
        throw new Error(`Commodity '${commodity_name}' already exists.`);
      }
      const now = dbManager.getNowTimestamp();
      const newCommodity = {
        id: draft.nextIds.commodities++,
        commodity_name: commodity_name.trim(),
        default_unit: default_unit.trim(),
        is_active: is_active ? 1 : 0,
        created_at: now,
        updated_at: now
      };
      draft.commodities.push(newCommodity);
      return newCommodity;
    });
    res.status(201).json({ success: true, message: "Commodity registered successfully", data: created });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
var updateCommodity = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { commodity_name, default_unit, is_active } = req.body;
    const updated = await dbManager.runTransaction((draft) => {
      const idx = draft.commodities.findIndex((c) => c.id === id);
      if (idx === -1) {
        throw new Error("Commodity not found");
      }
      if (commodity_name) {
        const duplicate = draft.commodities.find(
          (c) => c.id !== id && c.commodity_name.trim().toLowerCase() === commodity_name.trim().toLowerCase()
        );
        if (duplicate) {
          throw new Error(`Commodity name '${commodity_name}' already exists.`);
        }
        draft.commodities[idx].commodity_name = commodity_name.trim();
      }
      if (default_unit) draft.commodities[idx].default_unit = default_unit.trim();
      if (is_active !== void 0) draft.commodities[idx].is_active = is_active ? 1 : 0;
      draft.commodities[idx].updated_at = dbManager.getNowTimestamp();
      return draft.commodities[idx];
    });
    res.json({ success: true, message: "Commodity updated successfully", data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// controllers/stackController.ts
var getStacks = async (req, res) => {
  try {
    const state = dbManager.getState();
    const { warehouse_id, commodity_id, status, search, active_only } = req.query;
    let stacks = [...state.stacks];
    if (warehouse_id) {
      const wId = Number(warehouse_id);
      stacks = stacks.filter((s) => s.warehouse_id === wId);
    }
    if (commodity_id) {
      const cId = Number(commodity_id);
      stacks = stacks.filter((s) => s.commodity_id === cId);
    }
    if (status) {
      stacks = stacks.filter((s) => s.status.toLowerCase() === String(status).toLowerCase());
    }
    if (active_only === "true") {
      stacks = stacks.filter((s) => s.status === "Active");
    }
    if (search) {
      const q = String(search).trim().toLowerCase();
      stacks = stacks.filter((s) => {
        const stackNumMatch = s.stack_number.toLowerCase().includes(q);
        const warehouse = state.warehouses.find((w) => w.id === s.warehouse_id);
        const commodity = state.commodities.find((c) => c.id === s.commodity_id);
        const warehouseMatch = warehouse ? warehouse.warehouse_name.toLowerCase().includes(q) || warehouse.warehouse_code.toLowerCase().includes(q) : false;
        const commodityMatch = commodity ? commodity.commodity_name.toLowerCase().includes(q) : false;
        return stackNumMatch || warehouseMatch || commodityMatch;
      });
    }
    const enriched = stacks.map((s) => {
      const warehouse = state.warehouses.find((w) => w.id === s.warehouse_id);
      const commodity = state.commodities.find((c) => c.id === s.commodity_id);
      return {
        ...s,
        warehouse_name: warehouse?.warehouse_name || "Unknown Warehouse",
        warehouse_code: warehouse?.warehouse_code || "N/A",
        commodity_name: commodity?.commodity_name || "Unknown Commodity"
      };
    });
    res.json({ success: true, data: enriched, total: enriched.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch stacks", error: error.message });
  }
};
var getStackById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const state = dbManager.getState();
    const stack = state.stacks.find((s) => s.id === id);
    if (!stack) {
      return res.status(404).json({ success: false, message: "Stack not found" });
    }
    const warehouse = state.warehouses.find((w) => w.id === stack.warehouse_id);
    const commodity = state.commodities.find((c) => c.id === stack.commodity_id);
    const history = state.fumigation_exercise_stacks.filter((fes) => fes.stack_id === stack.id).map((fes) => {
      const exercise = state.fumigation_exercises.find((fe) => fe.id === fes.fumigation_exercise_id);
      return {
        ...fes,
        exercise_number: exercise?.exercise_number,
        planned_date: exercise?.planned_fumigation_date,
        actual_date: exercise?.actual_fumigation_date,
        exercise_status: exercise?.status
      };
    });
    res.json({
      success: true,
      data: {
        ...stack,
        warehouse_name: warehouse?.warehouse_name,
        warehouse_code: warehouse?.warehouse_code,
        commodity_name: commodity?.commodity_name,
        fumigation_history: history
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch stack details" });
  }
};
var createStack = async (req, res) => {
  try {
    const { warehouse_id, stack_number, commodity_id, current_quantity, unit, status = "Active" } = req.body;
    if (!warehouse_id || !stack_number || !commodity_id || current_quantity === void 0) {
      return res.status(400).json({
        success: false,
        message: "Warehouse, stack number, commodity, and quantity are required."
      });
    }
    const parsedWarehouseId = Number(warehouse_id);
    const parsedCommodityId = Number(commodity_id);
    const parsedQty = Number(current_quantity);
    if (isNaN(parsedQty) || parsedQty < 0) {
      return res.status(400).json({ success: false, message: "Quantity must be a valid positive number or zero." });
    }
    const created = await dbManager.runTransaction((draft) => {
      const warehouse = draft.warehouses.find((w) => w.id === parsedWarehouseId);
      if (!warehouse) {
        throw new Error(`Warehouse with ID ${parsedWarehouseId} does not exist.`);
      }
      const commodity = draft.commodities.find((c) => c.id === parsedCommodityId);
      if (!commodity) {
        throw new Error(`Commodity with ID ${parsedCommodityId} does not exist.`);
      }
      const existing = draft.stacks.find(
        (s) => s.warehouse_id === parsedWarehouseId && s.stack_number.trim().toLowerCase() === String(stack_number).trim().toLowerCase()
      );
      if (existing) {
        throw new Error(`Stack number '${stack_number}' already exists in warehouse '${warehouse.warehouse_name}'.`);
      }
      const now = dbManager.getNowTimestamp();
      const newStack = {
        id: draft.nextIds.stacks++,
        warehouse_id: parsedWarehouseId,
        stack_number: String(stack_number).trim().toUpperCase(),
        commodity_id: parsedCommodityId,
        current_quantity: parsedQty,
        unit: unit ? String(unit).trim() : commodity.default_unit,
        status: status || "Active",
        created_at: now,
        updated_at: now
      };
      draft.stacks.push(newStack);
      return {
        ...newStack,
        warehouse_name: warehouse.warehouse_name,
        warehouse_code: warehouse.warehouse_code,
        commodity_name: commodity.commodity_name
      };
    });
    res.status(201).json({ success: true, message: "Stack created successfully", data: created });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
var updateStack = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { stack_number, commodity_id, current_quantity, unit, status } = req.body;
    const updated = await dbManager.runTransaction((draft) => {
      const idx = draft.stacks.findIndex((s) => s.id === id);
      if (idx === -1) {
        throw new Error("Stack not found");
      }
      const currentStack = draft.stacks[idx];
      if (stack_number) {
        const cleanNumber = String(stack_number).trim().toUpperCase();
        const duplicate = draft.stacks.find(
          (s) => s.id !== id && s.warehouse_id === currentStack.warehouse_id && s.stack_number.toLowerCase() === cleanNumber.toLowerCase()
        );
        if (duplicate) {
          throw new Error(`Stack number '${cleanNumber}' already exists in this warehouse.`);
        }
        draft.stacks[idx].stack_number = cleanNumber;
      }
      if (commodity_id) {
        const cId = Number(commodity_id);
        const comm = draft.commodities.find((c) => c.id === cId);
        if (!comm) throw new Error(`Commodity with ID ${cId} not found.`);
        draft.stacks[idx].commodity_id = cId;
      }
      if (current_quantity !== void 0) {
        const q = Number(current_quantity);
        if (isNaN(q) || q < 0) throw new Error("Quantity must be a valid number >= 0.");
        draft.stacks[idx].current_quantity = q;
      }
      if (unit) draft.stacks[idx].unit = String(unit).trim();
      if (status) draft.stacks[idx].status = status;
      draft.stacks[idx].updated_at = dbManager.getNowTimestamp();
      const warehouse = draft.warehouses.find((w) => w.id === draft.stacks[idx].warehouse_id);
      const commodity = draft.commodities.find((c) => c.id === draft.stacks[idx].commodity_id);
      return {
        ...draft.stacks[idx],
        warehouse_name: warehouse?.warehouse_name,
        warehouse_code: warehouse?.warehouse_code,
        commodity_name: commodity?.commodity_name
      };
    });
    res.json({ success: true, message: "Stack updated successfully", data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// controllers/exerciseController.ts
var getExercises = async (req, res) => {
  try {
    const state = dbManager.getState();
    const {
      warehouse_id,
      officer_id,
      status,
      search,
      start_date,
      end_date,
      date_type = "planned"
    } = req.query;
    let exercises = [...state.fumigation_exercises];
    if (warehouse_id) {
      const wId = Number(warehouse_id);
      exercises = exercises.filter((e) => e.warehouse_id === wId);
    }
    if (officer_id) {
      const oId = Number(officer_id);
      exercises = exercises.filter((e) => e.responsible_officer_id === oId);
    }
    if (status) {
      exercises = exercises.filter((e) => e.status.toLowerCase() === String(status).toLowerCase());
    }
    if (start_date) {
      const start = String(start_date);
      exercises = exercises.filter((e) => {
        const d = date_type === "actual" ? e.actual_fumigation_date : e.planned_fumigation_date;
        return d ? d >= start : false;
      });
    }
    if (end_date) {
      const end = String(end_date);
      exercises = exercises.filter((e) => {
        const d = date_type === "actual" ? e.actual_fumigation_date : e.planned_fumigation_date;
        return d ? d <= end : false;
      });
    }
    if (search) {
      const q = String(search).trim().toLowerCase();
      exercises = exercises.filter((e) => {
        const numMatch = e.exercise_number.toLowerCase().includes(q);
        const warehouse = state.warehouses.find((w) => w.id === e.warehouse_id);
        const officer = state.officers.find((o) => o.id === e.responsible_officer_id);
        const remarksMatch = e.remarks ? e.remarks.toLowerCase().includes(q) : false;
        const wMatch = warehouse ? warehouse.warehouse_name.toLowerCase().includes(q) || warehouse.warehouse_code.toLowerCase().includes(q) : false;
        const oMatch = officer ? officer.name.toLowerCase().includes(q) : false;
        return numMatch || remarksMatch || wMatch || oMatch;
      });
    }
    const enriched = exercises.map((e) => {
      const warehouse = state.warehouses.find((w) => w.id === e.warehouse_id);
      const officer = state.officers.find((o) => o.id === e.responsible_officer_id);
      const snapshots = state.fumigation_exercise_stacks.filter((s) => s.fumigation_exercise_id === e.id);
      const challenges = state.fumigation_challenges.filter((c) => c.fumigation_exercise_id === e.id);
      const unitMap = /* @__PURE__ */ new Map();
      let totalQty = 0;
      snapshots.forEach((s) => {
        totalQty += Number(s.quantity_snapshot);
        unitMap.set(s.unit_snapshot, (unitMap.get(s.unit_snapshot) || 0) + Number(s.quantity_snapshot));
      });
      const unit_breakdown = Array.from(unitMap.entries()).map(([unit, total_quantity]) => ({
        unit,
        total_quantity
      }));
      return {
        ...e,
        warehouse_name: warehouse?.warehouse_name || "Unknown Warehouse",
        warehouse_code: warehouse?.warehouse_code || "N/A",
        officer_name: officer?.name || "Unknown Officer",
        officer_department: officer?.department || "N/A",
        stacks_count: snapshots.length,
        total_quantity: totalQty,
        unit_breakdown,
        challenges_count: challenges.length,
        unresolved_challenges: challenges.filter((c) => !c.resolved).length
      };
    });
    enriched.sort((a, b) => new Date(b.planned_fumigation_date).getTime() - new Date(a.planned_fumigation_date).getTime());
    res.json({ success: true, data: enriched, total: enriched.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch fumigation exercises", error: error.message });
  }
};
var getExerciseById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const state = dbManager.getState();
    const exercise = state.fumigation_exercises.find((e) => e.id === id);
    if (!exercise) {
      return res.status(404).json({ success: false, message: "Fumigation exercise not found" });
    }
    const warehouse = state.warehouses.find((w) => w.id === exercise.warehouse_id);
    const officer = state.officers.find((o) => o.id === exercise.responsible_officer_id);
    const snapshots = state.fumigation_exercise_stacks.filter((s) => s.fumigation_exercise_id === exercise.id).map((snap) => {
      const currentStack = state.stacks.find((st) => st.id === snap.stack_id);
      return {
        ...snap,
        current_stack_quantity: currentStack?.current_quantity,
        current_stack_status: currentStack?.status
      };
    });
    const challenges = state.fumigation_challenges.filter((c) => c.fumigation_exercise_id === exercise.id);
    const unitMap = /* @__PURE__ */ new Map();
    let totalQty = 0;
    snapshots.forEach((s) => {
      totalQty += Number(s.quantity_snapshot);
      unitMap.set(s.unit_snapshot, (unitMap.get(s.unit_snapshot) || 0) + Number(s.quantity_snapshot));
    });
    const unit_breakdown = Array.from(unitMap.entries()).map(([unit, total_quantity]) => ({
      unit,
      total_quantity
    }));
    res.json({
      success: true,
      data: {
        ...exercise,
        warehouse_name: warehouse?.warehouse_name,
        warehouse_code: warehouse?.warehouse_code,
        officer_name: officer?.name,
        officer_department: officer?.department,
        stacks: snapshots,
        challenges,
        stacks_count: snapshots.length,
        total_quantity: totalQty,
        unit_breakdown
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch exercise details" });
  }
};
var createExercise = async (req, res) => {
  try {
    const {
      exercise_number,
      warehouse_id,
      planned_fumigation_date,
      planned_duration,
      responsible_officer_id,
      remarks,
      stack_ids
      // array of numbers
    } = req.body;
    if (!warehouse_id) {
      return res.status(400).json({ success: false, message: "Warehouse selection is required." });
    }
    if (!planned_fumigation_date) {
      return res.status(400).json({ success: false, message: "Planned fumigation date is required." });
    }
    if (!responsible_officer_id) {
      return res.status(400).json({ success: false, message: "Responsible officer is required." });
    }
    const duration = Number(planned_duration);
    if (isNaN(duration) || duration <= 0) {
      return res.status(400).json({ success: false, message: "Planned duration must be greater than zero." });
    }
    if (!Array.isArray(stack_ids) || stack_ids.length === 0) {
      return res.status(400).json({ success: false, message: "At least one stack must be selected for fumigation." });
    }
    const uniqueStackIds = Array.from(new Set(stack_ids.map(Number)));
    if (uniqueStackIds.length !== stack_ids.length) {
      return res.status(400).json({ success: false, message: "A stack cannot be selected more than once in the same exercise." });
    }
    const result = await dbManager.runTransaction((draft) => {
      const warehouseId = Number(warehouse_id);
      const officerId = Number(responsible_officer_id);
      const warehouse = draft.warehouses.find((w) => w.id === warehouseId);
      if (!warehouse) {
        throw new Error(`Warehouse with ID ${warehouseId} not found.`);
      }
      const officer = draft.officers.find((o) => o.id === officerId);
      if (!officer) {
        throw new Error(`Officer with ID ${officerId} not found.`);
      }
      let finalExNumber = exercise_number ? String(exercise_number).trim().toUpperCase() : "";
      if (!finalExNumber) {
        const year = new Date(planned_fumigation_date).getFullYear() || 2026;
        const count = draft.fumigation_exercises.length + 1;
        finalExNumber = `FUM-${year}-${String(count).padStart(3, "0")}`;
      }
      const existingEx = draft.fumigation_exercises.find(
        (e) => e.exercise_number.toLowerCase() === finalExNumber.toLowerCase()
      );
      if (existingEx) {
        throw new Error(`Fumigation Exercise Number '${finalExNumber}' already exists.`);
      }
      const stackSnapshotsToCreate = [];
      const now = dbManager.getNowTimestamp();
      const exerciseId = draft.nextIds.fumigation_exercises++;
      for (const sId of uniqueStackIds) {
        const stack = draft.stacks.find((s) => s.id === sId);
        if (!stack) {
          throw new Error(`Stack with ID ${sId} does not exist.`);
        }
        if (stack.warehouse_id !== warehouseId) {
          throw new Error(
            `Stack '${stack.stack_number}' belongs to a different warehouse and cannot be included in this exercise.`
          );
        }
        const commodity = draft.commodities.find((c) => c.id === stack.commodity_id);
        const commodityName = commodity ? commodity.commodity_name : "Unknown Commodity";
        const snapshot = {
          id: draft.nextIds.fumigation_exercise_stacks++,
          fumigation_exercise_id: exerciseId,
          stack_id: stack.id,
          stack_number_snapshot: stack.stack_number,
          commodity_id: stack.commodity_id,
          commodity_name_snapshot: commodityName,
          quantity_snapshot: stack.current_quantity,
          unit_snapshot: stack.unit,
          created_at: now
        };
        stackSnapshotsToCreate.push(snapshot);
      }
      const newExercise = {
        id: exerciseId,
        exercise_number: finalExNumber,
        warehouse_id: warehouseId,
        planned_fumigation_date: String(planned_fumigation_date).split("T")[0],
        actual_fumigation_date: null,
        planned_duration: duration,
        actual_duration: null,
        responsible_officer_id: officerId,
        status: "Planned",
        remarks: remarks ? String(remarks).trim() : null,
        created_at: now,
        updated_at: now
      };
      draft.fumigation_exercises.push(newExercise);
      draft.fumigation_exercise_stacks.push(...stackSnapshotsToCreate);
      return {
        exercise: newExercise,
        snapshots: stackSnapshotsToCreate
      };
    });
    res.status(201).json({
      success: true,
      message: `Fumigation exercise ${result.exercise.exercise_number} created with ${result.snapshots.length} stack snapshots.`,
      data: result
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
var updateExercise = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      planned_fumigation_date,
      actual_fumigation_date,
      planned_duration,
      actual_duration,
      responsible_officer_id,
      status,
      remarks
    } = req.body;
    const updated = await dbManager.runTransaction((draft) => {
      const idx = draft.fumigation_exercises.findIndex((e) => e.id === id);
      if (idx === -1) {
        throw new Error("Fumigation exercise not found");
      }
      const current = draft.fumigation_exercises[idx];
      if (responsible_officer_id) {
        const offId = Number(responsible_officer_id);
        const officer = draft.officers.find((o) => o.id === offId);
        if (!officer) throw new Error(`Officer with ID ${offId} not found.`);
        draft.fumigation_exercises[idx].responsible_officer_id = offId;
      }
      if (planned_fumigation_date) {
        draft.fumigation_exercises[idx].planned_fumigation_date = String(planned_fumigation_date).split("T")[0];
      }
      if (planned_duration !== void 0) {
        const d = Number(planned_duration);
        if (isNaN(d) || d <= 0) throw new Error("Planned duration must be greater than 0.");
        draft.fumigation_exercises[idx].planned_duration = d;
      }
      if (actual_fumigation_date !== void 0) {
        draft.fumigation_exercises[idx].actual_fumigation_date = actual_fumigation_date ? String(actual_fumigation_date).split("T")[0] : null;
      }
      if (actual_duration !== void 0) {
        const ad = actual_duration !== null && actual_duration !== "" ? Number(actual_duration) : null;
        if (ad !== null && (isNaN(ad) || ad < 0)) throw new Error("Actual duration must be a valid number >= 0.");
        draft.fumigation_exercises[idx].actual_duration = ad;
      }
      if (status) {
        const s = status;
        if (s === "Completed" && !draft.fumigation_exercises[idx].actual_fumigation_date && !actual_fumigation_date) {
          draft.fumigation_exercises[idx].actual_fumigation_date = draft.fumigation_exercises[idx].planned_fumigation_date;
        }
        if (s === "Completed" && draft.fumigation_exercises[idx].actual_duration === null && actual_duration === void 0) {
          draft.fumigation_exercises[idx].actual_duration = draft.fumigation_exercises[idx].planned_duration;
        }
        draft.fumigation_exercises[idx].status = s;
      }
      if (remarks !== void 0) {
        draft.fumigation_exercises[idx].remarks = remarks ? String(remarks).trim() : null;
      }
      draft.fumigation_exercises[idx].updated_at = dbManager.getNowTimestamp();
      return draft.fumigation_exercises[idx];
    });
    res.json({ success: true, message: "Fumigation exercise updated successfully", data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// controllers/challengeController.ts
var getChallenges = async (req, res) => {
  try {
    const state = dbManager.getState();
    const { exercise_id, category, resolved } = req.query;
    let challenges = [...state.fumigation_challenges];
    if (exercise_id) {
      const exId = Number(exercise_id);
      challenges = challenges.filter((c) => c.fumigation_exercise_id === exId);
    }
    if (category) {
      challenges = challenges.filter((c) => c.challenge_category.toLowerCase() === String(category).toLowerCase());
    }
    if (resolved !== void 0) {
      const isResolved = resolved === "true" || resolved === "1" ? 1 : 0;
      challenges = challenges.filter((c) => c.resolved === isResolved);
    }
    const enriched = challenges.map((c) => {
      const exercise = state.fumigation_exercises.find((e) => e.id === c.fumigation_exercise_id);
      const warehouse = exercise ? state.warehouses.find((w) => w.id === exercise.warehouse_id) : null;
      return {
        ...c,
        exercise_number: exercise?.exercise_number || "N/A",
        warehouse_name: warehouse?.warehouse_name || "N/A",
        planned_fumigation_date: exercise?.planned_fumigation_date
      };
    });
    res.json({ success: true, data: enriched, total: enriched.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch challenges", error: error.message });
  }
};
var createChallenge = async (req, res) => {
  try {
    const exerciseId = Number(req.params.exerciseId || req.body.fumigation_exercise_id);
    const { challenge_category, description, action_resolution, resolved, resolution_date } = req.body;
    if (!exerciseId) {
      return res.status(400).json({ success: false, message: "Fumigation exercise ID is required." });
    }
    if (!challenge_category || !description) {
      return res.status(400).json({ success: false, message: "Category and description are required." });
    }
    const created = await dbManager.runTransaction((draft) => {
      const exercise = draft.fumigation_exercises.find((e) => e.id === exerciseId);
      if (!exercise) {
        throw new Error(`Fumigation exercise with ID ${exerciseId} does not exist.`);
      }
      const now = dbManager.getNowTimestamp();
      const isRes = resolved ? 1 : 0;
      const resDate = isRes && resolution_date ? String(resolution_date).split("T")[0] : isRes ? now.split(" ")[0] : null;
      const newChallenge = {
        id: draft.nextIds.fumigation_challenges++,
        fumigation_exercise_id: exerciseId,
        challenge_category: String(challenge_category).trim(),
        description: String(description).trim(),
        action_resolution: action_resolution ? String(action_resolution).trim() : null,
        resolved: isRes,
        resolution_date: resDate,
        created_at: now,
        updated_at: now
      };
      draft.fumigation_challenges.push(newChallenge);
      const warehouse = draft.warehouses.find((w) => w.id === exercise.warehouse_id);
      return {
        ...newChallenge,
        exercise_number: exercise.exercise_number,
        warehouse_name: warehouse?.warehouse_name,
        planned_fumigation_date: exercise.planned_fumigation_date
      };
    });
    res.status(201).json({ success: true, message: "Challenge recorded successfully", data: created });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
var updateChallenge = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { challenge_category, description, action_resolution, resolved, resolution_date } = req.body;
    const updated = await dbManager.runTransaction((draft) => {
      const idx = draft.fumigation_challenges.findIndex((c) => c.id === id);
      if (idx === -1) {
        throw new Error("Challenge not found");
      }
      if (challenge_category) draft.fumigation_challenges[idx].challenge_category = String(challenge_category).trim();
      if (description) draft.fumigation_challenges[idx].description = String(description).trim();
      if (action_resolution !== void 0) {
        draft.fumigation_challenges[idx].action_resolution = action_resolution ? String(action_resolution).trim() : null;
      }
      if (resolved !== void 0) {
        const isRes = resolved ? 1 : 0;
        draft.fumigation_challenges[idx].resolved = isRes;
        if (isRes) {
          draft.fumigation_challenges[idx].resolution_date = resolution_date ? String(resolution_date).split("T")[0] : draft.fumigation_challenges[idx].resolution_date || dbManager.getNowTimestamp().split(" ")[0];
        } else {
          draft.fumigation_challenges[idx].resolution_date = null;
        }
      }
      draft.fumigation_challenges[idx].updated_at = dbManager.getNowTimestamp();
      return draft.fumigation_challenges[idx];
    });
    res.json({ success: true, message: "Challenge updated successfully", data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// services/excelReportService.ts
var import_exceljs = __toESM(require("exceljs"), 1);
async function generateFumigationExcelWorkbook(reportData) {
  const workbook = new import_exceljs.default.Workbook();
  workbook.creator = "Fumigation Exercise Tracking System";
  workbook.created = /* @__PURE__ */ new Date();
  const headerFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A8A" }
    // Deep Navy
  };
  const subHeaderFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF3B82F6" }
    // Blue
  };
  const accentFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" }
    // Light Gray
  };
  const headerFont = {
    name: "Calibri",
    bold: true,
    color: { argb: "FFFFFFFF" },
    size: 11
  };
  const regularFont = {
    name: "Calibri",
    size: 10
  };
  const boldFont = {
    name: "Calibri",
    bold: true,
    size: 10
  };
  const thinBorder = {
    top: { style: "thin", color: { argb: "FFD1D5DB" } },
    left: { style: "thin", color: { argb: "FFD1D5DB" } },
    bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
    right: { style: "thin", color: { argb: "FFD1D5DB" } }
  };
  const summarySheet = workbook.addWorksheet("Summary", {
    views: [{ showGridLines: true }]
  });
  summarySheet.mergeCells("A1:G1");
  const sumTitle = summarySheet.getCell("A1");
  sumTitle.value = "FUMIGATION EXERCISE EXECUTIVE SUMMARY REPORT";
  sumTitle.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FF1E3A8A" } };
  sumTitle.alignment = { vertical: "middle" };
  summarySheet.getRow(1).height = 30;
  summarySheet.getCell("A3").value = "Reporting Period:";
  summarySheet.getCell("B3").value = reportData.reportingPeriodText;
  summarySheet.getCell("A3").font = boldFont;
  summarySheet.getCell("A4").value = "Generated On:";
  summarySheet.getCell("B4").value = (/* @__PURE__ */ new Date()).toLocaleString();
  summarySheet.getCell("A4").font = boldFont;
  summarySheet.getCell("D3").value = "Total Exercises:";
  summarySheet.getCell("E3").value = reportData.summary.totalExercises;
  summarySheet.getCell("D3").font = boldFont;
  summarySheet.getCell("D4").value = "Total Stacks Fumigated:";
  summarySheet.getCell("E4").value = reportData.summary.totalStacksFumigated;
  summarySheet.getCell("D4").font = boldFont;
  summarySheet.getCell("A6").value = "EXERCISE STATUS BREAKDOWN";
  summarySheet.getCell("A6").font = { ...boldFont, size: 12, color: { argb: "FF1E3A8A" } };
  summarySheet.getRow(7).values = ["Status", "Count", "Percentage of Total"];
  ["A7", "B7", "C7"].forEach((c) => {
    const cell = summarySheet.getCell(c);
    cell.fill = subHeaderFill;
    cell.font = headerFont;
    cell.alignment = { horizontal: "center" };
  });
  let sumRowIdx = 8;
  const statuses = ["Completed", "Planned", "In Progress", "Postponed", "Cancelled"];
  statuses.forEach((st) => {
    const count = reportData.summary.statusCounts[st] || 0;
    const pct = reportData.summary.totalExercises > 0 ? count / reportData.summary.totalExercises : 0;
    const row = summarySheet.getRow(sumRowIdx);
    row.values = [st, count, pct];
    row.getCell(2).numFmt = "#,##0";
    row.getCell(3).numFmt = "0.0%";
    ["A", "B", "C"].forEach((col) => {
      row.getCell(col).border = thinBorder;
      row.getCell(col).font = regularFont;
    });
    sumRowIdx++;
  });
  sumRowIdx += 2;
  summarySheet.getCell(`A${sumRowIdx}`).value = "FUMIGATION BY WAREHOUSE SUMMARY";
  summarySheet.getCell(`A${sumRowIdx}`).font = { ...boldFont, size: 12, color: { argb: "FF1E3A8A" } };
  sumRowIdx++;
  summarySheet.getRow(sumRowIdx).values = ["Warehouse", "Total Exercises", "Stacks Covered", "Total Quantity by Unit"];
  ["A", "B", "C", "D"].forEach((col) => {
    const cell = summarySheet.getCell(`${col}${sumRowIdx}`);
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { horizontal: "center" };
  });
  sumRowIdx++;
  reportData.summary.warehouseSummaries.forEach((ws) => {
    const qtyStr = ws.quantitiesByUnit.map((q) => `${q.total.toLocaleString()} ${q.unit}`).join(", ") || "0";
    const row = summarySheet.getRow(sumRowIdx);
    row.values = [ws.warehouse_name, ws.exercises_count, ws.stacks_count, qtyStr];
    row.getCell(2).numFmt = "#,##0";
    row.getCell(3).numFmt = "#,##0";
    ["A", "B", "C", "D"].forEach((col) => {
      row.getCell(col).border = thinBorder;
      row.getCell(col).font = regularFont;
    });
    sumRowIdx++;
  });
  sumRowIdx += 2;
  summarySheet.getCell(`A${sumRowIdx}`).value = "COMMODITY COVERAGE SUMMARY";
  summarySheet.getCell(`A${sumRowIdx}`).font = { ...boldFont, size: 12, color: { argb: "FF1E3A8A" } };
  sumRowIdx++;
  summarySheet.getRow(sumRowIdx).values = ["Commodity", "Stacks Count", "Total Quantity", "Unit"];
  ["A", "B", "C", "D"].forEach((col) => {
    const cell = summarySheet.getCell(`${col}${sumRowIdx}`);
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { horizontal: "center" };
  });
  sumRowIdx++;
  reportData.summary.commoditySummaries.forEach((cs) => {
    const row = summarySheet.getRow(sumRowIdx);
    row.values = [cs.commodity_name, cs.stacks_count, cs.total_quantity, cs.unit];
    row.getCell(2).numFmt = "#,##0";
    row.getCell(3).numFmt = "#,##0.00";
    ["A", "B", "C", "D"].forEach((col) => {
      row.getCell(col).border = thinBorder;
      row.getCell(col).font = regularFont;
    });
    sumRowIdx++;
  });
  summarySheet.columns = [
    { width: 28 },
    { width: 20 },
    { width: 20 },
    { width: 35 },
    { width: 16 },
    { width: 16 },
    { width: 16 }
  ];
  const mainSheet = workbook.addWorksheet("Fumigation Exercises", {
    views: [{ state: "frozen", ySplit: 5, showGridLines: true }]
  });
  mainSheet.mergeCells("A1:J1");
  const titleCell = mainSheet.getCell("A1");
  titleCell.value = "FUMIGATION EXERCISE & STACK SNAPSHOT REPORT";
  titleCell.font = { name: "Calibri", size: 15, bold: true, color: { argb: "FF1E3A8A" } };
  titleCell.alignment = { vertical: "middle" };
  mainSheet.getRow(1).height = 28;
  mainSheet.getCell("A2").value = `Reporting Period: ${reportData.reportingPeriodText} | Filter: ${reportData.filters.status ? `Status: ${reportData.filters.status}` : "All Statuses"}`;
  mainSheet.getCell("A2").font = { italic: true, size: 10, color: { argb: "FF4B5563" } };
  mainSheet.getCell("A3").value = `Generated: ${(/* @__PURE__ */ new Date()).toLocaleString()} | Exercises Included: ${reportData.exercises.length}`;
  mainSheet.getCell("A3").font = { italic: true, size: 10, color: { argb: "FF4B5563" } };
  const mainHeaderRow = mainSheet.getRow(5);
  mainHeaderRow.values = [
    "Warehouse",
    "Exercise No.",
    "Planned Date",
    "Actual Date",
    "Duration",
    "Responsible Officer",
    "Stack No.",
    "Commodity (Snapshot)",
    "Quantity (Snapshot)",
    "Unit",
    "Status"
  ];
  mainHeaderRow.height = 25;
  for (let i = 1; i <= 11; i++) {
    const cell = mainHeaderRow.getCell(i);
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { vertical: "middle", horizontal: i >= 9 ? "right" : "left" };
    cell.border = thinBorder;
  }
  let currentMainRow = 6;
  reportData.exercises.forEach((exercise) => {
    const stacks = exercise.stacks || [];
    const numRows = Math.max(stacks.length, 1);
    const startRow = currentMainRow;
    const endRow = currentMainRow + numRows - 1;
    const plannedDateStr = exercise.planned_fumigation_date ? new Date(exercise.planned_fumigation_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A";
    const actualDateStr = exercise.actual_fumigation_date ? new Date(exercise.actual_fumigation_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";
    const durationStr = `${exercise.planned_duration} days${exercise.actual_duration ? ` (act. ${exercise.actual_duration}d)` : ""}`;
    for (let sIdx = 0; sIdx < numRows; sIdx++) {
      const snap = stacks[sIdx];
      const row = mainSheet.getRow(currentMainRow);
      row.getCell(1).value = exercise.warehouse_name;
      row.getCell(2).value = exercise.exercise_number;
      row.getCell(3).value = plannedDateStr;
      row.getCell(4).value = actualDateStr;
      row.getCell(5).value = durationStr;
      row.getCell(6).value = exercise.officer_name;
      if (snap) {
        row.getCell(7).value = snap.stack_number_snapshot;
        row.getCell(8).value = snap.commodity_name_snapshot;
        row.getCell(9).value = Number(snap.quantity_snapshot);
        row.getCell(9).numFmt = "#,##0.00";
        row.getCell(10).value = snap.unit_snapshot;
      } else {
        row.getCell(7).value = "-";
        row.getCell(8).value = "-";
        row.getCell(9).value = 0;
        row.getCell(10).value = "-";
      }
      row.getCell(11).value = exercise.status;
      for (let c = 1; c <= 11; c++) {
        const cell = row.getCell(c);
        cell.font = regularFont;
        cell.border = thinBorder;
        cell.alignment = {
          vertical: "middle",
          horizontal: c === 9 ? "right" : c === 7 || c === 10 || c === 11 ? "center" : "left"
        };
      }
      currentMainRow++;
    }
    if (numRows > 1) {
      mainSheet.mergeCells(`A${startRow}:A${endRow}`);
      mainSheet.mergeCells(`B${startRow}:B${endRow}`);
      mainSheet.mergeCells(`C${startRow}:C${endRow}`);
      mainSheet.mergeCells(`D${startRow}:D${endRow}`);
      mainSheet.mergeCells(`E${startRow}:E${endRow}`);
      mainSheet.mergeCells(`F${startRow}:F${endRow}`);
      mainSheet.mergeCells(`K${startRow}:K${endRow}`);
    }
  });
  mainSheet.columns = [
    { width: 26 },
    // Warehouse
    { width: 16 },
    // Exercise No
    { width: 14 },
    // Planned Date
    { width: 14 },
    // Actual Date
    { width: 16 },
    // Duration
    { width: 22 },
    // Officer
    { width: 14 },
    // Stack No
    { width: 20 },
    // Commodity
    { width: 18 },
    // Quantity
    { width: 15 },
    // Unit
    { width: 15 }
    // Status
  ];
  const challengesSheet = workbook.addWorksheet("Challenges", {
    views: [{ state: "frozen", ySplit: 4, showGridLines: true }]
  });
  challengesSheet.mergeCells("A1:H1");
  const chTitle = challengesSheet.getCell("A1");
  chTitle.value = "FUMIGATION EXERCISE CHALLENGES & RESOLUTIONS LOG";
  chTitle.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FF1E3A8A" } };
  chTitle.alignment = { vertical: "middle" };
  challengesSheet.getRow(1).height = 26;
  challengesSheet.getCell("A2").value = `Reporting Period: ${reportData.reportingPeriodText}`;
  challengesSheet.getCell("A2").font = { italic: true, size: 10 };
  const chHeaderRow = challengesSheet.getRow(4);
  chHeaderRow.values = [
    "Exercise No.",
    "Warehouse",
    "Planned Date",
    "Challenge Category",
    "Description",
    "Action / Resolution",
    "Resolved",
    "Resolution Date"
  ];
  chHeaderRow.height = 24;
  for (let i = 1; i <= 8; i++) {
    const cell = chHeaderRow.getCell(i);
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { vertical: "middle", horizontal: i === 7 || i === 8 ? "center" : "left" };
    cell.border = thinBorder;
  }
  const state = dbManager.getState();
  const selectedExIds = new Set(reportData.exercises.map((e) => e.id));
  const relevantChallenges = state.fumigation_challenges.filter((c) => selectedExIds.has(c.fumigation_exercise_id));
  let chRowIdx = 5;
  relevantChallenges.forEach((c) => {
    const ex = reportData.exercises.find((e) => e.id === c.fumigation_exercise_id);
    const row = challengesSheet.getRow(chRowIdx);
    row.values = [
      ex?.exercise_number || "N/A",
      ex?.warehouse_name || "N/A",
      ex?.planned_fumigation_date || "N/A",
      c.challenge_category,
      c.description,
      c.action_resolution || "Pending Resolution",
      c.resolved ? "Yes" : "No",
      c.resolution_date || "-"
    ];
    for (let col = 1; col <= 8; col++) {
      const cell = row.getCell(col);
      cell.font = regularFont;
      cell.border = thinBorder;
      cell.alignment = {
        vertical: "middle",
        horizontal: col === 7 || col === 8 ? "center" : "left",
        wrapText: col === 5 || col === 6
      };
    }
    chRowIdx++;
  });
  if (relevantChallenges.length === 0) {
    const row = challengesSheet.getRow(chRowIdx);
    row.getCell(1).value = "No challenges recorded for exercises in this period.";
    challengesSheet.mergeCells(`A${chRowIdx}:H${chRowIdx}`);
    row.getCell(1).font = { italic: true };
    row.getCell(1).alignment = { horizontal: "center" };
  }
  challengesSheet.columns = [
    { width: 16 },
    { width: 24 },
    { width: 14 },
    { width: 22 },
    { width: 40 },
    { width: 40 },
    { width: 12 },
    { width: 16 }
  ];
  const dataSheet = workbook.addWorksheet("Stack Snapshots Data", {
    views: [{ state: "frozen", ySplit: 1, showGridLines: true }]
  });
  dataSheet.getRow(1).values = [
    "Exercise No",
    "Warehouse Code",
    "Warehouse Name",
    "Planned Date",
    "Actual Date",
    "Officer",
    "Stack Number (Snapshot)",
    "Commodity Name (Snapshot)",
    "Quantity (Snapshot)",
    "Unit (Snapshot)",
    "Exercise Status"
  ];
  for (let i = 1; i <= 11; i++) {
    const cell = dataSheet.getRow(1).getCell(i);
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.border = thinBorder;
  }
  let dataRowIdx = 2;
  reportData.exercises.forEach((ex) => {
    (ex.stacks || []).forEach((snap) => {
      const row = dataSheet.getRow(dataRowIdx);
      row.values = [
        ex.exercise_number,
        ex.warehouse_code,
        ex.warehouse_name,
        ex.planned_fumigation_date,
        ex.actual_fumigation_date || "",
        ex.officer_name,
        snap.stack_number_snapshot,
        snap.commodity_name_snapshot,
        Number(snap.quantity_snapshot),
        snap.unit_snapshot,
        ex.status
      ];
      row.getCell(9).numFmt = "#,##0.00";
      for (let c = 1; c <= 11; c++) {
        row.getCell(c).font = regularFont;
        row.getCell(c).border = thinBorder;
      }
      dataRowIdx++;
    });
  });
  dataSheet.columns = [
    { width: 16 },
    { width: 16 },
    { width: 26 },
    { width: 14 },
    { width: 14 },
    { width: 22 },
    { width: 16 },
    { width: 20 },
    { width: 18 },
    { width: 15 },
    { width: 15 }
  ];
  return workbook;
}

// controllers/reportController.ts
function buildFilteredReportData(params) {
  const state = dbManager.getState();
  const {
    startDate,
    endDate,
    dateType = "planned",
    warehouseId,
    officerId,
    commodityId,
    status,
    stackNumber,
    search
  } = params;
  let exercises = [...state.fumigation_exercises];
  if (warehouseId) {
    const wId = Number(warehouseId);
    exercises = exercises.filter((e) => e.warehouse_id === wId);
  }
  if (officerId) {
    const oId = Number(officerId);
    exercises = exercises.filter((e) => e.responsible_officer_id === oId);
  }
  if (status) {
    exercises = exercises.filter((e) => e.status.toLowerCase() === String(status).toLowerCase());
  }
  if (startDate) {
    exercises = exercises.filter((e) => {
      const d = dateType === "actual" ? e.actual_fumigation_date : e.planned_fumigation_date;
      return d ? d >= startDate : false;
    });
  }
  if (endDate) {
    exercises = exercises.filter((e) => {
      const d = dateType === "actual" ? e.actual_fumigation_date : e.planned_fumigation_date;
      return d ? d <= endDate : false;
    });
  }
  if (commodityId) {
    const cId = Number(commodityId);
    const exIdsWithCommodity = new Set(
      state.fumigation_exercise_stacks.filter((s) => s.commodity_id === cId).map((s) => s.fumigation_exercise_id)
    );
    exercises = exercises.filter((e) => exIdsWithCommodity.has(e.id));
  }
  if (stackNumber) {
    const sNum = String(stackNumber).trim().toLowerCase();
    const exIdsWithStack = new Set(
      state.fumigation_exercise_stacks.filter((s) => s.stack_number_snapshot.toLowerCase().includes(sNum)).map((s) => s.fumigation_exercise_id)
    );
    exercises = exercises.filter((e) => exIdsWithStack.has(e.id));
  }
  if (search) {
    const q = String(search).trim().toLowerCase();
    exercises = exercises.filter((e) => {
      const numMatch = e.exercise_number.toLowerCase().includes(q);
      const warehouse = state.warehouses.find((w) => w.id === e.warehouse_id);
      const officer = state.officers.find((o) => o.id === e.responsible_officer_id);
      const wMatch = warehouse ? warehouse.warehouse_name.toLowerCase().includes(q) || warehouse.warehouse_code.toLowerCase().includes(q) : false;
      const oMatch = officer ? officer.name.toLowerCase().includes(q) : false;
      return numMatch || wMatch || oMatch;
    });
  }
  const enrichedExercises = exercises.map((e) => {
    const warehouse = state.warehouses.find((w) => w.id === e.warehouse_id);
    const officer = state.officers.find((o) => o.id === e.responsible_officer_id);
    let snapshots = state.fumigation_exercise_stacks.filter((s) => s.fumigation_exercise_id === e.id);
    if (commodityId) {
      snapshots = snapshots.filter((s) => s.commodity_id === Number(commodityId));
    }
    if (stackNumber) {
      snapshots = snapshots.filter((s) => s.stack_number_snapshot.toLowerCase().includes(String(stackNumber).toLowerCase()));
    }
    const challenges = state.fumigation_challenges.filter((c) => c.fumigation_exercise_id === e.id);
    const unitMap = /* @__PURE__ */ new Map();
    let totalQty = 0;
    snapshots.forEach((s) => {
      totalQty += Number(s.quantity_snapshot);
      unitMap.set(s.unit_snapshot, (unitMap.get(s.unit_snapshot) || 0) + Number(s.quantity_snapshot));
    });
    return {
      ...e,
      warehouse_name: warehouse?.warehouse_name || "Unknown Warehouse",
      warehouse_code: warehouse?.warehouse_code || "N/A",
      officer_name: officer?.name || "Unknown Officer",
      officer_department: officer?.department || "N/A",
      stacks: snapshots,
      stacks_count: snapshots.length,
      total_quantity: totalQty,
      unit_breakdown: Array.from(unitMap.entries()).map(([unit, total_quantity]) => ({ unit, total_quantity })),
      challenges
    };
  });
  const statusCounts = {
    Completed: 0,
    Planned: 0,
    "In Progress": 0,
    Postponed: 0,
    Cancelled: 0
  };
  let totalStacksFumigated = 0;
  const globalUnitTotals = /* @__PURE__ */ new Map();
  const whSummaryMap = /* @__PURE__ */ new Map();
  const commoditySummaryMap = /* @__PURE__ */ new Map();
  enrichedExercises.forEach((ex) => {
    statusCounts[ex.status] = (statusCounts[ex.status] || 0) + 1;
    if (!whSummaryMap.has(ex.warehouse_id)) {
      whSummaryMap.set(ex.warehouse_id, {
        warehouse_name: ex.warehouse_name || "Warehouse",
        exercises_count: 0,
        stacks_count: 0,
        quantities: /* @__PURE__ */ new Map()
      });
    }
    const whEntry = whSummaryMap.get(ex.warehouse_id);
    whEntry.exercises_count += 1;
    (ex.stacks || []).forEach((snap) => {
      totalStacksFumigated += 1;
      whEntry.stacks_count += 1;
      const qty = Number(snap.quantity_snapshot);
      const unit = snap.unit_snapshot;
      whEntry.quantities.set(unit, (whEntry.quantities.get(unit) || 0) + qty);
      globalUnitTotals.set(unit, (globalUnitTotals.get(unit) || 0) + qty);
      const commKey = `${snap.commodity_name_snapshot}_${unit}`;
      if (!commoditySummaryMap.has(commKey)) {
        commoditySummaryMap.set(commKey, {
          commodity_name: snap.commodity_name_snapshot,
          unit,
          total_quantity: 0,
          stacks_count: 0
        });
      }
      const commEntry = commoditySummaryMap.get(commKey);
      commEntry.total_quantity += qty;
      commEntry.stacks_count += 1;
    });
  });
  const warehouseSummaries = Array.from(whSummaryMap.values()).map((wh) => ({
    warehouse_name: wh.warehouse_name,
    exercises_count: wh.exercises_count,
    stacks_count: wh.stacks_count,
    quantitiesByUnit: Array.from(wh.quantities.entries()).map(([unit, total]) => ({ unit, total }))
  }));
  const commoditySummaries = Array.from(commoditySummaryMap.values());
  const totalQuantitiesByUnit = Array.from(globalUnitTotals.entries()).map(([unit, total]) => ({ unit, total }));
  const reportingPeriodText = startDate && endDate ? `${startDate} to ${endDate} (${dateType === "actual" ? "Actual Date" : "Planned Date"})` : startDate ? `From ${startDate}` : endDate ? `Up to ${endDate}` : "All Historical Dates";
  return {
    exercises: enrichedExercises,
    filters: params,
    reportingPeriodText,
    summary: {
      totalExercises: enrichedExercises.length,
      totalStacksFumigated,
      statusCounts,
      warehouseSummaries,
      commoditySummaries,
      totalQuantitiesByUnit
    }
  };
}
var getFumigationReport = async (req, res) => {
  try {
    const params = {
      startDate: req.query.startDate ? String(req.query.startDate) : void 0,
      endDate: req.query.endDate ? String(req.query.endDate) : void 0,
      dateType: req.query.dateType || "planned",
      warehouseId: req.query.warehouseId ? Number(req.query.warehouseId) : void 0,
      officerId: req.query.officerId ? Number(req.query.officerId) : void 0,
      commodityId: req.query.commodityId ? Number(req.query.commodityId) : void 0,
      status: req.query.status ? String(req.query.status) : void 0,
      stackNumber: req.query.stackNumber ? String(req.query.stackNumber) : void 0,
      search: req.query.search ? String(req.query.search) : void 0
    };
    const report = buildFilteredReportData(params);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to generate report", error: error.message });
  }
};
var exportFumigationReportExcel = async (req, res) => {
  try {
    const params = {
      startDate: req.query.startDate ? String(req.query.startDate) : void 0,
      endDate: req.query.endDate ? String(req.query.endDate) : void 0,
      dateType: req.query.dateType || "planned",
      warehouseId: req.query.warehouseId ? Number(req.query.warehouseId) : void 0,
      officerId: req.query.officerId ? Number(req.query.officerId) : void 0,
      commodityId: req.query.commodityId ? Number(req.query.commodityId) : void 0,
      status: req.query.status ? String(req.query.status) : void 0,
      stackNumber: req.query.stackNumber ? String(req.query.stackNumber) : void 0,
      search: req.query.search ? String(req.query.search) : void 0
    };
    const reportData = buildFilteredReportData(params);
    const workbook = await generateFumigationExcelWorkbook(reportData);
    const fromDateStr = params.startDate || "all";
    const toDateStr = params.endDate || "all";
    const filename = `Fumigation_Report_${fromDateStr}_to_${toDateStr}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Excel Generation Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate Excel report file", error: error.message });
  }
};
var getDashboardStats = async (_req, res) => {
  try {
    const state = dbManager.getState();
    const totalWarehouses = state.warehouses.filter((w) => w.is_active === 1).length;
    const totalActiveStacks = state.stacks.filter((s) => s.status === "Active").length;
    const plannedExercises = state.fumigation_exercises.filter((e) => e.status === "Planned").length;
    const completedExercises = state.fumigation_exercises.filter((e) => e.status === "Completed").length;
    const inProgressExercises = state.fumigation_exercises.filter((e) => e.status === "In Progress").length;
    const postponedExercises = state.fumigation_exercises.filter((e) => e.status === "Postponed").length;
    const totalStacksFumigated = state.fumigation_exercise_stacks.length;
    const quantitiesByUnit = /* @__PURE__ */ new Map();
    state.fumigation_exercise_stacks.forEach((snap) => {
      quantitiesByUnit.set(
        snap.unit_snapshot,
        (quantitiesByUnit.get(snap.unit_snapshot) || 0) + Number(snap.quantity_snapshot)
      );
    });
    const upcoming = state.fumigation_exercises.filter((e) => e.status === "Planned" || e.status === "In Progress").map((e) => {
      const warehouse = state.warehouses.find((w) => w.id === e.warehouse_id);
      const officer = state.officers.find((o) => o.id === e.responsible_officer_id);
      const stackCount = state.fumigation_exercise_stacks.filter((s) => s.fumigation_exercise_id === e.id).length;
      return {
        id: e.id,
        exercise_number: e.exercise_number,
        warehouse_name: warehouse?.warehouse_name || "N/A",
        planned_date: e.planned_fumigation_date,
        duration: e.planned_duration,
        officer_name: officer?.name || "N/A",
        stacks_count: stackCount,
        status: e.status
      };
    }).sort((a, b) => new Date(a.planned_date).getTime() - new Date(b.planned_date).getTime()).slice(0, 5);
    const recentChallenges = state.fumigation_challenges.map((c) => {
      const ex = state.fumigation_exercises.find((e) => e.id === c.fumigation_exercise_id);
      const wh = ex ? state.warehouses.find((w) => w.id === ex.warehouse_id) : null;
      return {
        id: c.id,
        exercise_number: ex?.exercise_number || "N/A",
        warehouse_name: wh?.warehouse_name || "N/A",
        category: c.challenge_category,
        description: c.description,
        resolved: c.resolved,
        created_at: c.created_at
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
    res.json({
      success: true,
      data: {
        totalWarehouses,
        totalActiveStacks,
        plannedExercises,
        completedExercises,
        inProgressExercises,
        postponedExercises,
        totalStacksFumigated,
        totalQuantityCovered: Array.from(quantitiesByUnit.entries()).map(([unit, total]) => ({ unit, total })),
        upcomingExercises: upcoming,
        recentChallenges
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch dashboard stats" });
  }
};
var resetDatabaseSeed = async (_req, res) => {
  try {
    dbManager.resetToDefaultSeeds();
    res.json({ success: true, message: "Database reset to default seed data successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to reset database" });
  }
};

// routes/apiRoutes.ts
var router = (0, import_express.Router)();
router.get("/warehouses", getWarehouses);
router.get("/warehouses/:id", getWarehouseById);
router.post("/warehouses", createWarehouse);
router.put("/warehouses/:id", updateWarehouse);
router.get("/officers", getOfficers);
router.post("/officers", createOfficer);
router.put("/officers/:id", updateOfficer);
router.get("/commodities", getCommodities);
router.post("/commodities", createCommodity);
router.put("/commodities/:id", updateCommodity);
router.get("/stacks", getStacks);
router.get("/stacks/:id", getStackById);
router.post("/stacks", createStack);
router.put("/stacks/:id", updateStack);
router.get("/fumigation-exercises", getExercises);
router.get("/fumigation-exercises/:id", getExerciseById);
router.post("/fumigation-exercises", createExercise);
router.put("/fumigation-exercises/:id", updateExercise);
router.get("/challenges", getChallenges);
router.post("/challenges", createChallenge);
router.post("/fumigation-exercises/:exerciseId/challenges", createChallenge);
router.put("/challenges/:id", updateChallenge);
router.get("/reports/fumigation", getFumigationReport);
router.get("/reports/fumigation/excel", exportFumigationReportExcel);
router.get("/dashboard/stats", getDashboardStats);
router.post("/system/reset-seed", resetDatabaseSeed);
var apiRoutes_default = router;

// server.ts
async function startServer() {
  const app = (0, import_express2.default)();
  const PORT = config.port || 3e3;
  app.use((0, import_cors.default)());
  app.use(import_express2.default.json({ limit: "10mb" }));
  app.use(import_express2.default.urlencoded({ extended: true, limit: "10mb" }));
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "Fumigation Exercise Tracking System API",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.use("/api", apiRoutes_default);
  const frontendDistPath = import_path.default.resolve(process.cwd(), "../frontend/dist");
  if (import_fs.default.existsSync(frontendDistPath)) {
    app.use(import_express2.default.static(frontendDistPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(frontendDistPath, "index.html"));
    });
  } else {
    app.get("/", (_req, res) => {
      res.json({
        name: "Fumigation Exercise Tracking System API",
        mode: process.env.NODE_ENV || "development",
        message: "Frontend is running separately from the frontend package."
      });
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`====================================================`);
    console.log(` Fumigation Exercise Tracking System Server Started `);
    console.log(` Port: ${PORT} | Mode: ${process.env.NODE_ENV || "development"}`);
    console.log(` API Endpoint: http://localhost:${PORT}/api`);
    console.log(`====================================================`);
  });
}
startServer().catch((err) => {
  console.error("Fatal Server Startup Error:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
