import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  accent?: string; // tailwind text color class
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  icon,
  accent = 'text-gray-900 dark:text-white',
}) => (
  <div className="bg-gray-100 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50 rounded-lg p-5 flex flex-col gap-2 transition-colors">
    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm font-medium">
      {icon && <span className="w-4 h-4">{icon}</span>}
      {label}
    </div>
    <div className={`text-2xl font-bold font-mono ${accent}`}>{value}</div>
    {subValue && <div className="text-xs text-gray-500">{subValue}</div>}
  </div>
);
