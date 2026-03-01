import React, { useState } from 'react';
import { AnalysisResult, DashboardTab } from '../../types';
import { Sidebar } from './Sidebar';
import { OverviewTab } from './tabs/OverviewTab';
import { IssuesTab } from './tabs/IssuesTab';
import { OptimizationTab } from './tabs/OptimizationTab';
import { SizeTab } from './tabs/SizeTab';
import { SecurityTab } from './tabs/SecurityTab';
import { LogsTab } from './tabs/LogsTab';

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
    <div className="h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white flex transition-colors">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={onBack}
        issueCount={data.issues.length}
        vulnCount={data.vulnerabilitiesBefore.length}
      />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {data.error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {data.error}
          </div>
        )}
        {renderTab()}
      </main>
    </div>
  );
};
