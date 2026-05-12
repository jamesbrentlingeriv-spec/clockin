'use client';

import { motion } from 'framer-motion';
import { User } from 'lucide-react';

interface EmployeeSelectorProps {
  onSelect: (name: string) => void;
  employees: string[];
}

export default function EmployeeSelector({ onSelect, employees }: EmployeeSelectorProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950 p-6">
      <div className="max-w-4xl mx-auto pt-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-3">
            Whos Clocking In?
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            Select your name to begin
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {employees.map((name, index) => (
            <motion.button
              key={name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(name)}
              className="group relative bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl border border-slate-200/50 dark:border-slate-700/50 transition-all duration-300"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg group-hover:shadow-indigo-200 dark:group-hover:shadow-indigo-900/50 transition-shadow duration-300">
                  <User className="w-8 h-8 text-white" />
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-200 text-lg">
                  {name}
                </span>
                <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Tap to clock in
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}