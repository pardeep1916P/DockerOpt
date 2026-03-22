import React from 'react';
import { Copy, Check, ArrowRight, Sparkles } from 'lucide-react';
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
      className="absolute top-3 right-3 p-2 rounded-xl bg-surface-container-highest hover:bg-white/10 transition-colors z-10 border border-white/5 shadow-lg shadow-black/20"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-on-surface-variant" />}
    </button>
  );
};

export const OptimizationTab: React.FC<OptimizationTabProps> = ({ data }) => {
  const { isDark } = useTheme();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold tracking-tight text-on-surface flex items-center gap-2">
          <Sparkles className="text-secondary w-5 h-5" />
          Dockerfile Optimization
        </h2>
      </div>

      {/* Split Editor View */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Original */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] text-error-dim bg-error-dim/10 px-3 py-1 rounded-full uppercase tracking-widest font-bold">Original</span>
            <span className="text-xs text-on-surface-variant font-mono">{data.originalDockerfile.split('\n').length} lines</span>
          </div>
          <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl bg-surface-container-lowest border border-white/5">
            <CopyButton text={data.originalDockerfile} />
            <MonacoEditor
              value={data.originalDockerfile}
              language="dockerfile"
              theme={isDark ? 'vs-dark' : 'light'}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                lineNumbers: 'on',
                renderLineHighlight: 'none',
                automaticLayout: true,
                padding: { top: 16 },
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              }}
            />
          </div>
        </div>

        {/* Optimized */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest font-bold flex items-center gap-1.5">
              <ArrowRight className="w-3 h-3" /> Optimized
            </span>
            <span className="text-xs text-on-surface-variant font-mono">{data.optimizedDockerfile.split('\n').length} lines</span>
          </div>
          <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(105,246,184,0.05)] bg-surface-container-lowest border border-primary/20">
            <CopyButton text={data.optimizedDockerfile} />
            <MonacoEditor
              value={data.optimizedDockerfile}
              language="dockerfile"
              theme={isDark ? 'vs-dark' : 'light'}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                lineNumbers: 'on',
                renderLineHighlight: 'none',
                automaticLayout: true,
                padding: { top: 16 },
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              }}
            />
          </div>
        </div>
      </div>

      {/* Changes Explanation */}
      {data.changes.length > 0 && (
        <div className="bg-surface-container-low rounded-[2rem] overflow-hidden border border-white/5 p-6 lg:p-8 space-y-6">
          <h3 className="font-bold text-lg tracking-tight text-on-surface flex items-center gap-2">
            <Sparkles className="text-primary w-5 h-5" />
            Applied Improvements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.changes.map((change, i) => (
              <div key={i} className="flex items-start gap-4 bg-surface-container-high rounded-2xl p-5 hover:bg-white/[0.02] transition-colors border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors"></div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-mono text-xs font-bold shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="flex-1 space-y-1 mt-0.5">
                  <p className="text-sm font-bold text-on-surface leading-tight">{change.description}</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed font-medium">{change.benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
