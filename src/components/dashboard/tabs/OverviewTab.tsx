import React from 'react';
import { HardDrive, Layers, TrendingDown, Shield } from 'lucide-react';
import { AnalysisResult } from '../../../types';
import { MetricCard } from '../../common/MetricCard';
import { ScoreRing } from '../../common/ScoreRing';

function formatBytes(bytes: number): string {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

interface OverviewTabProps {
  data: AnalysisResult;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ data }) => {
  const reduction = data.originalSize > 0
    ? ((data.originalSize - data.optimizedSize) / data.originalSize * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Overview</h2>

      <div className="flex items-start gap-8">
        {/* Score Ring */}
        <div className="flex flex-col items-center gap-2">
          <ScoreRing score={data.optimizationScore} size={140} />
          <span className="text-xs text-gray-500 uppercase tracking-wider">Optimization Score</span>
        </div>

        {/* Metrics Grid */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          <MetricCard
            label="Original Size"
            value={formatBytes(data.originalSize)}
            icon={<HardDrive className="w-4 h-4" />}
          />
          <MetricCard
            label="Optimized Size"
            value={formatBytes(data.optimizedSize)}
            accent="text-emerald-400"
            icon={<HardDrive className="w-4 h-4" />}
          />
          <MetricCard
            label="Size Reduction"
            value={`${reduction}%`}
            subValue={`${formatBytes(data.originalSize - data.optimizedSize)} saved`}
            accent="text-emerald-400"
            icon={<TrendingDown className="w-4 h-4" />}
          />
          <MetricCard
            label="Layers"
            value={`${data.layerCountBefore} → ${data.layerCountAfter}`}
            icon={<Layers className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Issues Found"
          value={data.issues.length}
          accent={data.issues.length > 0 ? 'text-yellow-400' : 'text-emerald-400'}
        />
        <MetricCard
          label="Vulnerabilities"
          value={data.vulnerabilitiesBefore.length}
          accent={data.vulnerabilitiesBefore.length > 0 ? 'text-red-400' : 'text-emerald-400'}
          icon={<Shield className="w-4 h-4" />}
        />
        <MetricCard
          label="Optimizations Applied"
          value={data.changes.length}
          accent="text-blue-400"
        />
      </div>
    </div>
  );
};
