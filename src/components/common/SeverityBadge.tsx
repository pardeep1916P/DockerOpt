import React from 'react';
import { Severity } from '../../types';

const colorMap: Record<Severity, string> = {
  critical: 'bg-error-dim/20 text-error-dim',
  high: 'bg-tertiary/20 text-tertiary',
  medium: 'bg-tertiary-dim/20 text-tertiary-dim',
  low: 'bg-secondary/20 text-secondary',
};

interface SeverityBadgeProps {
  severity: Severity;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => (
  <span
    className={`px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-md ${colorMap[severity]}`}
  >
    {severity}
  </span>
);
