// ── Input types ──────────────────────────────────────────────
export type InputMode = 'paste' | 'upload' | 'image';

// ── Severity ─────────────────────────────────────────────────
export type Severity = 'critical' | 'high' | 'medium' | 'low';

// ── Issue ────────────────────────────────────────────────────
export interface Issue {
  title: string;
  severity: Severity;
  explanation: string;
  impact: string;
  fix: string;
}

// ── Vulnerability ────────────────────────────────────────────
export interface Vulnerability {
  cveId: string;
  severity: Severity;
  packageName: string;
  installedVersion: string;
  fixedVersion: string;
  fixable: boolean;
}

// ── Layer info ───────────────────────────────────────────────
export interface LayerInfo {
  instruction: string;
  size: number; // bytes
}

// ── Optimization change ──────────────────────────────────────
export interface OptimizationChange {
  description: string;
  benefit: string;
}

// ── Log entry ────────────────────────────────────────────────
export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

// ── Full Analysis Result ─────────────────────────────────────
export interface AnalysisResult {
  // Overview metrics
  originalSize: number;       // bytes
  optimizedSize: number;      // bytes
  layerCountBefore: number;
  layerCountAfter: number;
  optimizationScore: number;  // 0–100

  // Issues
  issues: Issue[];

  // Optimization
  originalDockerfile: string;
  optimizedDockerfile: string;
  changes: OptimizationChange[];

  // Layers
  layersBefore: LayerInfo[];
  layersAfter: LayerInfo[];

  // Security
  vulnerabilitiesBefore: Vulnerability[];
  vulnerabilitiesAfter: Vulnerability[];

  // Logs
  logs: LogEntry[];

  // Error
  error?: string;
}

// ── Dashboard tab ────────────────────────────────────────────
export type DashboardTab =
  | 'overview'
  | 'issues'
  | 'optimization'
  | 'size'
  | 'security'
  | 'logs';

// ── Legacy compat (cache) ────────────────────────────────────
export interface AnalysisCache {
  [key: string]: {
    timestamp: number;
    analysis: AnalysisResult;
  };
}