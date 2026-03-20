import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ScoreRingProps {
  score: number; // 0–100
  size?: number;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({ score, size = 120 }) => {
  const { isDark } = useTheme();
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return '#22c55e';
    if (s >= 60) return '#eab308';
    if (s >= 40) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? '#374151' : '#e5e7eb'}
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(score)}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold font-mono text-gray-900 dark:text-white">{Math.round(score)}</span>
        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</span>
      </div>
    </div>
  );
};
