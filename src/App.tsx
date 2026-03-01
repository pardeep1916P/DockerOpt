import { useState } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { analyzeDockerfile } from './utils/openai';
import { AnalysisResult } from './types';
import { useTheme } from './context/ThemeContext';
import toast, { Toaster } from 'react-hot-toast';

function App() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const { isDark } = useTheme();

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
        const score = result.optimizationScore ?? 0;
        toast.success(`Analysis complete! Score: ${score}/100 (${(elapsed / 1000).toFixed(1)}s)`, {
          duration: 4000,
          icon: score >= 80 ? '🟢' : score >= 50 ? '🟡' : '🔴',
        });
      }
    } catch {
      setLatency(Math.round(performance.now() - start));
      toast.error('Failed to analyze Dockerfile');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setAnalysis(null);
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: isDark ? '#1f2937' : '#ffffff',
            color: isDark ? '#f3f4f6' : '#1f2937',
            border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
            fontSize: '13px',
          },
        }}
      />
      {analysis && !loading ? (
        <Dashboard data={analysis} onBack={handleBack} />
      ) : (
        <LandingPage onAnalyze={handleAnalyze} loading={loading} latency={latency} />
      )}
    </>
  );
}

export default App;