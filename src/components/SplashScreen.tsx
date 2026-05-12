'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 15 + 5;
        return Math.min(next, 100);
      });
    }, 200);

    const timer = setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(onFinish, 800);
      }, 400);
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-linear-to-br from-indigo-900 via-purple-900 to-slate-900 transition-opacity duration-800 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative mb-8">
        <Image
          src="/android-chrome-512x512.png"
          alt="ClockIn Logo"
          width={128}
          height={128}
          className="animate-bounce drop-shadow-2xl"
          priority
        />
      </div>

      <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
        Clock<span className="text-indigo-400">In</span>
      </h1>
      <p className="text-indigo-200/70 text-lg mb-12 font-light">
        Employee Time Tracking System
      </p>

      <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-linear-to-r from-indigo-400 to-purple-400 rounded-full transition-all duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-white/40 text-sm mt-4 font-mono">
        {Math.round(progress)}%
      </p>

      <div className="absolute bottom-12 flex gap-2">
        {[0, 1, 2, 3].map((dot) => (
          <div
            key={dot}
            className="w-2 h-2 rounded-full bg-indigo-400/30 animate-pulse"
            style={{ animationDelay: `${dot * 0.3}s` }}
          />
        ))}
      </div>
    </div>
  );
}