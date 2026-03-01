import React from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Wrench,
  BarChart3,
  Shield,
  Terminal,
  ArrowLeft,
} from 'lucide-react';
import { DashboardTab } from '../../types';

interface SidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onBack: () => void;
  issueCount: number;
  vulnCount: number;
}

const tabs: { key: DashboardTab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: 'issues', label: 'Issues', icon: <AlertTriangle className="w-4 h-4" /> },
  { key: 'optimization', label: 'Optimization', icon: <Wrench className="w-4 h-4" /> },
  { key: 'size', label: 'Size Comparison', icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
  { key: 'logs', label: 'Logs', icon: <Terminal className="w-4 h-4" /> },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onBack,
  issueCount,
  vulnCount,
}) => (
  <aside className="w-56 shrink-0 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-colors">
    <button
      onClick={onBack}
      className="flex items-center gap-2 px-4 py-3 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors border-b border-gray-200 dark:border-gray-800"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      New Analysis
    </button>
    <nav className="flex-1 py-2">
      {tabs.map((tab) => {
        const badge =
          tab.key === 'issues' && issueCount > 0
            ? issueCount
            : tab.key === 'security' && vulnCount > 0
            ? vulnCount
            : null;

        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
              activeTab === tab.key
                ? 'bg-gray-100 dark:bg-gray-800/80 text-gray-900 dark:text-white border-r-2 border-emerald-500 dark:border-emerald-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/40'
            }`}
          >
            {tab.icon}
            <span className="flex-1 text-left">{tab.label}</span>
            {badge !== null && (
              <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-mono px-1.5 py-0.5 rounded">
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  </aside>
);
