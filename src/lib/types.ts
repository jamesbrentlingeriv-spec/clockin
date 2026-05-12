export interface TimeRecord {
  shiftStart: string | null;
  lunchOut: string | null;
  lunchIn: string | null;
  shiftEnd: string | null;
}

export interface Employee {
  id: string;
  name: string;
  pin: string;
  records: TimeRecord[];
  timeOffRequests: TimeOffRequest[];
}

export interface TimeOffRequest {
  id: string;
  employeeName: string;
  date: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
}

export type ClockAction = 'shiftStart' | 'lunchOut' | 'lunchIn' | 'shiftEnd';

export const EMPLOYEES: { name: string; pin: string }[] = [
  { name: 'April', pin: '1001' },
  { name: 'Carribyan', pin: '1002' },
  { name: 'James', pin: '1003' },
  { name: 'Naerobi', pin: '1005' },
  { name: 'Robby', pin: '1006' },
  { name: 'Tracy', pin: '1007' },
];
