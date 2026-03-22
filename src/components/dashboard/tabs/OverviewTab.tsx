import React from 'react';
import { HardDrive, Layers, TrendingDown, Shield, AlertTriangle, Wand2 } from 'lucide-react';
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
    <div className="space-y-8">
      {/* Hero Section: Score Dashboard */}
      <section className="bg-surface-container-low rounded-[2rem] p-6 lg:p-10 flex flex-col md:flex-row items-center gap-8 lg:gap-16 border border-white/5 shadow-2xl">
        <ScoreRing score={data.optimizationScore} size={200} />
        
        <div className="space-y-4 text-center md:text-left flex-1">
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-on-surface">
            Image Health: {data.optimizationScore >= 80 ? 'Excellent' : data.optimizationScore >= 50 ? 'Fair' : 'Needs Optimization'}
          </h2>
          <p className="text-on-surface-variant text-sm lg:text-base max-w-lg leading-relaxed">
            Your image size is {reduction}% smaller than the original baseline. There are {data.changes.length} optimizations applied and {data.issues.length} structural issues identified.
          </p>
          
          {/* Status Chips Row */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4">
            <div className="flex-shrink-0 flex items-center gap-2 lg:gap-3 bg-tertiary/10 border border-tertiary/20 px-4 py-2 rounded-full">
              <AlertTriangle className="text-tertiary w-4 h-4" />
              <span className="text-[10px] lg:text-xs font-bold text-tertiary uppercase tracking-wider">{data.issues.length} Issues Found</span>
            </div>
            {data.vulnerabilitiesBefore.length > 0 && (
              <div className="flex-shrink-0 flex items-center gap-2 lg:gap-3 bg-error-dim/10 border border-error-dim/20 px-4 py-2 rounded-full">
                <Shield className="text-error-dim w-4 h-4" />
                <span className="text-[10px] lg:text-xs font-bold text-error-dim uppercase tracking-wider">{data.vulnerabilitiesBefore.length} Vulns</span>
              </div>
            )}
            <div className="flex-shrink-0 flex items-center gap-2 lg:gap-3 bg-secondary/10 border border-secondary/20 px-4 py-2 rounded-full">
              <Wand2 className="text-secondary w-4 h-4" />
              <span className="text-[10px] lg:text-xs font-bold text-secondary uppercase tracking-wider">{data.changes.length} Optimizations</span>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Original Size"
          value={formatBytes(data.originalSize)}
          icon={<HardDrive className="w-5 h-5" />}
          subValue="Starting Baseline"
        />
        <MetricCard
          label="Optimized Size"
          value={formatBytes(data.optimizedSize)}
          accent="primary"
          icon={<HardDrive className="w-5 h-5" />}
          subValue="After Optimization"
        />
        <MetricCard
          label="Reduction"
          value={`${reduction}%`}
          accent="secondary"
          icon={<TrendingDown className="w-5 h-5" />}
          subValue={`${formatBytes(data.originalSize - data.optimizedSize)} Saved`}
        />
        <MetricCard
          label="Layers"
          value={data.layerCountAfter}
          subValue={`Reduced from ${data.layerCountBefore}`}
          icon={<Layers className="w-5 h-5" />}
        />
      </div>
    </div>
  );
};
