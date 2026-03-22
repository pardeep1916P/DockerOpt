import React from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Wrench,
  BarChart3,
  Shield,
  Terminal,
} from 'lucide-react';
import { DashboardTab } from '../../types';

interface NavigationBarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  issueCount: number;
  vulnCount: number;
}

const tabs: { key: DashboardTab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
  { key: 'size', label: 'Size', icon: <BarChart3 size={20} /> },
  { key: 'issues', label: 'Issues', icon: <AlertTriangle size={20} /> },
  { key: 'security', label: 'Security', icon: <Shield size={20} /> },
  { key: 'optimization', label: 'Optims', icon: <Wrench size={20} /> },
  { key: 'logs', label: 'Logs', icon: <Terminal size={20} /> },
];

export const NavigationBar: React.FC<NavigationBarProps> = ({
  activeTab,
  onTabChange,
  issueCount,
  vulnCount,
}) => (
  <nav className="fixed bottom-0 left-0 w-full z-[70] flex justify-around items-center px-2 pb-6 pt-3 bg-surface/90 backdrop-blur-xl border-t border-white/5 shadow-[0_-8px_30px_rgb(0,0,0,0.4)] lg:fixed lg:top-0 lg:bottom-auto lg:left-1/2 lg:-translate-x-1/2 lg:w-auto lg:h-16 lg:justify-center lg:gap-2 lg:bg-transparent lg:shadow-none lg:border-none lg:px-0 lg:pb-0 lg:pt-0 lg:backdrop-blur-none overflow-x-auto no-scrollbar">
    {tabs.map((tab) => {
      const active = activeTab === tab.key;
      const count =
        tab.key === 'issues' && issueCount > 0
          ? issueCount
          : tab.key === 'security' && vulnCount > 0
          ? vulnCount
          : null;

      return (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex flex-col lg:flex-row items-center justify-center gap-1.5 lg:gap-2 rounded-xl px-4 py-2 transition-all shrink-0 ${
            active
              ? 'bg-primary/10 text-primary scale-110 lg:scale-100'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
          }`}
        >
          <div className="relative">
            {tab.icon}
            {count !== null && (
              <span className="absolute -top-1 -right-2 bg-error-dim text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </div>
          <span className="font-['Inter'] text-[10px] lg:text-sm font-medium uppercase lg:capitalize tracking-widest lg:tracking-normal mt-1 lg:mt-0">
            {tab.label}
          </span>
        </button>
      );
    })}
  </nav>
);
