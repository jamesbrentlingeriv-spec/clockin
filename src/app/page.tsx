'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SplashScreen from '@/components/SplashScreen';
import EmployeeSelector from '@/components/EmployeeSelector';
import PinEntry from '@/components/PinEntry';
import ClockActions from '@/components/ClockActions';
import TimeOffRequest from '@/components/TimeOffRequest';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';
import { EMPLOYEES } from '@/lib/types';
import type { Employee, TimeOffRequest as TimeOffRequestType, ClockAction as ClockActionType } from '@/lib/types';
import { getCurrentTimestamp } from '@/lib/storage';
import { Shield } from 'lucide-react';

type Screen =
  | 'splash'
  | 'home'
  | 'pin'
  | 'clock'
  | 'requestOff'
  | 'adminLogin'
  | 'adminDashboard';

export default function Home() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<TimeOffRequestType[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data from API
  useEffect(() => {
    async function load() {
      try {
        // Seed employees if first time via API
        const res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'seed' }),
        });
        const data = await res.json();
        setEmployees(data);
      } catch (err) {
        console.error('Failed to load employees', err);
      }

      try {
        const reqRes = await fetch('/api/requests');
        const reqData = await reqRes.json();
        setRequests(reqData);
      } catch (err) {
        console.error('Failed to load requests', err);
      }

      setLoading(false);
    }
    load();
  }, []);

  const handleEmployeeSelect = useCallback((name: string) => {
    setSelectedEmployee(name);
    setScreen('pin');
  }, []);

  const handlePinVerified = useCallback(() => {
    setScreen('clock');
  }, []);

  const refreshEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      console.error('Failed to refresh employees', err);
    }
  }, []);

  const refreshRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/requests');
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error('Failed to refresh requests', err);
    }
  }, []);

  const handleClockAction = useCallback(
    async (action: ClockActionType) => {
      const timestamp = getCurrentTimestamp();
      try {
        await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'clock',
            employeeName: selectedEmployee,
            clockAction: action,
            timestamp,
          }),
        });
        await refreshEmployees();
      } catch (err) {
        console.error('Failed to record time', err);
      }
    },
    [selectedEmployee, refreshEmployees]
  );

  const handleRequestOff = useCallback(() => {
    setScreen('requestOff');
  }, []);

  const handleSubmitTimeOff = useCallback(
    async (date: string, reason: string) => {
      try {
        await fetch('/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeName: selectedEmployee,
            date,
            reason,
          }),
        });
        await refreshRequests();
      } catch (err) {
        console.error('Failed to submit request', err);
      }
    },
    [selectedEmployee, refreshRequests]
  );

  const currentEmployee = employees.find((e) => e.name === selectedEmployee);
  const currentRecords = currentEmployee?.records || [];

  if (loading) {
    return <SplashScreen onFinish={() => setScreen('home')} />;
  }

  return (
    <AnimatePresence mode="wait">
      {screen === 'splash' && (
        <SplashScreen key="splash" onFinish={() => setScreen('home')} />
      )}

      {screen === 'home' && (
        <motion.div
          key="home"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <EmployeeSelector
            employees={EMPLOYEES.map((e) => e.name)}
            onSelect={handleEmployeeSelect}
          />
          <div className="fixed bottom-6 right-6 z-20">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setScreen('adminLogin')}
              className="flex items-center gap-2 px-5 py-3 bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-xl shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all font-medium"
            >
              <Shield className="w-5 h-5" />
              Admin
            </motion.button>
          </div>
        </motion.div>
      )}

      {screen === 'pin' && (
        <PinEntry
          key="pin"
          employeeName={selectedEmployee}
          onVerify={handlePinVerified}
          onBack={() => setScreen('home')}
        />
      )}

      {screen === 'clock' && (
        <ClockActions
          key="clock"
          employeeName={selectedEmployee}
          records={currentRecords}
          onClockAction={handleClockAction}
          onRequestOff={handleRequestOff}
          onBack={() => setScreen('home')}
        />
      )}

      {screen === 'requestOff' && (
        <TimeOffRequest
          key="requestOff"
          employeeName={selectedEmployee}
          onSubmit={handleSubmitTimeOff}
          onBack={() => setScreen('clock')}
        />
      )}

      {screen === 'adminLogin' && (
        <AdminLogin
          key="adminLogin"
          onLogin={() => setScreen('adminDashboard')}
          onBack={() => setScreen('home')}
        />
      )}

      {screen === 'adminDashboard' && (
        <AdminDashboard
          key="adminDashboard"
          employees={employees}
          requests={requests}
          onRefresh={refreshEmployees}
          onRefreshRequests={refreshRequests}
          onLogout={() => setScreen('home')}
        />
      )}
    </AnimatePresence>
  );
}