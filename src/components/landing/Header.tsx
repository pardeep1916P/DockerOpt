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
        {/* Official Docker SVG logo */}
        <span className="inline-flex items-center shrink-0">
          <svg viewBox="0 0 24 24" width="32" height="32" xmlns="http://www.w3.org/2000/svg" aria-label="Docker" className="sm:w-[38px] sm:h-[38px]">
            <title>Docker</title>
            <path fill="#2496ED" d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z"/>
          </svg>
        </span>
        <span className="text-gray-900 dark:text-white text-xl sm:text-2xl md:text-4xl font-mono font-semibold tracking-tight truncate">DockerOpt</span>
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
