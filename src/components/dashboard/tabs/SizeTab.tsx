import React from 'react';
import { AnalysisResult } from '../../../types';
import { useTheme } from '../../../context/ThemeContext';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip as ChartTooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip);

function formatBytes(bytes: number): string {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function toMB(bytes: number): number {
  return +(bytes / (1024 * 1024)).toFixed(2);
}

interface SizeTabProps {
  data: AnalysisResult;
}

export const SizeTab: React.FC<SizeTabProps> = ({ data }) => {
  const { isDark } = useTheme();

  // Layer comparison chart data
  const maxLayers = Math.max(data.layersBefore.length, data.layersAfter.length);
  const labels = Array.from({ length: maxLayers }, (_, i) => `Layer ${i + 1}`);

  const gridColor = isDark ? 'rgba(38, 38, 38, 0.4)' : 'rgba(209, 213, 219, 0.5)';
  const tickColor = isDark ? '#adaaaa' : '#6b7280';

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Original',
        data: data.layersBefore.map((l) => toMB(l.size)),
        backgroundColor: 'rgba(215, 56, 59, 0.6)', // error-dim
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        label: 'Optimized',
        data: data.layersAfter.map((l) => toMB(l.size)),
        backgroundColor: 'rgba(105, 246, 184, 0.6)', // primary
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        backgroundColor: 'rgba(26, 26, 26, 0.9)',
        padding: 12,
        titleColor: '#ffffff',
        bodyColor: '#adaaaa',
        titleFont: { family: 'Inter', size: 14, weight: 'bold' as const },
        bodyFont: { family: 'Inter', size: 13 },
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) =>
            `${ctx.dataset.label}: ${ctx.parsed.y ?? 0} MB`,
        },
      },
      legend: { display: false }
    },
    scales: {
      x: {
        grid: { color: gridColor, display: false },
        ticks: { color: tickColor, font: { family: 'Inter', size: 11 } },
      },
      y: {
        grid: { color: gridColor, drawBorder: false },
        border: { display: false },
        ticks: { color: tickColor, font: { family: 'Inter', size: 11 }, callback: (v: string | number) => `${v} MB` },
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold tracking-tight text-on-surface">Image Composition</h2>
      </div>

      {/* Comparison Detail Bar container */}
      <div className="bg-surface-container-low rounded-[2rem] overflow-hidden">
        <div className="px-6 lg:px-8 py-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-lg tracking-tight">Size Breakdown</h3>
        </div>
        
        <div className="px-6 lg:px-8 py-8 space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-error-dim"></div> Original Total</span>
                <span className="text-on-surface font-mono text-sm">{formatBytes(data.originalSize)}</span>
              </div>
              <div className="h-2.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-error-dim/80 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary"></div> Optimized Total</span>
                <span className="text-primary font-mono text-sm">{formatBytes(data.optimizedSize)}</span>
              </div>
              <div className="h-2.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(105,246,184,0.4)]"
                  style={{ width: data.originalSize > 0 ? `${(data.optimizedSize / data.originalSize) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layer Chart */}
      {data.layersBefore.length > 0 && (
        <div className="bg-surface-container-low rounded-[2rem] overflow-hidden">
           <div className="px-6 lg:px-8 py-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-bold text-lg tracking-tight">Layer Comparison</h3>
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                 <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-error-dim/60"></div> Before</span>
                 <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary/60"></div> After</span>
              </div>
           </div>
          <div className="px-6 lg:px-8 py-8">
            <div className="h-[300px]">
              <Bar data={chartData} options={chartOptions as any} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
