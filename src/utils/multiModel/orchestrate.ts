import OpenAI from 'openai';
import type { AnalysisResult, LogEntry, Severity } from '../../types';
import { SINGLE_MODEL_SYSTEM_PROMPT } from './prompts';
import { extractJsonObject } from './json';
import type { BaseAnalysisRaw, ExpertAnalysisRaw, ExpertName, MultiModelConfig, RouterResult } from './types';
import { routeDockerfile } from './router';
import { runExpertAnalysis } from './experts';
import { mergeExpertResults, normalizeSizeBytes } from './merge';

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function normalizeSeverity(input: unknown): Severity {
  const s = String(input ?? '').toLowerCase();
  if (s === 'critical' || s === 'high' || s === 'medium' || s === 'low') return s as Severity;
  return 'low';
}

function normalizeLogLevel(input: unknown): LogEntry['level'] {
  const s = String(input ?? 'info').toLowerCase();
  if (s === 'info' || s === 'success' || s === 'warning' || s === 'error') return s as LogEntry['level'];
  return 'info';
}

function normalizeVersionString(v: unknown): string {
  const s = v == null ? '' : String(v).trim();
  if (!s) return '';
  const lower = s.toLowerCase();
  if (lower === 'null' || lower === 'n/a' || lower === 'na') return '';
  return s;
}

function normalizeRawToAnalysis(dockerfile: string, raw: BaseAnalysisRaw): AnalysisResult {
  return {
    originalSize: normalizeSizeBytes(raw.originalSize),
    optimizedSize: normalizeSizeBytes(raw.optimizedSize),
    layerCountBefore: Number(raw.layerCountBefore ?? 0),
    layerCountAfter: Number(raw.layerCountAfter ?? 0),
    optimizationScore: clamp(Number(raw.optimizationScore ?? 0), 0, 100),
    issues: (Array.isArray(raw.issues) ? raw.issues : []).map((i) => ({
      title: i.title,
      severity: normalizeSeverity(i.severity),
      explanation: i.explanation,
      impact: i.impact,
      fix: i.fix,
    })),
    originalDockerfile: dockerfile,
    optimizedDockerfile: String(raw.optimizedDockerfile ?? dockerfile),
    changes: (Array.isArray(raw.changes) ? raw.changes : []).map((c) => ({
      description: c.description,
      benefit: c.benefit,
    })),
    layersBefore: (Array.isArray(raw.layersBefore) ? raw.layersBefore : []).map((l) => ({
      instruction: l.instruction,
      size: l.size,
    })),
    layersAfter: (Array.isArray(raw.layersAfter) ? raw.layersAfter : []).map((l) => ({
      instruction: l.instruction,
      size: l.size,
    })),
    vulnerabilitiesBefore: (Array.isArray(raw.vulnerabilities) ? raw.vulnerabilities : []).map((v) => ({
      cveId: v.cveId,
      severity: normalizeSeverity(v.severity),
      packageName: v.packageName,
      installedVersion: normalizeVersionString(v.installedVersion),
      fixedVersion: normalizeVersionString(v.fixedVersion),
      fixable: v.fixable,
    })),
    vulnerabilitiesAfter: [],
    logs: (Array.isArray(raw.logs) ? raw.logs : []).map((l) => ({
      timestamp: String(l.timestamp ?? new Date().toISOString()),
      level: normalizeLogLevel(l.level),
      message: String(l.message ?? ''),
    })),
  };
}

export async function analyzeSingleModel(params: {
  client: OpenAI;
  dockerfile: string;
  model: string;
}): Promise<AnalysisResult> {
  const { client, dockerfile, model } = params;

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SINGLE_MODEL_SYSTEM_PROMPT },
        { role: 'user', content: dockerfile },
      ],
    });

    const rawText = completion.choices?.[0]?.message?.content ?? '{}';
    const parsed = extractJsonObject(rawText) as BaseAnalysisRaw;
    const analysis = normalizeRawToAnalysis(dockerfile, parsed);
    return analysis;
  } catch (error) {
    return {
      originalSize: 0,
      optimizedSize: 0,
      layerCountBefore: 0,
      layerCountAfter: 0,
      optimizationScore: 0,
      issues: [],
      originalDockerfile: dockerfile,
      optimizedDockerfile: dockerfile,
      changes: [],
      layersBefore: [],
      layersAfter: [],
      vulnerabilitiesBefore: [],
      vulnerabilitiesAfter: [],
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'error',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      ],
      error: error instanceof Error ? error.message : 'Failed to analyze Dockerfile.',
    };
  }
}

export async function analyzeWithMultiModelExpertSystem(params: {
  client: OpenAI;
  dockerfile: string;
  models: MultiModelConfig;
  routerConfidenceThreshold?: number;
}): Promise<AnalysisResult> {
  const { client, dockerfile, models, routerConfidenceThreshold = 0.45 } = params;

  let router: RouterResult | null = null;
  try {
    router = await routeDockerfile(client, models.routerModel, dockerfile);
  } catch {
    router = {
      intent: 'mixed',
      experts: ['security', 'size', 'performance', 'best_practices'],
      routerConfidence: 0,
      reason: 'Router failed; using all experts.',
    };
  }

  const shouldRunAll = (router?.routerConfidence ?? 0) < routerConfidenceThreshold;
  const expertNames: ExpertName[] = shouldRunAll ? ['security', 'size', 'performance', 'best_practices'] : (router?.experts ?? []);

  const expertAnalyses: ExpertAnalysisRaw[] = [];
  for (const expertName of expertNames) {
    const model = models.expertModels[expertName] ?? models.routerModel;
    const analysis = await runExpertAnalysis(client, {
      model,
      expertName,
      dockerfile,
    });
    expertAnalyses.push(analysis);
  }

  try {
    const merged = mergeExpertResults({
      dockerfile,
      router: router!,
      expertAnalyses,
    });
    return merged;
  } catch {
    // Safety fallback: at least return a single model analysis.
    const fallbackModel = models.routerModel ?? models.expertModels.size ?? models.routerModel;
    return analyzeSingleModel({ client, dockerfile, model: fallbackModel });
  }
}

