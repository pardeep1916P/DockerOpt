import React, { useState } from 'react';
import { Filter, ShieldAlert } from 'lucide-react';
import { AnalysisResult, Severity } from '../../../types';
import { SeverityBadge } from '../../common/SeverityBadge';
import { MetricCard } from '../../common/MetricCard';

interface SecurityTabProps {
  data: AnalysisResult;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({ data }) => {
  const [filterSeverity, setFilterSeverity] = useState<Severity | 'all'>('all');
  const [fixableOnly, setFixableOnly] = useState(false);

  const vulns = data.vulnerabilitiesBefore;

  const counts = {
    critical: vulns.filter((v) => v.severity === 'critical').length,
    high: vulns.filter((v) => v.severity === 'high').length,
    medium: vulns.filter((v) => v.severity === 'medium').length,
    low: vulns.filter((v) => v.severity === 'low').length,
  };

  const filtered = vulns.filter((v) => {
    if (filterSeverity !== 'all' && v.severity !== filterSeverity) return false;
    if (fixableOnly && !v.fixable) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold tracking-tight text-on-surface flex items-center gap-2">
          <ShieldAlert className="text-error-dim w-5 h-5" />
          Vulnerabilities
        </h2>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Critical" value={counts.critical} accent={counts.critical > 0 ? 'error' : 'default'} />
        <MetricCard label="High" value={counts.high} accent={counts.high > 0 ? 'tertiary' : 'default'} />
        <MetricCard label="Medium" value={counts.medium} accent={counts.medium > 0 ? 'tertiary' : 'default'} />
        <MetricCard label="Low" value={counts.low} accent={counts.low > 0 ? 'secondary' : 'default'} />
      </div>

      {/* Filters */}
      <div className="bg-surface-container-low p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Filters</span>
        </div>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as Severity | 'all')}
          className="bg-surface-container-high border-none text-sm text-on-surface rounded-xl px-3 py-2 w-full sm:w-auto focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical Only</option>
          <option value="high">High Only</option>
          <option value="medium">Medium Only</option>
          <option value="low">Low Only</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-on-surface-variant font-medium cursor-pointer w-full sm:w-auto">
          <input
            type="checkbox"
            checked={fixableOnly}
            onChange={(e) => setFixableOnly(e.target.checked)}
            className="w-4 h-4 rounded bg-surface-container-high border-none text-primary focus:ring-primary focus:ring-offset-surface-container-low"
          />
          Fixable only
        </label>
        <div className="sm:ml-auto bg-surface-container-high px-3 py-1 rounded-full text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          Showing {filtered.length} of {vulns.length}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-surface-container-low rounded-[2rem] p-12 text-center flex flex-col items-center justify-center border border-white/5">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">verified_user</span>
          </div>
          <p className="text-on-surface font-bold text-lg tracking-tight">
            {vulns.length === 0 ? 'No vulnerabilities detected.' : 'No vulnerabilities match.'}
          </p>
          <p className="text-on-surface-variant text-sm mt-1">Your image is secure against known threats.</p>
        </div>
      ) : (
        <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-white/5 shadow-xl overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-surface-container-high border-b border-white/5 text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">
                <th className="px-5 py-4 whitespace-nowrap">CVE ID</th>
                <th className="px-5 py-4">Severity</th>
                <th className="px-5 py-4">Package</th>
                <th className="px-5 py-4">Installed</th>
                <th className="px-5 py-4">Fixed</th>
                <th className="px-5 py-4 text-center">Fixable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((v, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-on-surface whitespace-nowrap">{v.cveId}</td>
                  <td className="px-5 py-4 whitespace-nowrap"><SeverityBadge severity={v.severity} /></td>
                  <td className="px-5 py-4 text-on-surface truncate max-w-[150px] sm:max-w-none">{v.packageName}</td>
                  <td className="px-5 py-4 font-mono text-xs text-on-surface-variant whitespace-nowrap">{v.installedVersion && v.installedVersion !== 'N/A' ? v.installedVersion : '—'}</td>
                  <td className="px-5 py-4 font-mono text-xs text-primary whitespace-nowrap">{v.fixedVersion && v.fixedVersion !== 'N/A' ? v.fixedVersion : '—'}</td>
                  <td className="px-5 py-4 text-center">
                    {v.fixable ? (
                      <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                        <span className="material-symbols-outlined text-sm">check</span>
                      </span>
                    ) : (
                      <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
