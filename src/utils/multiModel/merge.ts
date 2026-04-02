import type { AnalysisResult, Issue, LayerInfo, OptimizationChange, Severity, Vulnerability, LogEntry } from '../../types';
import type { ExpertAnalysisRaw, ExpertName, RouterResult } from './types';
import type { StaticDockerfileAnalysis } from './staticAnalysis';

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function normalizeSeverity(input: unknown): Severity {
  const s = String(input ?? '').toLowerCase();
  if (s === 'critical' || s === 'high' || s === 'medium' || s === 'low') return s as Severity;
  return 'low';
}

function normalizeIssue(input: unknown): Issue {
  const obj = (typeof input === 'object' && input ? input : {}) as Record<string, unknown>;
  return {
    title: String(obj.title ?? ''),
    severity: normalizeSeverity(obj.severity),
    explanation: String(obj.explanation ?? ''),
    impact: String(obj.impact ?? ''),
    fix: String(obj.fix ?? ''),
  };
}

function normalizeLayer(input: unknown): LayerInfo {
  const obj = (typeof input === 'object' && input ? input : {}) as Record<string, unknown>;
  return {
    instruction: String(obj.instruction ?? ''),
    size: Number(obj.size ?? 0),
  };
}

function normalizeOptimizationChange(input: unknown): OptimizationChange {
  const obj = (typeof input === 'object' && input ? input : {}) as Record<string, unknown>;
  return {
    description: String(obj.description ?? ''),
    benefit: String(obj.benefit ?? ''),
  };
}

function normalizeVersionString(v: unknown): string {
  const s = String(v ?? '').trim();
  if (!s) return '';
  const lower = s.toLowerCase();
  if (lower === 'null' || lower === 'n/a' || lower === 'na') return '';
  return s;
}

function normalizeVulnerability(input: unknown): Vulnerability {
  const obj = (typeof input === 'object' && input ? input : {}) as Record<string, unknown>;
  return {
    cveId: String(obj.cveId ?? 'N/A'),
    severity: normalizeSeverity(obj.severity),
    packageName: String(obj.packageName ?? ''),
    installedVersion: normalizeVersionString(obj.installedVersion),
    fixedVersion: normalizeVersionString(obj.fixedVersion),
    fixable: Boolean(obj.fixable),
  };
}

function normalizeLog(input: unknown): LogEntry {
  const obj = (typeof input === 'object' && input ? input : {}) as Record<string, unknown>;
  const levelRaw = String(obj.level ?? 'info') as LogEntry['level'];
  const level: LogEntry['level'] =
    levelRaw === 'info' || levelRaw === 'success' || levelRaw === 'warning' || levelRaw === 'error' ? levelRaw : 'info';

  return {
    timestamp: String(obj.timestamp ?? new Date().toISOString()),
    level,
    message: String(obj.message ?? ''),
  };
}

function weightedAverageNumber(values: number[], weights: number[]): number {
  const totalW = weights.reduce((a, b) => a + b, 0);
  if (totalW <= 0) return values[0] ?? 0;
  const sum = values.reduce((acc, v, i) => acc + v * (weights[i] ?? 0), 0);
  return sum / totalW;
}

/**
 * Models inconsistently return sizes in bytes vs megabytes.
 * If a value is suspiciously small (< 50 000) it is almost certainly in MB;
 * convert it to bytes so the weighted average stays in a single unit system.
 */
export function normalizeSizeBytes(raw: unknown): number {
  const n = Number(raw ?? 0);
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > 0 && n < 50_000) return Math.round(n * 1024 * 1024);
  return Math.round(n);
}

