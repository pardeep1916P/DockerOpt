import React from 'react';
import { Copy, Check, ArrowRight } from 'lucide-react';
import { AnalysisResult } from '../../../types';
import { useTheme } from '../../../context/ThemeContext';
import MonacoEditor from '@monaco-editor/react';

interface OptimizationTabProps {
  data: AnalysisResult;
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded bg-gray-200 dark:bg-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors z-10"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />}
    </button>
  );
};

export const OptimizationTab: React.FC<OptimizationTabProps> = ({ data }) => {
  const { isDark } = useTheme();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Optimization</h2>

      {/* Split Editor View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Original */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Original</span>
            <span className="text-xs text-gray-400 dark:text-gray-600 font-mono">{data.originalDockerfile.split('\n').length} lines</span>
          </div>
          <div className="relative h-[400px] rounded-lg overflow-hidden border border-gray-300/50 dark:border-gray-700/50">
            <CopyButton text={data.originalDockerfile} />
            <MonacoEditor
              value={data.originalDockerfile}
              language="dockerfile"
              theme={isDark ? 'vs-dark' : 'light'}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 12,
                lineNumbers: 'on',
                renderLineHighlight: 'none',
                automaticLayout: true,
                padding: { top: 8 },
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              }}
            />
          </div>
        </div>

        {/* Optimized */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400 uppercase tracking-wider font-medium flex items-center gap-1">
              <ArrowRight className="w-3 h-3" /> Optimized
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-600 font-mono">{data.optimizedDockerfile.split('\n').length} lines</span>
          </div>
          <div className="relative h-[400px] rounded-lg overflow-hidden border border-emerald-500/20">
            <CopyButton text={data.optimizedDockerfile} />
            <MonacoEditor
              value={data.optimizedDockerfile}
              language="dockerfile"
              theme={isDark ? 'vs-dark' : 'light'}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 12,
                lineNumbers: 'on',
                renderLineHighlight: 'none',
                automaticLayout: true,
                padding: { top: 8 },
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              }}
            />
          </div>
        </div>
      </div>

      {/* Changes Explanation */}
      {data.changes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Changes Applied</h3>
          <div className="space-y-2">
            {data.changes.map((change, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-100/80 dark:bg-gray-800/40 border border-gray-300/40 dark:border-gray-700/40 rounded-lg p-3 transition-colors">
                <span className="text-emerald-400 font-mono text-xs mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-200">{change.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{change.benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
