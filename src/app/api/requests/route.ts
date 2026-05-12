import { NextResponse } from 'next/server';
import {
  getTimeOffRequests,
  createTimeOffRequest,
  updateTimeOffRequestStatus,
} from '@/lib/db';

export async function GET() {
  const requests = getTimeOffRequests();
  return NextResponse.json(requests);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { employeeName, date, reason } = body;

  try {
    createTimeOffRequest(employeeName, date, reason);
    return NextResponse.json({ success: true });
  } catch  {
    return NextResponse.json({ error: 'Failed to create request' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, status } = body;

  updateTimeOffRequestStatus(id, status);
  return NextResponse.json({ success: true });
}