export function mergeExpertResults(params: {
  dockerfile: string;
  router: RouterResult;
  expertAnalyses: ExpertAnalysisRaw[];
  staticAnalysis?: StaticDockerfileAnalysis;
  synthesizerOverride?: { originalSize: number; optimizedSize: number; optimizationScore: number } | null;
}): AnalysisResult {
  const { dockerfile, router, expertAnalyses, staticAnalysis, synthesizerOverride } = params;

  type NormalizedExpert = { expertName: ExpertName; expertConfidence: number; raw: ExpertAnalysisRaw };
  const experts = expertAnalyses.slice();
  const confidences = experts.map((e) => (Number(e?.expertConfidence) || 0) as number);

  const normalizedExperts: NormalizedExpert[] = experts.map((e, idx) => ({
    expertName: (e.expertName ?? router.experts[idx] ?? 'size') as ExpertName,
    expertConfidence: clamp(confidences[idx] ?? 0.5, 0, 1),
    raw: e,
  }));

  const winner = normalizedExperts.reduce<NormalizedExpert | undefined>((best, cur) => {
    if (!best) return cur;
    return cur.expertConfidence > best.expertConfidence ? cur : best;
  }, undefined);

  const weights = normalizedExperts.map((e) => e.expertConfidence);

  /* ── Size metrics: use synthesizer if available, else weighted average ── */
  let originalSize: number;
  let optimizedSize: number;
  let optimizationScore: number;

  if (synthesizerOverride) {
    originalSize = normalizeSizeBytes(synthesizerOverride.originalSize);
    optimizedSize = normalizeSizeBytes(synthesizerOverride.optimizedSize);
    optimizationScore = clamp(Number(synthesizerOverride.optimizationScore ?? 0), 0, 100);
  } else {
    originalSize = Math.round(
      weightedAverageNumber(
        normalizedExperts.map((e) => normalizeSizeBytes(e.raw.originalSize)),
        weights,
      ),
    );
    optimizedSize = Math.round(
      weightedAverageNumber(
        normalizedExperts.map((e) => normalizeSizeBytes(e.raw.optimizedSize)),
        weights,
      ),
    );
    optimizationScore = clamp(
      weightedAverageNumber(
        normalizedExperts.map((e) => Number(e.raw.optimizationScore ?? 0)),
        weights,
      ),
      0,
      100,
    );
  }

  /* ── Layer counts: prefer static analysis (exact) over LLM estimates ── */
  let layerCountBefore: number;
  let layerCountAfter: number;

  if (staticAnalysis) {
    layerCountBefore = staticAnalysis.layerCount;
    layerCountAfter = Math.round(
      weightedAverageNumber(
        normalizedExperts.map((e) => Number(e.raw.layerCountAfter ?? 0)),
        weights,
      ),
    );
  } else {
    layerCountBefore = Math.round(
      weightedAverageNumber(
        normalizedExperts.map((e) => Number(e.raw.layerCountBefore ?? 0)),
        weights,
      ),
    );
    layerCountAfter = Math.round(
      weightedAverageNumber(
        normalizedExperts.map((e) => Number(e.raw.layerCountAfter ?? 0)),
        weights,
      ),
    );
  }

  // Issues: merge by title, prefer highest-confidence expert entry.
  const issuesByTitle = new Map<string, { issue: Issue; w: number }>();
  for (const e of normalizedExperts) {
    const list = Array.isArray(e.raw.issues) ? e.raw.issues : [];
    for (const i of list) {
      const issue = normalizeIssue(i);
      if (!issue.title) continue;
      const prev = issuesByTitle.get(issue.title);
      if (!prev || e.expertConfidence > prev.w) {
        issuesByTitle.set(issue.title, { issue, w: e.expertConfidence });
      } else if (prev && SEVERITY_ORDER[issue.severity] < SEVERITY_ORDER[prev.issue.severity]) {
        issuesByTitle.set(issue.title, { issue: { ...prev.issue, severity: issue.severity }, w: prev.w });
      }
    }
  }

  // Vulnerabilities: merge by CVE ID.
  const vulnsByCve = new Map<string, { vuln: Vulnerability; w: number }>();
  for (const e of normalizedExperts) {
    const list = Array.isArray(e.raw.vulnerabilities) ? e.raw.vulnerabilities : [];
    for (const v of list) {
      const vuln = normalizeVulnerability(v);
      const key = String(vuln.cveId ?? '').trim();
      if (!key || key === 'N/A') continue;
      const prev = vulnsByCve.get(key);
      if (!prev || e.expertConfidence > prev.w) {
        vulnsByCve.set(key, { vuln, w: e.expertConfidence });
      }
    }
  }

  const winnerRaw = winner?.raw ?? {};
  const optimizedDockerfile = String(winnerRaw.optimizedDockerfile ?? dockerfile);
  const changes = Array.isArray(winnerRaw.changes) ? winnerRaw.changes.map(normalizeOptimizationChange) : [];
  const layersBefore = Array.isArray(winnerRaw.layersBefore) ? winnerRaw.layersBefore.map(normalizeLayer) : [];
  const layersAfter = Array.isArray(winnerRaw.layersAfter) ? winnerRaw.layersAfter.map(normalizeLayer) : [];

  const logsRouter: LogEntry[] = [
    {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Classifier: intent=${router.intent} confidence=${(router.routerConfidence * 100).toFixed(1)}% (static)`,
    },
    {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Experts called: ${normalizedExperts.map((e) => e.expertName).join(', ')}`,
    },
  ];

  if (staticAnalysis) {
    logsRouter.push({
      timestamp: new Date().toISOString(),
      level: 'success',
      message: `Static analysis: ${staticAnalysis.layerCount} layers, base=${staticAnalysis.finalStage.baseImage}, multi-stage=${staticAnalysis.hasMultiStage}`,
    });
  }

  if (synthesizerOverride) {
    logsRouter.push({
      timestamp: new Date().toISOString(),
      level: 'warning',
      message: 'Synthesizer triggered: expert size estimates diverged significantly — reconciled.',
    });
  }

  const sortedByConfidence = [...normalizedExperts].sort((a, b) => b.expertConfidence - a.expertConfidence);
  const expertLogs = sortedByConfidence.flatMap((e) => (Array.isArray(e.raw.logs) ? e.raw.logs.map(normalizeLog) : []));
  const logs = [...logsRouter, ...expertLogs].slice(0, 30);

  const issues: Issue[] = [...issuesByTitle.values()].map((x) => x.issue).slice(0, 20);
  const vulnerabilitiesBefore: Vulnerability[] = [...vulnsByCve.values()].map((x) => x.vuln).slice(0, 20);

  return {
    originalSize,
    optimizedSize,
    layerCountBefore,
    layerCountAfter,
    optimizationScore,
    issues,
    originalDockerfile: dockerfile,
    optimizedDockerfile,
    changes,
    layersBefore,
    layersAfter,
    vulnerabilitiesBefore,
    vulnerabilitiesAfter: [],
    logs,
  };
}
