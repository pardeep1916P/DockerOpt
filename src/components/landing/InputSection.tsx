import React, { useState, useCallback, useEffect } from 'react';
import { ClipboardList, Upload, Image, FileText, X as XIcon, Keyboard, Zap } from 'lucide-react';
import { InputMode } from '../../types';
import { SAMPLE_DOCKERFILE } from '../../constants/samples';
import { useTheme } from '../../context/ThemeContext';
import MonacoEditor from '@monaco-editor/react';

interface InputSectionProps {
  onAnalyze: (dockerfile: string) => void;
  loading: boolean;
  latency: number | null;
}

export const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, loading, latency }) => {
  const [mode, setMode] = useState<InputMode>('paste');
  const [code, setCode] = useState('');
  const [imageName, setImageName] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = React.useRef(0);
  const { isDark } = useTheme();

  const modes: { key: InputMode; label: string; icon: React.ReactNode }[] = [
    { key: 'paste', label: 'Paste Code', icon: <ClipboardList className="w-4 h-4" /> },
    { key: 'upload', label: 'Upload File', icon: <Upload className="w-4 h-4" /> },
    { key: 'image', label: 'Image Name', icon: <Image className="w-4 h-4" /> },
  ];

  const handleSubmit = () => {
    if (mode === 'paste' && code.trim()) {
      onAnalyze(code.trim());
    } else if (mode === 'upload' && code.trim()) {
      onAnalyze(code.trim());
    } else if (mode === 'image' && imageName.trim()) {
      onAnalyze(`FROM ${imageName.trim()}\n# Analyzing pre-built image: ${imageName.trim()}`);
    }
  };

  const loadSample = () => {
    setCode(SAMPLE_DOCKERFILE);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string || '';
        setCode(content);
        // Auto-switch to paste mode so the user sees the content in the editor
        setMode('paste');
      };
      reader.readAsText(file);
    }
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCode(ev.target?.result as string || '');
      };
      reader.readAsText(file);
    }
  };

  const hasInput =
    (mode === 'paste' && code.trim().length > 0) ||
    (mode === 'upload' && code.trim().length > 0) ||
    (mode === 'image' && imageName.trim().length > 0);

  // Line and character count for editor
  const lineCount = code ? code.split('\n').length : 0;
  const charCount = code.length;

  // Ctrl+Enter keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && hasInput && !loading) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasInput, loading, code, imageName, mode]);

  const clearInput = () => {
    setCode('');
    setImageName('');
    setFileName('');
  };

  return (
    <section
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      className={`w-full flex-1 min-h-0 bg-white dark:bg-bg-card border rounded-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-2xl overflow-hidden flex flex-col transition-all duration-300 animate-fade-in-up ${
        isDragging
          ? 'border-accent-purple border-2 bg-accent-purple/5'
          : 'border-gray-200/60 dark:border-border-subtle'
      }`}
    >
      {/* Tab Bar */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-border-subtle px-2 sm:px-4 pt-1 sm:pt-2 bg-gray-50 dark:bg-white/5">
        <div className="flex items-center">
          {modes.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 ${
                mode === m.key
                  ? 'text-gray-900 dark:text-white border-accent-purple'
                  : 'text-gray-500 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white border-transparent hover:border-gray-400 dark:hover:border-gray-600'
              }`}
            >
              {m.icon}
              <span className="hidden xs:inline sm:inline">{m.label}</span>
            </button>
          ))}
        </div>
        {/* Latency indicator */}
        <div className="flex items-center gap-1.5 pr-1 pb-1">
          {loading ? (
            <span className="flex items-center gap-1 text-[11px] text-yellow-500 font-mono animate-pulse">
              <Zap className="w-3 h-3" />
              <span className="hidden sm:inline">processing...</span>
            </span>
          ) : latency !== null ? (
            <span className={`flex items-center gap-1 text-[11px] font-mono ${
              latency < 5000 ? 'text-green-500' : latency < 15000 ? 'text-yellow-500' : 'text-red-400'
            }`}>
              <Zap className="w-3 h-3" />
              {latency < 1000 ? `${latency}ms` : `${(latency / 1000).toFixed(1)}s`}
            </span>
          ) : null}
        </div>
      </div>

      {/* Editor / Content Area */}
      <div className="w-full flex-1 min-h-0">
        {/* Paste Mode — Monaco Editor */}
        {mode === 'paste' && (
          <div className="relative group h-full">
            <div className="h-full bg-bg-editor">
              <MonacoEditor
                value={code}
                onChange={(val) => setCode(val ?? '')}
                language="dockerfile"
                theme={isDark ? 'vs-dark' : 'light'}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbers: 'on',
                  renderLineHighlight: 'none',
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  automaticLayout: true,
                  padding: { top: 16 },
                  fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                  lineHeight: 24,
                }}
              />
            </div>
            {/* Placeholder overlay when empty */}
            {!code && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-gray-400 dark:text-gray-500 text-sm font-mono">Paste your Dockerfile here...</p>
                  <p className="text-gray-400/60 dark:text-gray-600 text-xs mt-2">or drag & drop a file anywhere</p>
                </div>
              </div>
            )}
            {/* Load sample link */}
            <button
              onClick={loadSample}
              className="absolute bottom-2 sm:bottom-3 left-4 sm:left-16 flex items-center gap-1.5 text-xs text-text-secondary hover:text-gray-900 dark:hover:text-white transition-colors sm:opacity-0 sm:group-hover:opacity-100"
            >
              <FileText className="w-3 h-3" />
              Load sample Dockerfile
            </button>
            {/* Clear button */}
            {code && (
              <button
                onClick={clearInput}
                className="absolute top-2 right-2 p-1 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                title="Clear editor"
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Upload Mode */}
        {mode === 'upload' && (
          <div
            className="h-full flex flex-col items-center justify-center cursor-pointer bg-white hover:bg-gray-50 dark:bg-transparent dark:hover:bg-white/5 transition-colors"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".dockerfile,.txt,Dockerfile"
              onChange={handleFileInput}
              className="hidden"
            />
            <Upload className={`w-10 h-10 mb-4 ${isDragging ? 'text-accent-purple animate-bounce' : 'text-gray-400 dark:text-text-secondary'}`} />
            {fileName ? (
              <p className="text-sm text-accent-purple font-mono">{fileName}</p>
            ) : isDragging ? (
              <p className="text-sm text-accent-purple font-medium">Drop your file here</p>
            ) : (
              <>
                <p className="text-sm text-gray-500 dark:text-text-secondary">
                  Drop your Dockerfile here or click to browse
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">.dockerfile, .txt, or Dockerfile</p>
              </>
            )}
          </div>
        )}

        {/* Image Mode */}
        {mode === 'image' && (
          <div className="h-full flex flex-col items-center justify-center px-4 sm:px-12 bg-white dark:bg-transparent">
            <Image className="w-10 h-10 text-gray-400 dark:text-text-secondary mb-4" />
            <input
              type="text"
              value={imageName}
              onChange={(e) => setImageName(e.target.value)}
              placeholder="e.g. node:18, python:3.11-slim, nginx:alpine"
              className="w-full max-w-md bg-gray-50 dark:bg-bg-editor border border-gray-200 dark:border-border-subtle rounded-md px-4 py-3 text-sm font-mono text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/20 shadow-sm"
            />
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">Enter a Docker image name to analyze</p>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-gray-50 dark:bg-bg-card p-2 sm:p-4 border-t border-gray-100 dark:border-border-subtle flex justify-between items-center">
        {/* Line/char count */}
        <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500 font-mono">
          {mode === 'paste' && code ? (
            <>
              <span>{lineCount} line{lineCount !== 1 ? 's' : ''}</span>
              <span className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
              <span>{charCount} char{charCount !== 1 ? 's' : ''}</span>
            </>
          ) : (
            <span className="flex items-center gap-1 text-gray-400 dark:text-gray-600">
              <Keyboard className="w-3 h-3" />
              <span className="hidden sm:inline">Ctrl+Enter to analyze</span>
            </span>
          )}
        </div>
        <div className="relative group/btn">
          <button
            onClick={handleSubmit}
            disabled={loading || !hasInput}
            className={`bg-gray-900 hover:bg-gray-800 dark:bg-btn-bg dark:hover:bg-btn-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium text-sm transition-all shadow-md dark:shadow-none dark:border dark:border-white/10 ${
              hasInput && !loading ? 'animate-pulse-subtle' : ''
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </span>
            ) : (
              'Analyze & Optimize'
            )}
          </button>
          {/* Tooltip when disabled */}
          {!hasInput && !loading && (
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none shadow-lg">
              {mode === 'paste' ? 'Paste or drop a Dockerfile first' : mode === 'upload' ? 'Upload a Dockerfile first' : 'Enter an image name first'}
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
