'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Lock } from 'lucide-react';

interface PinEntryProps {
  employeeName: string;
  onVerify: () => void;
  onBack: () => void;
}

export default function PinEntry({ employeeName, onVerify, onBack }: PinEntryProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = async (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(false);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 3 && value) {
      const fullPin = [...newPin.slice(0, 3), value].join('');
      setVerifying(true);
      try {
        const res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'verifyPin',
            name: employeeName,
            pin: fullPin,
          }),
        });
        const data = await res.json();
        if (data.valid) {
          onVerify();
        } else {
          setError(true);
          setShaking(true);
          setTimeout(() => setShaking(false), 500);
          setPin(['', '', '', '']);
          inputRefs.current[0]?.focus();
        }
      } catch  {
        setError(true);
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
        setPin(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
      setVerifying(false);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

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
        className={`bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-slate-200/50 dark:border-slate-700/50 w-full max-w-sm ${
          shaking ? 'animate-shake' : ''
        }`}
      >
        <button
          onClick={onBack}
          className="mb-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-linear-to-br from-indigo-400 to-purple-500 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {employeeName}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {verifying ? 'Verifying...' : 'Enter your 4-digit PIN'}
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-6">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={verifying}
              className={`w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 bg-slate-50 dark:bg-slate-700/50 focus:outline-none ${
                error
                  ? 'border-red-400 text-red-500'
                  : digit
                  ? 'border-indigo-400 text-indigo-600 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white'
              }`}
            />
          ))}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm text-center"
          >
            Incorrect PIN. Please try again.
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}