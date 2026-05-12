import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data.db');

let db: Database.Database | null = null;

interface DbEmployee {
  id: string;
  name: string;
  pin: string;
}

interface DbTimeRecord {
  id: string;
  employee_id: string;
  shift_start: string | null;
  lunch_out: string | null;
  lunch_in: string | null;
  shift_end: string | null;
  created_at: string;
}

interface DbTimeOffRequest {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  reason: string;
  status: string;
  created_at: string;
}

interface EmployeeRecord {
  id: string;
  shiftStart: string | null;
  lunchOut: string | null;
  lunchIn: string | null;
  shiftEnd: string | null;
}

interface EmployeeResponse {
  id: string;
  name: string;
  pin: string;
  records: EmployeeRecord[];
  timeOffRequests: DbTimeOffRequest[];
}

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initDb(db);
  }
  return db;
}

function initDb(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT UNIQUE NOT NULL,
      pin TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS time_records (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      employee_id TEXT NOT NULL,
      shift_start TEXT,
      lunch_out TEXT,
      lunch_in TEXT,
      shift_end TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS time_off_requests (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      employee_id TEXT NOT NULL,
      employee_name TEXT NOT NULL,
      date TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );
  `);
}

export function seedEmployees() {
  const database = getDb();
  const row = database.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number };
  if (row.count === 0) {
    const insert = database.prepare('INSERT INTO employees (name, pin) VALUES (?, ?)');
    const employees: [string, string][] = [
      ['April', '1001'],
      ['Carribyan', '1002'],
      ['James', '1003'],
      ['Naerobi', '1005'],
      ['Robby', '1006'],
      ['Tracy', '1007'],
    ];
    const tx = database.transaction(() => {
      for (const [name, pin] of employees) {
        insert.run(name, pin);
      }
    });
    tx();
  }
}

export function getEmployees(): EmployeeResponse[] {
  const database = getDb();
  seedEmployees();
  const employees = database.prepare('SELECT * FROM employees ORDER BY name ASC').all() as DbEmployee[];
  return employees.map((emp) => {
    const records = database.prepare(
      'SELECT * FROM time_records WHERE employee_id = ? ORDER BY created_at DESC LIMIT 10'
    ).all(emp.id) as DbTimeRecord[];

    const timeOffRequests = database.prepare(
      'SELECT * FROM time_off_requests WHERE employee_id = ? ORDER BY created_at DESC'
    ).all(emp.id) as DbTimeOffRequest[];

    return {
      id: emp.id,
      name: emp.name,
      pin: emp.pin,
      records: records.map((r) => ({
        id: r.id,
        shiftStart: r.shift_start,
        lunchOut: r.lunch_out,
        lunchIn: r.lunch_in,
        shiftEnd: r.shift_end,
      })),
      timeOffRequests: timeOffRequests.map((r) => ({
        id: r.id,
        employee_id: r.employee_id,
        employee_name: r.employee_name,
        date: r.date,
        reason: r.reason,
        status: r.status,
        created_at: r.created_at,
      })),
    };
  });
}

export function verifyPin(name: string, pin: string): boolean {
  const database = getDb();
  seedEmployees();
  const employee = database.prepare('SELECT pin FROM employees WHERE name = ?').get(name) as DbEmployee | undefined;
  return employee ? employee.pin === pin : false;
}

export function recordClockAction(employeeName: string, clockAction: string, timestamp: string) {
  const database = getDb();

  const employee = database.prepare('SELECT id FROM employees WHERE name = ?').get(employeeName) as DbEmployee | undefined;
  if (!employee) throw new Error('Employee not found');

  const latest = database.prepare(
    'SELECT * FROM time_records WHERE employee_id = ? ORDER BY created_at DESC LIMIT 1'
  ).get(employee.id) as DbTimeRecord | undefined;

  const columnMap: Record<string, string> = {
    shiftStart: 'shift_start',
    lunchOut: 'lunch_out',
    lunchIn: 'lunch_in',
    shiftEnd: 'shift_end',
  };

  const column = columnMap[clockAction];

  if (latest) {
    const existing = database.prepare(`SELECT ${column} FROM time_records WHERE id = ?`).get(latest.id) as Record<string, string | null>;
    if (existing && !existing[column]) {
      database.prepare(`UPDATE time_records SET ${column} = ? WHERE id = ?`).run(timestamp, latest.id);
      return;
    }
  }

  if (clockAction === 'shiftStart') {
    database.prepare('INSERT INTO time_records (employee_id, shift_start) VALUES (?, ?)').run(employee.id, timestamp);
  }
}

export function getTimeOffRequests(): DbTimeOffRequest[] {
  const database = getDb();
  return database.prepare('SELECT * FROM time_off_requests ORDER BY created_at DESC').all() as DbTimeOffRequest[];
}

export function createTimeOffRequest(employeeName: string, date: string, reason: string) {
  const database = getDb();
  const employee = database.prepare('SELECT id FROM employees WHERE name = ?').get(employeeName) as DbEmployee | undefined;
  if (!employee) throw new Error('Employee not found');

  const now = new Date().toLocaleString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).replace(',', '');

  database.prepare(
    'INSERT INTO time_off_requests (employee_id, employee_name, date, reason, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(employee.id, employeeName, date, reason, 'pending', now);
}

export function updateTimeOffRequestStatus(id: string, status: string) {
  const database = getDb();
  database.prepare('UPDATE time_off_requests SET status = ? WHERE id = ?').run(status, id);
}

export function addEmployee(name: string, pin: string) {
  const database = getDb();
  database.prepare('INSERT INTO employees (name, pin) VALUES (?, ?)').run(name, pin);
  return database.prepare('SELECT * FROM employees WHERE name = ?').get(name) as DbEmployee;
}

export function deleteEmployee(id: string) {
  const database = getDb();
  database.prepare('DELETE FROM employees WHERE id = ?').run(id);
}

export function getAllTimeRecords(employeeId?: string, fromDate?: string, toDate?: string): DbTimeRecord[] {
  const database = getDb();
  if (employeeId) {
    let query = 'SELECT tr.*, e.name as employee_name FROM time_records tr JOIN employees e ON tr.employee_id = e.id WHERE tr.employee_id = ?';
    const params: string[] = [employeeId];
    if (fromDate) {
      query += ' AND tr.created_at >= ?';
      params.push(fromDate);
    }
    if (toDate) {
      query += ' AND tr.created_at <= ?';
      params.push(toDate + ' 23:59:59');
    }
    query += ' ORDER BY tr.created_at ASC';
    return database.prepare(query).all(...params) as DbTimeRecord[];
  } else {
    let query = 'SELECT tr.*, e.name as employee_name FROM time_records tr JOIN employees e ON tr.employee_id = e.id WHERE 1=1';
    const params: string[] = [];
    if (fromDate) {
      query += ' AND tr.created_at >= ?';
      params.push(fromDate);
    }
    if (toDate) {
      query += ' AND tr.created_at <= ?';
      params.push(toDate + ' 23:59:59');
    }
    query += ' ORDER BY tr.employee_id, tr.created_at ASC';
    return database.prepare(query).all(...params) as DbTimeRecord[];
  }
}
