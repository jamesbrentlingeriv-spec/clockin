'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Send } from 'lucide-react';

interface TimeOffRequestProps {
  employeeName: string;
  onSubmit: (date: string, reason: string) => void;
  onBack: () => void;
}

export default function TimeOffRequest({ employeeName, onSubmit, onBack }: TimeOffRequestProps) {
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (date && reason) {
      onSubmit(date, reason);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950 flex items-center justify-center p-6"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl p-10 shadow-xl border border-slate-200/50 dark:border-slate-700/50 text-center max-w-sm"
        >
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            Request Submitted!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Your time off request has been sent to the manager for approval.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950 flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-slate-200/50 dark:border-slate-700/50 w-full max-w-md"
      >
        <button
          onClick={onBack}
          className="mb-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-linear-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              Request Time Off
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {employeeName}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-400 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Tell us why you need time off..."
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-400 transition-colors resize-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-linear-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30"
          >
            Submit Request
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}