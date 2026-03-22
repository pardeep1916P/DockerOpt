import React, { useState } from 'react';
import { AnalysisResult, DashboardTab } from '../../types';
import { NavigationBar } from './NavigationBar';
import { OverviewTab } from './tabs/OverviewTab';
import { IssuesTab } from './tabs/IssuesTab';
import { OptimizationTab } from './tabs/OptimizationTab';
import { SizeTab } from './tabs/SizeTab';
import { SecurityTab } from './tabs/SecurityTab';
import { LogsTab } from './tabs/LogsTab';
import { ArrowLeft } from 'lucide-react';

interface DashboardProps {
  data: AnalysisResult;
  onBack: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onBack }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab data={data} />;
      case 'issues':
        return <IssuesTab data={data} />;
      case 'optimization':
        return <OptimizationTab data={data} />;
      case 'size':
        return <SizeTab data={data} />;
      case 'security':
        return <SecurityTab data={data} />;
      case 'logs':
        return <LogsTab data={data} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-body transition-colors pb-24 lg:pb-0">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-[60] flex items-center justify-between px-4 lg:px-6 h-16 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src="/docker.svg" alt="Docker" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
          <h1 className="font-['Inter'] tracking-tighter font-black italic text-xl sm:text-2xl text-white">DockerOpt</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors text-on-surface-variant hover:text-on-surface text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">New Analysis</span>
          </button>
        </div>
      </header>

      <main className="flex-1 pt-20 px-4 md:px-8 max-w-7xl mx-auto w-full space-y-6 lg:space-y-8">
        <NavigationBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          issueCount={data.issues.length}
          vulnCount={data.vulnerabilitiesBefore.length}
        />

        {data.error && (
          <div className="mb-4 p-4 bg-error-container/20 border border-error-container rounded-2xl text-sm text-error">
            {data.error}
          </div>
        )}

        <div className="animate-fade-in-up">
          {renderTab()}
        </div>
      </main>
    </div>
  );
};
