import OpenAI from 'openai';
import { AnalysisResult, AnalysisCache } from '../types';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const cache: AnalysisCache = {};

let openai: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openai) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Missing VITE_OPENAI_API_KEY. Create a .env file in the project root with:\nVITE_OPENAI_API_KEY=your-api-key-here'
      );
    }
    openai = new OpenAI({
      apiKey,
      // In dev, route through Vite proxy so requests/responses are logged in the terminal
      baseURL: import.meta.env.DEV
        ? `${window.location.origin}/api`
        : (import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1'),
      dangerouslyAllowBrowser: true,
    });
  }
  return openai;
}

const SYSTEM_PROMPT = `You are a Docker image optimization expert. Analyze the provided Dockerfile and return a comprehensive JSON analysis.

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "originalSize": <estimated original image size in bytes>,
  "optimizedSize": <estimated optimized image size in bytes>,
  "layerCountBefore": <number of layers in original>,
  "layerCountAfter": <number of layers in optimized>,
  "optimizationScore": <0-100 score>,
  "issues": [
    {
      "title": "<issue title>",
      "severity": "<critical|high|medium|low>",
      "explanation": "<what the issue is>",
      "impact": "<why it matters>",
      "fix": "<how to fix it>"
    }
  ],
  "optimizedDockerfile": "<full optimized Dockerfile text>",
  "changes": [
    {
      "description": "<what was changed>",
      "benefit": "<estimated benefit>"
    }
  ],
  "layersBefore": [
    { "instruction": "<docker instruction>", "size": <bytes> }
  ],
  "layersAfter": [
    { "instruction": "<docker instruction>", "size": <bytes> }
  ],
  "vulnerabilities": [
    {
      "cveId": "CVE-2024-3094",
      "severity": "critical",
      "packageName": "xz-utils",
      "installedVersion": "5.4.1",
      "fixedVersion": "5.6.2",
      "fixable": true
    }
  ],
  "logs": [
    { "timestamp": "<ISO time>", "level": "<info|success|warning|error>", "message": "<log message>" }
  ]
}

Be thorough. Estimate realistic sizes. Identify real optimization opportunities. Generate at least 3-5 issues and 3-5 vulnerabilities for typical Dockerfiles.

CRITICAL for vulnerabilities:
- "installedVersion" MUST be a real version number like "5.4.1", "7.88.1", "18.19.0" — NEVER use "N/A", null, or empty string.
- "fixedVersion" MUST be a real version number like "5.6.2", "8.4.0" when fixable is true. Use null ONLY when fixable is false.
- Estimate realistic versions based on the base image and the packages being installed.
- The example in the schema above shows the exact format to follow.`;

export const analyzeDockerfile = async (dockerfile: string): Promise<AnalysisResult> => {
  const cacheKey = dockerfile.trim();
  const cachedResult = cache[cacheKey];

  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
    return cachedResult.analysis;
  }

  try {
    const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-5.2';
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: dockerfile },
    ];

    const completion = await getClient().chat.completions.create({
      messages,
      model,
    });

    const raw = completion.choices[0].message.content || '{}';
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
    const result = JSON.parse(cleaned);

    const analysis: AnalysisResult = {
      originalSize: result.originalSize ?? 0,
      optimizedSize: result.optimizedSize ?? 0,
      layerCountBefore: result.layerCountBefore ?? 0,
      layerCountAfter: result.layerCountAfter ?? 0,
      optimizationScore: Math.min(100, Math.max(0, result.optimizationScore ?? 0)),
      issues: (result.issues ?? []).map((i: Record<string, string>) => ({
        title: i.title ?? '',
        severity: i.severity ?? 'low',
        explanation: i.explanation ?? '',
        impact: i.impact ?? '',
        fix: i.fix ?? '',
      })),
      originalDockerfile: dockerfile,
      optimizedDockerfile: result.optimizedDockerfile ?? dockerfile,
      changes: (result.changes ?? []).map((c: Record<string, string>) => ({
        description: c.description ?? '',
        benefit: c.benefit ?? '',
      })),
      layersBefore: (result.layersBefore ?? []).map((l: Record<string, unknown>) => ({
        instruction: String(l.instruction ?? ''),
        size: Number(l.size ?? 0),
      })),
      layersAfter: (result.layersAfter ?? []).map((l: Record<string, unknown>) => ({
        instruction: String(l.instruction ?? ''),
        size: Number(l.size ?? 0),
      })),
      vulnerabilitiesBefore: (result.vulnerabilities ?? []).map((v: Record<string, unknown>) => {
        const installed = v.installedVersion ? String(v.installedVersion) : '';
        const fixed = v.fixedVersion ? String(v.fixedVersion) : '';
        return {
          cveId: String(v.cveId ?? 'N/A'),
          severity: String(v.severity ?? 'low') as 'critical' | 'high' | 'medium' | 'low',
          packageName: String(v.packageName ?? ''),
          installedVersion: (installed === 'null' || installed === 'N/A' || installed === 'n/a') ? '' : installed,
          fixedVersion: (fixed === 'null' || fixed === 'N/A' || fixed === 'n/a') ? '' : fixed,
          fixable: Boolean(v.fixable),
        };
      }),
      vulnerabilitiesAfter: [],
      logs: (result.logs ?? []).map((l: Record<string, unknown>) => ({
        timestamp: String(l.timestamp ?? new Date().toISOString()),
        level: String(l.level ?? 'info') as 'info' | 'success' | 'warning' | 'error',
        message: String(l.message ?? ''),
      })),
    };

    cache[cacheKey] = { timestamp: Date.now(), analysis };
    return analysis;
  } catch (error) {
    console.error('API Error:', error instanceof Error ? error.message : error);
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
      error: error instanceof Error ? error.message : 'Failed to analyze Dockerfile. Please try again.',
    };
  }
};