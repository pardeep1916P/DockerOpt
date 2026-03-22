import React, { useState, useRef, useEffect } from 'react';
import { Github, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const Header: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <header className="w-full max-w-6xl mx-auto px-3 sm:px-4 flex justify-between items-center py-3 sm:py-3">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <span className="inline-flex items-center shrink-0">
          <img src="/docker.svg" alt="Docker" className="w-[32px] h-[32px] sm:w-[38px] sm:h-[38px] object-contain" />
        </span>
        <span className="text-gray-900 dark:text-white text-xl sm:text-2xl md:text-4xl font-['Inter'] font-black italic tracking-tighter truncate pr-1 sm:pr-2">DockerOpt</span>
      </div>

      {/* Desktop: theme toggle + GitHub (no menu icon) */}
      <div className="hidden sm:flex items-center gap-3 text-text-secondary shrink-0">
        <button
          onClick={toggleTheme}
          className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700/50 dark:hover:bg-gray-700 rounded-full px-3 py-1.5 flex items-center gap-2 transition-colors"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <Sun className={`w-4 h-4 ${isDark ? 'text-yellow-300' : 'text-gray-400'}`} />
          <Moon className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-blue-300'}`} />
        </button>
        <a
          href="https://github.com/pardeep1916P/DockerImageOptimizer"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors p-1"
        >
          <Github className="w-5 h-5" />
        </a>
      </div>

      {/* Mobile: hamburger menu */}
      <div className="relative sm:hidden" ref={menuRef}>
        <button
          aria-label="Menu"
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-text-secondary hover:text-white transition-colors p-1"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 bg-bg-card border border-border-subtle rounded-lg shadow-xl py-2 px-3 flex flex-col gap-3 z-50 min-w-[160px] animate-in fade-in slide-in-from-top-2">
            <button
              onClick={() => { toggleTheme(); setMenuOpen(false); }}
              className="flex items-center gap-3 text-text-secondary hover:text-white transition-colors py-1"
            >
              {isDark ? <Sun className="w-4 h-4 text-yellow-300" /> : <Moon className="w-4 h-4 text-blue-300" />}
              <span className="text-sm">{isDark ? 'Light mode' : 'Dark mode'}</span>
            </button>
            <a
              href="https://github.com/pardeep1916P/DockerImageOptimizer"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 text-text-secondary hover:text-white transition-colors py-1"
            >
              <Github className="w-4 h-4" />
              <span className="text-sm">GitHub</span>
            </a>
          </div>
        )}
      </div>
    </header>
  );
};
