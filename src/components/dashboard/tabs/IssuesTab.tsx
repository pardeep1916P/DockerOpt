import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { AnalysisResult, Issue } from '../../../types';
import { SeverityBadge } from '../../common/SeverityBadge';

interface IssuesTabProps {
  data: AnalysisResult;
}

const IssueCard: React.FC<{ issue: Issue; index: number }> = ({ issue, index }) => {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className="border border-gray-300/50 dark:border-gray-700/50 rounded-lg overflow-hidden transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-colors text-left"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
        )}
        <SeverityBadge severity={issue.severity} />
        <span className="text-sm text-gray-700 dark:text-gray-200 flex-1">{issue.title}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 ml-7 space-y-3 text-sm">
          <div>
            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Explanation</div>
            <p className="text-gray-600 dark:text-gray-300">{issue.explanation}</p>
          </div>
          <div>
            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Impact</div>
            <p className="text-gray-500 dark:text-gray-400">{issue.impact}</p>
          </div>
          <div>
            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Suggested Fix</div>
            <p className="text-emerald-400/80 font-mono text-xs">{issue.fix}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const IssuesTab: React.FC<IssuesTabProps> = ({ data }) => {
  const sorted = [...data.issues].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Issues</h2>
        <span className="text-sm text-gray-500">{data.issues.length} detected</span>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          No issues detected. Your Dockerfile looks good!
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((issue, i) => (
            <IssueCard key={i} issue={issue} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};
