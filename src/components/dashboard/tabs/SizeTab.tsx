import React from 'react';
import { AnalysisResult } from '../../../types';
import { MetricCard } from '../../common/MetricCard';
import { useTheme } from '../../../context/ThemeContext';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
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

  const reduction = data.originalSize > 0
    ? ((data.originalSize - data.optimizedSize) / data.originalSize * 100).toFixed(1)
    : '0';

  // Layer comparison chart data
  const maxLayers = Math.max(data.layersBefore.length, data.layersAfter.length);
  const labels = Array.from({ length: maxLayers }, (_, i) => `Layer ${i + 1}`);

  const gridColor = isDark ? 'rgba(55, 65, 81, 0.3)' : 'rgba(209, 213, 219, 0.5)';
  const tickColor = isDark ? '#9ca3af' : '#6b7280';

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Before',
        data: data.layersBefore.map((l) => toMB(l.size)),
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderRadius: 3,
      },
      {
        label: 'After',
        data: data.layersAfter.map((l) => toMB(l.size)),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderRadius: 3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) =>
            `${ctx.dataset.label}: ${ctx.parsed.y ?? 0} MB`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: tickColor, font: { size: 11 } },
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: tickColor, font: { size: 11 }, callback: (v: string | number) => `${v} MB` },
      },
    },
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Size Comparison</h2>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Size Before" value={formatBytes(data.originalSize)} />
        <MetricCard label="Size After" value={formatBytes(data.optimizedSize)} accent="text-emerald-400" />
        <MetricCard label="Reduction" value={`${reduction}%`} accent="text-emerald-400" />
        <MetricCard
          label="Layers"
          value={`${data.layerCountBefore} → ${data.layerCountAfter}`}
        />
      </div>

      {/* Comparison Bar */}
      <div className="bg-gray-100/80 dark:bg-gray-800/40 border border-gray-300/40 dark:border-gray-700/40 rounded-lg p-4 space-y-3 transition-colors">
        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size Comparison</div>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-14">Before</span>
            <div className="flex-1 h-6 bg-gray-200/50 dark:bg-gray-700/40 rounded overflow-hidden">
              <div className="h-full bg-red-500/60 rounded" style={{ width: '100%' }} />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono w-20 text-right">{formatBytes(data.originalSize)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-14">After</span>
            <div className="flex-1 h-6 bg-gray-200/50 dark:bg-gray-700/40 rounded overflow-hidden">
              <div
                className="h-full bg-emerald-500/60 rounded"
                style={{ width: data.originalSize > 0 ? `${(data.optimizedSize / data.originalSize) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-xs text-emerald-400 font-mono w-20 text-right">{formatBytes(data.optimizedSize)}</span>
          </div>
        </div>
      </div>

      {/* Layer Chart */}
      {data.layersBefore.length > 0 && (
        <div className="bg-gray-100/80 dark:bg-gray-800/40 border border-gray-300/40 dark:border-gray-700/40 rounded-lg p-4 transition-colors">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Layer Breakdown</div>
          <div className="h-64">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  );
};
