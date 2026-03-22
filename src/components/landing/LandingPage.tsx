import React from 'react';
import { Header } from './Header';
import { InputSection } from './InputSection';

interface LandingPageProps {
  onAnalyze: (dockerfile: string) => void;
  loading: boolean;
  latency: number | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onAnalyze, loading, latency }) => (
  <div className="h-[100dvh] bg-gray-50 dark:bg-bg-main text-gray-900 dark:text-text-primary font-sans flex flex-col items-center overflow-hidden">
    <Header />

    {/* Main Content */}
    <main className="w-full max-w-5xl px-3 sm:px-4 mt-2 sm:mt-4 flex-1 flex flex-col items-center min-h-0">
      {/* Hero Subtitle */}
      <section className="w-full mb-2 sm:mb-4 animate-fade-in">
        <p className="text-sm sm:text-base leading-snug text-gray-500 dark:text-[#b0b3b8]">
          Analyze, optimize, and secure your Docker images with our advanced developer tool.
        </p>
      </section>

      {/* Editor Interface — fills remaining space */}
      <InputSection onAnalyze={onAnalyze} loading={loading} latency={latency} />
    </main>

    {/* Footer */}
    <footer className="w-full max-w-5xl px-3 sm:px-4 py-2 sm:py-4 flex flex-col items-center shrink-0">
      <div className="w-full h-px bg-gray-300 dark:bg-border-subtle mb-2 sm:mb-3" />
      <p className="text-gray-500 dark:text-text-secondary text-xs sm:text-sm font-medium tracking-wide">
        Built for developers &middot; Minimal &middot; Themeable
      </p>
    </footer>
  </div>
);
