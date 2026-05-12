import { NextResponse } from 'next/server';
import {
  seedEmployees,
  verifyPin as dbVerifyPin,
  recordClockAction,
  addEmployee,
  deleteEmployee,
} from '@/lib/db';
import { EMPLOYEES } from '@/lib/types';

// Hardcoded employee list that works on Vercel without a database
const HARDCODED_EMPLOYEES = EMPLOYEES;

export async function GET() {
  // Return hardcoded employees so admin dashboard works on Vercel
  const employees = HARDCODED_EMPLOYEES.map((e, i) => ({
    id: String(i + 1),
    name: e.name,
    pin: e.pin,
    records: [],
    timeOffRequests: [],
  }));
  return NextResponse.json(employees);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action } = body;

  if (action === 'init' || action === 'seed') {
    // Also try DB seed for local dev
    try { seedEmployees(); } catch {}
    const employees = HARDCODED_EMPLOYEES.map((e, i) => ({
      id: String(i + 1),
      name: e.name,
      pin: e.pin,
      records: [],
      timeOffRequests: [],
    }));
    return NextResponse.json(employees);
  }

  if (action === 'verifyPin') {
    const { name, pin } = body;
    // Check hardcoded list first (works on Vercel)
    const found = HARDCODED_EMPLOYEES.find(
      (e) => e.name.toLowerCase() === name.toLowerCase() && e.pin === pin
    );
    if (found) {
      return NextResponse.json({ valid: true });
    }
    // Fall back to DB for locally-added employees
    const valid = dbVerifyPin(name, pin);
    if (!valid) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }
    return NextResponse.json({ valid: true });
  }

  if (action === 'verifyAdmin') {
    const { pin } = body;
    return NextResponse.json({ valid: pin === '1234' });
  }

  if (action === 'clock') {
    const { employeeName, clockAction, timestamp } = body;
    try {
      recordClockAction(employeeName, clockAction, timestamp);
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: 'Failed to record time' }, { status: 400 });
    }
  }

  if (action === 'addEmployee') {
    const { name, pin } = body;
    try {
      const employee = addEmployee(name, pin);
      return NextResponse.json({ success: true, employee });
    } catch {
      return NextResponse.json({ error: 'Failed to add employee' }, { status: 400 });
    }
  }

  if (action === 'deleteEmployee') {
    const { id } = body;
    try {
      deleteEmployee(id);
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: 'Failed to delete employee' }, { status: 400 });
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}