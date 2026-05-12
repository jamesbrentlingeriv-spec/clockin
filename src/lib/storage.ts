'use client';

import { Employee, TimeOffRequest } from './types';

const EMPLOYEES_KEY = 'clockin_employees';
const REQUESTS_KEY = 'clockin_requests';
const ADMIN_KEY = 'clockin_admin_pin';

const DEFAULT_ADMIN_PIN = '1234';

export function getAdminPin(): string {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_PIN;
  return localStorage.getItem(ADMIN_KEY) || DEFAULT_ADMIN_PIN;
}

export function setAdminPin(pin: string): void {
  localStorage.setItem(ADMIN_KEY, pin);
}

export function getEmployees(): Employee[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(EMPLOYEES_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveEmployees(employees: Employee[]): void {
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
}

export function getTimeOffRequests(): TimeOffRequest[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(REQUESTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveTimeOffRequests(requests: TimeOffRequest[]): void {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

export function getTodayString(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export function getCurrentTimestamp(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${mm}/${dd}/${yyyy} ${hh}:${min}:${ss}`;
}

export function isLate(timestamp: string | null): boolean {
  if (!timestamp) return false;
  // Parse the timestamp - format: MM/DD/YYYY HH:MM:SS
  const [datePart, timePart] = timestamp.split(' ');
  const [month, day, year] = datePart.split('/').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  const recordDate = new Date(year, month - 1, day, hours, minutes);
  // Start time is 9:00 AM
  const startTime = new Date(year, month - 1, day, 9, 0);

  // More than 5 minutes late = tardy
  return recordDate.getTime() - startTime.getTime() > 5 * 60 * 1000;
}