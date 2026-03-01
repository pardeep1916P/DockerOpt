import React, { useState } from 'react';
import { Filter } from 'lucide-react';
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
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security</h2>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Critical" value={counts.critical} accent={counts.critical > 0 ? 'text-red-400' : 'text-gray-500'} />
        <MetricCard label="High" value={counts.high} accent={counts.high > 0 ? 'text-orange-400' : 'text-gray-500'} />
        <MetricCard label="Medium" value={counts.medium} accent={counts.medium > 0 ? 'text-yellow-400' : 'text-gray-500'} />
        <MetricCard label="Low" value={counts.low} accent={counts.low > 0 ? 'text-blue-400' : 'text-gray-500'} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-gray-500" />
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as Severity | 'all')}
          className="bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 rounded px-2 py-1 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
        >
          <option value="all">All severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={fixableOnly}
            onChange={(e) => setFixableOnly(e.target.checked)}
            className="rounded border-gray-400 dark:border-gray-600 bg-gray-200 dark:bg-gray-800 text-emerald-500 focus:ring-emerald-500/20"
          />
          Fixable only
        </label>
        <span className="text-xs text-gray-400 dark:text-gray-600 ml-auto">{filtered.length} of {vulns.length}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          {vulns.length === 0 ? 'No vulnerabilities detected.' : 'No vulnerabilities match the current filters.'}
        </div>
      ) : (
        <div className="border border-gray-300/50 dark:border-gray-700/50 rounded-lg overflow-hidden transition-colors">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-2.5 font-medium">CVE ID</th>
                <th className="text-left px-4 py-2.5 font-medium">Severity</th>
                <th className="text-left px-4 py-2.5 font-medium">Package</th>
                <th className="text-left px-4 py-2.5 font-medium">Installed</th>
                <th className="text-left px-4 py-2.5 font-medium">Fixed</th>
                <th className="text-center px-4 py-2.5 font-medium">Fixable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50 dark:divide-gray-800/50">
              {filtered.map((v, i) => (
                <tr key={i} className="hover:bg-gray-100/80 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-gray-600 dark:text-gray-300">{v.cveId}</td>
                  <td className="px-4 py-2.5"><SeverityBadge severity={v.severity} /></td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{v.packageName}</td>
                  <td className="px-4 py-2.5 font-mono text-gray-500">{v.installedVersion && v.installedVersion !== 'N/A' ? v.installedVersion : '—'}</td>
                  <td className="px-4 py-2.5 font-mono text-emerald-400/70">{v.fixedVersion && v.fixedVersion !== 'N/A' ? v.fixedVersion : '—'}</td>
                  <td className="px-4 py-2.5 text-center">
                    {v.fixable ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600">✗</span>
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
