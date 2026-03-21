import OpenAI from 'openai';
import { AnalysisResult, type AnalysisCache } from '../types';
import type { ExpertName, MultiModelConfig } from './multiModel/types';
import { analyzeSingleModel, analyzeWithMultiModelExpertSystem } from './multiModel/orchestrate';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
let cache: AnalysisCache = {};

// Clear cache on HMR to pick up merge/normalization fixes immediately.
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    cache = {};
  });
}

let openai: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openai) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Missing VITE_OPENAI_API_KEY. Create a .env file in the project root with:\nVITE_OPENAI_API_KEY=your-api-key-here',
      );
    }

    const isBrowser = typeof window !== 'undefined';
    openai = new OpenAI({
      apiKey,
      // In dev, route through Vite proxy so requests/responses are logged in the terminal.
      baseURL:
        import.meta.env.DEV && isBrowser
          ? `${window.location.origin}/api`
          : (import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1'),
      dangerouslyAllowBrowser: true,
    });
  }
  return openai;
}

function getFallbackModel(): string {
  return import.meta.env.VITE_OPENAI_MODEL || 'gpt-5.2';
}

function parseModelConfigFromEnv(): MultiModelConfig {
  const fallback = getFallbackModel();
  // `import.meta.env` is untyped in this project; force to `string` so downstream `.split()` callbacks
  // keep proper types under `strict` + `noImplicitAny`.
  const envStr = String(import.meta.env.VITE_OPENAI_MODELS ?? '').trim();

  // Format A: key=value;key=value
  // Example: "router=anthropic/claude-sonnet-4.5;security=deepseek/v3.2;size=...;performance=...;best_practices=..."
  if (envStr && envStr.includes('=') && envStr.includes(';')) {
    const map: Record<string, string> = {};
    envStr
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean)
      .forEach((pair) => {
        const idx = pair.indexOf('=');
        if (idx <= 0) return;
        const k = pair.slice(0, idx).trim();
        const v = pair.slice(idx + 1).trim();
        if (k && v) map[k] = v;
      });

    const routerModel = map.router ?? map.r ?? fallback;

    const expertModels: Record<ExpertName, string> = {
      security: map.security ?? routerModel,
      size: map.size ?? routerModel,
      performance: map.performance ?? routerModel,
      best_practices: map.best_practices ?? map.bestPractices ?? routerModel,
    };

    return { routerModel, expertModels };
  }

  // Format B: comma-separated list; first=router, then security/size/performance/best_practices
  if (envStr) {
    const list = envStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const routerModel = list[0] ?? fallback;
    const security = list[1] ?? routerModel;
    const size = list[2] ?? security;
    const performance = list[3] ?? size;
    const best_practices = list[4] ?? performance;

    return {
      routerModel,
      expertModels: {
        security,
        size,
        performance,
        best_practices,
      },
    };
  }

  // Default: single model for everything.
  return {
    routerModel: fallback,
    expertModels: {
      security: fallback,
      size: fallback,
      performance: fallback,
      best_practices: fallback,
    },
  };
}

export async function analyzeDockerfileWithModel(dockerfile: string, model: string): Promise<AnalysisResult> {
  const cacheKey = `${dockerfile.trim()}::mode=single::model=${model}`;
  const cachedResult = cache[cacheKey];

  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
    return cachedResult.analysis;
  }

  const analysis = await analyzeSingleModel({
    client: getClient(),
    dockerfile,
    model,
  });

  cache[cacheKey] = { timestamp: Date.now(), analysis };
  return analysis;
}

export const analyzeDockerfile = async (dockerfile: string): Promise<AnalysisResult> => {
  const dockerKey = dockerfile.trim();
  const models = parseModelConfigFromEnv();

  const cacheKey = `${dockerKey}::mode=multi::router=${models.routerModel}::sec=${models.expertModels.security}::size=${
    models.expertModels.size
  }::perf=${models.expertModels.performance}::bp=${models.expertModels.best_practices}`;

  const cachedResult = cache[cacheKey];
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
    return cachedResult.analysis;
  }

  try {
    const analysis = await analyzeWithMultiModelExpertSystem({
      client: getClient(),
      dockerfile,
      models,
    });

    cache[cacheKey] = { timestamp: Date.now(), analysis };
    return analysis;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
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
          message: msg,
        },
      ],
      error: msg || 'Failed to analyze Dockerfile. Please try again.',
    };
  }
};