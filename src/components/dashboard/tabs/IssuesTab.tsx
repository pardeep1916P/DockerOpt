import React, { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { AnalysisResult, Issue, Severity } from '../../../types';
import { SeverityBadge } from '../../common/SeverityBadge';

interface IssuesTabProps {
  data: AnalysisResult;
}

const severityBorder: Record<Severity, string> = {
  critical: 'bg-error-dim',
  high: 'bg-tertiary',
  medium: 'bg-tertiary-dim',
  low: 'bg-secondary',
};

const IssueCard: React.FC<{ issue: Issue; index: number }> = ({ issue, index }) => {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className="bg-surface-container-high rounded-2xl overflow-hidden transition-all relative group shadow-lg">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${severityBorder[issue.severity]}`}></div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-5 lg:px-6 py-4 hover:bg-white/[0.02] transition-colors text-left focus:outline-none"
      >
        <div className="flex items-center gap-4 flex-1">
          {open ? (
            <ChevronDown className="w-5 h-5 text-on-surface-variant shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-on-surface-variant shrink-0" />
          )}
          <span className="text-sm lg:text-base font-bold tracking-tight text-on-surface flex-1">{issue.title}</span>
          <SeverityBadge severity={issue.severity} />
        </div>
      </button>
      
      {open && (
        <div className="px-5 lg:px-6 pb-6 pt-2 ml-9 mr-2 space-y-5 animate-fade-in-up">
          <div className="p-4 bg-surface-container-low rounded-xl border border-white/5">
            <div className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-2">Explanation</div>
            <p className="text-on-surface text-sm leading-relaxed">{issue.explanation}</p>
          </div>
          <div className="p-4 bg-surface-container-low rounded-xl border border-white/5">
            <div className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-2">Impact</div>
            <p className="text-on-surface text-sm leading-relaxed">{issue.impact}</p>
          </div>
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
            <div className="text-primary text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">build</span> Suggested Fix
            </div>
            <div className="bg-background/80 p-3 rounded-lg border border-white/5 overflow-x-auto">
              <code className="text-primary font-mono text-xs whitespace-pre">{issue.fix}</code>
            </div>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold tracking-tight text-on-surface flex items-center gap-2">
          <AlertTriangle className="text-tertiary w-5 h-5" />
          Structural Issues
        </h2>
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-high px-3 py-1 rounded-full">{data.issues.length} detected</span>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-surface-container-low rounded-[2rem] p-12 text-center flex flex-col items-center justify-center border border-white/5">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">check_circle</span>
          </div>
          <p className="text-on-surface font-bold text-lg tracking-tight">No issues detected.</p>
          <p className="text-on-surface-variant text-sm mt-1">Your Dockerfile structurally looks good!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((issue, i) => (
            <IssueCard key={i} issue={issue} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};
