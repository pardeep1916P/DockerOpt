import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  accent?: 'primary' | 'secondary' | 'error' | 'tertiary' | 'default';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  icon,
  accent = 'default',
}) => {
  const accentConfigs: Record<string, { text: string; bg: string; iconText?: string }> = {
    primary: { text: 'text-primary', bg: 'bg-primary/10' },
    secondary: { text: 'text-secondary', bg: 'bg-secondary/10' },
    error: { text: 'text-error-dim', bg: 'bg-error-dim/10' },
    tertiary: { text: 'text-tertiary', bg: 'bg-tertiary/10' },
    default: { text: 'text-on-surface', bg: 'bg-white/5', iconText: 'text-slate-400 group-hover:text-on-surface' },
  };

  const conf = accentConfigs[accent];
  const iconTextColor = accent === 'default' ? conf.iconText : conf.text;
  const valueTextColor = accent === 'default' ? 'text-on-surface' : conf.text;

  return (
    <div className="bg-surface-container-low p-5 lg:p-6 rounded-3xl flex flex-col justify-between group hover:bg-surface-container transition-colors relative overflow-hidden">
      {accent !== 'default' && (
        <div className={`absolute top-0 left-0 w-1 h-full ${conf.bg.replace('/10', '/40')}`}></div>
      )}
      <div className="flex justify-between items-start mb-4">
        {icon && (
          <div className={`p-2 rounded-xl transition-colors ${conf.bg} ${iconTextColor}`}>
            {icon}
          </div>
        )}
        <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${accent === 'default' ? 'text-on-surface-variant' : conf.text}`}>
          {label}
        </span>
      </div>
      <div>
        <span className={`text-2xl sm:text-3xl font-black tracking-tighter ${valueTextColor}`}>
          {value}
        </span>
        {subValue && <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-1">{subValue}</p>}
      </div>
    </div>
  );
};
