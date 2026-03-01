import React, { useEffect, useRef } from 'react';
import { AnalysisResult, LogLevel } from '../../../types';

interface LogsTabProps {
  data: AnalysisResult;
}

const levelColors: Record<LogLevel, string> = {
  info: 'text-blue-400',
  success: 'text-emerald-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
};

const levelLabels: Record<LogLevel, string> = {
  info: 'INFO',
  success: ' OK ',
  warning: 'WARN',
  error: ' ERR',
};

export const LogsTab: React.FC<LogsTabProps> = ({ data }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [data.logs]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Logs</h2>

      <div
        ref={scrollRef}
        className="bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4 h-[500px] overflow-y-auto font-mono text-xs leading-relaxed transition-colors"
      >
        {data.logs.length === 0 ? (
          <div className="text-gray-400 dark:text-gray-600 text-center py-12">No logs available</div>
        ) : (
          data.logs.map((log, i) => {
            const time = new Date(log.timestamp).toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div key={i} className="flex gap-3 hover:bg-gray-200/50 dark:hover:bg-gray-900/50 px-2 py-0.5 rounded">
                <span className="text-gray-400 dark:text-gray-600 shrink-0">{time}</span>
                <span className={`shrink-0 ${levelColors[log.level]}`}>
                  [{levelLabels[log.level]}]
                </span>
                <span className="text-gray-600 dark:text-gray-300">{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
