'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  LogOut,
  Coffee,
  UtensilsCrossed,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { getCurrentTimestamp, isLate } from '@/lib/storage';
import { TimeRecord, ClockAction as ClockActionType } from '@/lib/types';

interface ClockActionsProps {
  employeeName: string;
  records: TimeRecord[];
  onClockAction: (action: ClockActionType) => void;
  onRequestOff: () => void;
  onBack: () => void;
}

const actions: {
  key: ClockActionType;
  label: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
}[] = [
  {
    key: 'shiftStart',
    label: 'Shift Start',
    icon: LogOut,
    color: 'text-emerald-500',
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    key: 'lunchOut',
    label: 'Lunch Out',
    icon: Coffee,
    color: 'text-amber-500',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    key: 'lunchIn',
    label: 'Lunch In',
    icon: UtensilsCrossed,
    color: 'text-blue-500',
    gradient: 'from-blue-400 to-indigo-500',
  },
  {
    key: 'shiftEnd',
    label: 'Shift End',
    icon: CheckCircle2,
    color: 'text-purple-500',
    gradient: 'from-purple-400 to-pink-500',
  },
];

export default function ClockActions({
  employeeName,
  records,
  onClockAction,
  onRequestOff,
  onBack,
}: ClockActionsProps) {
  const [currentTime, setCurrentTime] = useState(getCurrentTimestamp());
  const [recentAction, setRecentAction] = useState<ClockActionType | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTimestamp());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get the latest record (most recent first)
  const latestRecord = records[records.length - 1];
  const isTardy = latestRecord ? isLate(latestRecord.shiftStart) : false;

  const handleAction = (action: ClockActionType) => {
    setRecentAction(action);
    onClockAction(action);
    setTimeout(() => setRecentAction(null), 2000);
  };

  const isActionRecorded = (action: ClockActionType): boolean => {
    if (!latestRecord) return false;
    return latestRecord[action] !== null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950 p-6"
    >
      <div className="max-w-2xl mx-auto pt-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              ← Back
            </button>
            <button
              onClick={onRequestOff}
              className="flex items-center gap-2 text-indigo-500 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950"
            >
              <Calendar className="w-4 h-4" />
              Request Off
            </button>
          </div>

          <div className="w-20 h-20 rounded-full bg-linear-to-br from-indigo-400 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Clock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">
            {employeeName}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-mono text-sm">
            {currentTime}
          </p>

          {isTardy && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-full text-sm font-medium"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Tardy — More than 5 minutes late
            </motion.div>
          )}
        </motion.div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {actions.map((action, index) => {
            const recorded = isActionRecorded(action.key);
            const isRecent = recentAction === action.key;
            return (
              <motion.button
                key={action.key}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={!recorded ? { scale: 1.03 } : {}}
                whileTap={!recorded ? { scale: 0.97 } : {}}
                onClick={() => !recorded && handleAction(action.key)}
                disabled={recorded}
                className={`relative rounded-2xl p-6 shadow-lg border transition-all duration-300 ${
                  recorded
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 cursor-default'
                    : isRecent
                    ? 'bg-white dark:bg-slate-800 border-indigo-300 dark:border-indigo-600 shadow-indigo-100 dark:shadow-indigo-900/30'
                    : 'bg-white dark:bg-slate-800/50 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl'
                }`}
              >
                <div
                  className={`absolute inset-0 rounded-2xl bg-linear-to-br ${action.gradient} opacity-0 ${
                    isRecent ? 'opacity-10' : ''
                  } transition-opacity`}
                />
                <div className="relative flex flex-col items-center gap-3">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      recorded
                        ? 'bg-green-100 dark:bg-green-800/50'
                        : 'bg-slate-100 dark:bg-slate-700'
                    }`}
                  >
                    <action.icon
                      className={`w-7 h-7 ${
                        recorded
                          ? 'text-green-500'
                          : action.color
                      }`}
                    />
                  </div>
                  <span
                    className={`font-semibold text-lg ${
                      recorded
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {action.label}
                  </span>
                  {recorded && latestRecord?.[action.key] && (
                    <span className="text-xs text-green-500 dark:text-green-400 font-mono">
                      {latestRecord[action.key]}
                    </span>
                  )}
                  {!recorded && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Tap to record
                    </span>
                  )}
                  {isRecent && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center"
                    >
                      <span className="text-white text-xs font-bold">✓</span>
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {latestRecord && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50"
          >
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
              Todays Activity
            </h3>
            <div className="space-y-3">
              {actions.map((action) => {
                const time = latestRecord[action.key];
                return (
                  <div
                    key={action.key}
                    className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <action.icon className={`w-4 h-4 ${action.color}`} />
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {action.label}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-mono ${
                        time
                          ? 'text-slate-800 dark:text-white'
                          : 'text-slate-400 italic'
                      }`}
                    >
                      {time || 'Not recorded'}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}