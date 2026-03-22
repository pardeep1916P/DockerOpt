import { useState } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { analyzeDockerfile } from './utils/openai';
import { AnalysisResult } from './types';
import toast, { Toaster } from 'react-hot-toast';

function App() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);

  const handleAnalyze = async (dockerfile: string) => {
    setLoading(true);
    setLatency(null);
    const start = performance.now();
    try {
      const result = await analyzeDockerfile(dockerfile);
      const elapsed = Math.round(performance.now() - start);
      setLatency(elapsed);
      setAnalysis(result);
      if (result.error) {
        toast.error(result.error);
      } else {
        const score = Math.round(result.optimizationScore ?? 0);
        toast.custom((t) => (
          <div
            className={`${
              t.visible ? 'animate-fade-in-up' : 'opacity-0 scale-95'
            } max-w-sm w-full bg-white dark:bg-surface-container-high/90 dark:backdrop-blur-xl shadow-2xl dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] rounded-2xl pointer-events-auto flex items-center gap-4 p-4 border border-gray-100 dark:border-white/5 transition-all duration-300`}
          >
            <div className="relative flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-surface-container-highest">
              {score >= 80 ? (
                <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(105,246,184,0.6)]" />
              ) : score >= 50 ? (
                <div className="w-2.5 h-2.5 rounded-full bg-tertiary-dim shadow-[0_0_10px_rgba(231,148,0,0.6)]" />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-error-dim shadow-[0_0_10px_rgba(215,56,59,0.6)]" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white font-['Inter']">
                Analysis complete!
              </p>
              <p className="text-xs text-gray-500 dark:text-on-surface-variant font-['Inter'] mt-0.5">
                Score: {score}/100 <span className="opacity-50">({(elapsed / 1000).toFixed(1)}s)</span>
              </p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ), { duration: 4000 });
      }
    } catch {
      setLatency(Math.round(performance.now() - start));
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-fade-in-up' : 'opacity-0 scale-95'
          } max-w-sm w-full bg-white dark:bg-surface-container-high/90 dark:backdrop-blur-xl shadow-2xl dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] rounded-2xl pointer-events-auto flex items-center gap-4 p-4 border border-gray-100 dark:border-white/5 transition-all duration-300`}
        >
          <div className="relative flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-surface-container-highest">
            <div className="w-2.5 h-2.5 rounded-full bg-error-dim shadow-[0_0_10px_rgba(215,56,59,0.6)]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white font-['Inter']">
              Analysis failed!
            </p>
            <p className="text-xs text-gray-500 dark:text-on-surface-variant font-['Inter'] mt-0.5">
              Could not analyze the Dockerfile.
            </p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ), { id: 'error-toast', duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setAnalysis(null);
  };

  return (
    <>
      <Toaster position="top-center" />
      {analysis && !loading ? (
        <Dashboard data={analysis} onBack={handleBack} />
      ) : (
        <LandingPage onAnalyze={handleAnalyze} loading={loading} latency={latency} />
      )}
    </>
  );
}

export default App;