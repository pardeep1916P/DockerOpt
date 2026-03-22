import React from 'react';

interface ScoreRingProps {
  score: number; // 0–100
  size?: number;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({ score, size = 192 }) => {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative group">
      {/* Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
      
      {/* Inner Container */}
      <div className="relative bg-surface-container-low rounded-full p-6 sm:p-8 flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="relative flex items-center justify-center mb-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              className="text-surface-variant"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#scoreGradient)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#69f6b8" />
                <stop offset="100%" stopColor="#06b77f" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl sm:text-5xl font-black tracking-tighter text-on-surface">
              {Math.round(score)}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mt-1">
              Score
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
