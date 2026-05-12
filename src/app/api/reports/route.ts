import { NextResponse } from 'next/server';
import { getAllTimeRecords } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId') || undefined;
  const fromDate = searchParams.get('fromDate') || undefined;
  const toDate = searchParams.get('toDate') || undefined;

  const records = getAllTimeRecords(employeeId, fromDate, toDate);
  return NextResponse.json(records);
}