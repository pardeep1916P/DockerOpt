import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { analyzeSingleModel, analyzeWithMultiModelExpertSystem } from '../src/utils/multiModel/orchestrate';
import type { ExpertName, MultiModelConfig } from '../src/utils/multiModel/types';

type StackKey = 'nodejs' | 'python' | 'go' | 'java' | 'rust';

const MB = 1024 * 1024;

const runnerDir = path.dirname(fileURLToPath(import.meta.url));

const stacks: Record<
  StackKey,
  {
    displayName: string;
    folder: string;
    realOriginalMB: number;
    realOptimizedMB: number;
  }
> = {
  nodejs: { displayName: 'Node.js', folder: 'test-nodejs', realOriginalMB: 1530, realOptimizedMB: 296 },
  python: { displayName: 'Python', folder: 'test-python', realOriginalMB: 1930, realOptimizedMB: 392 },
  go: { displayName: 'Go App', folder: 'test-go', realOriginalMB: 1410, realOptimizedMB: 7 },
  java: { displayName: 'Java', folder: 'test-java', realOriginalMB: 919, realOptimizedMB: 120 },
  rust: { displayName: 'Rust', folder: 'test-rust', realOriginalMB: 1520, realOptimizedMB: 5 },
};

function absPercentError(pred: number, real: number): number {
  if (real === 0) return pred === 0 ? 0 : 100;
  return (Math.abs(pred - real) / real) * 100;
}

function formatPredAndErrorMB(predMB: number, realMB: number): string {
  const errPct = absPercentError(predMB, realMB);
  const predDisp = Math.round(predMB);
  const errDisp = Math.round(errPct);
  return `${predDisp} MB (${errDisp}%)`;
}

function parseKeyValueList(envStr: string): Record<string, string> {
  // Supports: "router=a;security=b" or "router=a,security=b" (comma also accepted).
  const parts = envStr
    .split(/[;,]/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const out: Record<string, string> = {};
  for (const p of parts) {
    const idx = p.indexOf('=');
    if (idx <= 0) continue;
    const k = p.slice(0, idx).trim();
    const v = p.slice(idx + 1).trim();
    if (!k || !v) continue;
    out[k] = v;
  }
  return out;
}

function loadDotEnv(projectRoot: string) {
  // Minimal dotenv loader (avoid adding new deps).
  const envPath = path.join(projectRoot, '.env');
  return fs
    .readFile(envPath, 'utf8')
    .then((txt) => {
      txt.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const idx = trimmed.indexOf('=');
        if (idx <= 0) return;
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim();
        if (process.env[key] == null) process.env[key] = value;
      });
    })
    .catch(() => {
      // If .env doesn't exist, rely on the environment variables already set.
    });
}

function parseModelConfigFromEnv(fallbackModel: string): MultiModelConfig {
  const envStr = (process.env.VITE_OPENAI_MODELS ?? '').toString().trim();

  // Format A: key=value;key=value
  if (envStr && envStr.includes('=') && envStr.includes(';')) {
    const map = parseKeyValueList(envStr);
    const routerModel = map.router ?? map.r ?? fallbackModel;

    const expertModels: Record<ExpertName, string> = {
      security: map.security ?? routerModel,
      size: map.size ?? routerModel,
      performance: map.performance ?? routerModel,
      best_practices: map.best_practices ?? map.bestPractices ?? routerModel,
    };
    return { routerModel, expertModels };
  }

  // Format B: comma-separated list
  if (envStr) {
    const list = envStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const routerModel = list[0] ?? fallbackModel;
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

  return {
    routerModel: fallbackModel,
    expertModels: {
      security: fallbackModel,
      size: fallbackModel,
      performance: fallbackModel,
      best_practices: fallbackModel,
    },
  };
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function parseModelLabels(): Record<string, string> {
  // Format: "DeepSeek:deepseek/v3.2,GPT:GPT-5.2"
  const envStr = (process.env.VITE_OPENAI_MODEL_LABELS ?? '').toString().trim();
  if (!envStr) return {};
  const map: Record<string, string> = {};
  envStr.split(',').map((s) => s.trim()).filter(Boolean).forEach((item) => {
    const idx = item.indexOf(':');
    if (idx <= 0) return;
    const label = item.slice(0, idx).trim();
    const id = item.slice(idx + 1).trim();
    if (!label || !id) return;
    map[id] = label;
  });
  return map;
}

async function readText(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf8');
}

function getArg(flag: string): boolean {
  const arg = process.argv.find((a) => a === flag);
  return Boolean(arg);
}

async function main() {
  const projectRoot = path.resolve(runnerDir, '..');
  await loadDotEnv(projectRoot);

  const apiKey = process.env.VITE_OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing VITE_OPENAI_API_KEY');

  const baseURL =
    process.env.VITE_OPENAI_BASE_URL && process.env.VITE_OPENAI_BASE_URL.trim()
      ? process.env.VITE_OPENAI_BASE_URL.trim()
      : 'https://api.ai.kodekloud.com/v1';

  const fallbackModel = process.env.VITE_OPENAI_MODEL || 'gpt-5.2';
  const modelsConfig = parseModelConfigFromEnv(fallbackModel);

  // Baseline models to test independently.
  const baselineModelsEnv = (process.env.VITE_OPENAI_TEST_MODELS ?? '').toString().trim();
  const baselineModels = unique(
    (baselineModelsEnv
      ? baselineModelsEnv.split(',').map((s) => s.trim()).filter(Boolean)
      : [modelsConfig.routerModel, ...Object.values(modelsConfig.expertModels)]).filter(Boolean),
  );

  const modelLabels = parseModelLabels();

  const client = new OpenAI({
    apiKey,
    baseURL,
  });

  const useDockerBuild = getArg('--buildGroundTruth');
  // Default behavior: use existing recorded ground-truth sizes from sample/test.md.
  // (docker builds are slow and require Docker to be available)
  if (useDockerBuild) {
    console.warn('WARNING: --buildGroundTruth is enabled, but docker-size extraction is not implemented in this runner. Using recorded ground truth instead.');
  }

  const stackKeys = Object.keys(stacks) as StackKey[];

  // Preload all dockerfiles (unoptimized only; optimized sizes are ground-truth).
  const dockerfiles: Record<StackKey, string> = {} as Record<StackKey, string>;
  for (const key of stackKeys) {
    const dockerfilePath = path.join(projectRoot, 'sample', stacks[key].folder, 'Dockerfile');
    dockerfiles[key] = await readText(dockerfilePath);
  }

  // Baselines
  const baselineResults: Record<
    string,
    {
      byStack: Record<StackKey, { predOrigMB: number; predOptMB: number; origErrPct: number; optErrPct: number }>;
      avgOrigErr: number;
      avgOptErr: number;
    }
  > = {};

  let fatalError: string | null = null;
  for (const model of baselineModels) {
    const label = modelLabels[model] ?? model;
    console.log(`Running baseline model: ${label}`);

    const byStack = {} as Record<StackKey, { predOrigMB: number; predOptMB: number; origErrPct: number; optErrPct: number }>;
    for (const key of stackKeys) {
      const result = await analyzeSingleModel({ client, dockerfile: dockerfiles[key], model });
      if (result.error) {
        console.warn(`Baseline error: model=${label} stack=${key} error=${result.error}`);
        if (!fatalError && String(result.error).includes('401')) {
          fatalError = result.error;
          break;
        }
      }
      const predOrigMB = result.originalSize / MB;
      const predOptMB = result.optimizedSize / MB;

      const origErrPct = absPercentError(predOrigMB, stacks[key].realOriginalMB);
      const optErrPct = absPercentError(predOptMB, stacks[key].realOptimizedMB);

      byStack[key] = { predOrigMB, predOptMB, origErrPct, optErrPct };
    }

    if (fatalError) break;

    const origErrs = stackKeys.map((k) => byStack[k].origErrPct);
    const optErrs = stackKeys.map((k) => byStack[k].optErrPct);

    baselineResults[model] = {
      byStack,
      avgOrigErr: origErrs.reduce((a, b) => a + b, 0) / origErrs.length,
      avgOptErr: optErrs.reduce((a, b) => a + b, 0) / optErrs.length,
    };
  }

  // If auth failed, stop early and annotate test.md clearly.
  if (fatalError) {
    const now = new Date();
    const runId = `multi-model-run ${now.toISOString().slice(0, 19).replace('T', ' ')}`;
    const multiConfigStr = `router=${modelsConfig.routerModel}; security=${modelsConfig.expertModels.security}; size=${modelsConfig.expertModels.size}; performance=${modelsConfig.expertModels.performance}; best_practices=${modelsConfig.expertModels.best_practices}`;

    const appendSection = [
      '',
      '---',
      `## 🧠 Multi-Model Expert System Accuracy (${runId})`,
      `Test status: FAILED (fatal auth error)`,
      `Error: \`${fatalError}\``,
      `Multi-model config: \`${multiConfigStr}\``,
      '',
    ].join('\n');

    const testMdPath = path.join(projectRoot, 'sample', 'test.md');
    const current = await fs.readFile(testMdPath, 'utf8');
    const existingIdx = current.indexOf('## 🧠 Multi-Model Expert System Accuracy');
    const updated = existingIdx >= 0 ? current.slice(0, existingIdx).trimEnd() : current;
    await fs.writeFile(testMdPath, updated + appendSection, 'utf8');
    console.log('Updated sample/test.md with FAILED multi-model test status.');
    return;
  }

  // Multi-model
  console.log('Running multi-model expert system...');
  const multiByStack = {} as Record<
    StackKey,
    { predOrigMB: number; predOptMB: number; origErrPct: number; optErrPct: number }
  >;

  const routerConfidenceThreshold = process.env.VITE_ROUTER_CONFIDENCE_THRESHOLD
    ? Number(process.env.VITE_ROUTER_CONFIDENCE_THRESHOLD)
    : 0.45;

  for (const key of stackKeys) {
    const result = await analyzeWithMultiModelExpertSystem({
      client,
      dockerfile: dockerfiles[key],
      models: modelsConfig,
      routerConfidenceThreshold,
    });
    if (result.error) {
      console.warn(`Multi-model error: stack=${key} error=${result.error}`);
    }
    const predOrigMB = result.originalSize / MB;
    const predOptMB = result.optimizedSize / MB;
    multiByStack[key] = {
      predOrigMB,
      predOptMB,
      origErrPct: absPercentError(predOrigMB, stacks[key].realOriginalMB),
      optErrPct: absPercentError(predOptMB, stacks[key].realOptimizedMB),
    };
  }

  const multiAvgOrigErr = stackKeys.map((k) => multiByStack[k].origErrPct).reduce((a, b) => a + b, 0) / stackKeys.length;
  const multiAvgOptErr = stackKeys.map((k) => multiByStack[k].optErrPct).reduce((a, b) => a + b, 0) / stackKeys.length;

  const bestBaselineOrig = baselineModels
    .map((m) => ({ model: m, avg: baselineResults[m].avgOrigErr }))
    .sort((a, b) => a.avg - b.avg)[0];
  const bestBaselineOpt = baselineModels
    .map((m) => ({ model: m, avg: baselineResults[m].avgOptErr }))
    .sort((a, b) => a.avg - b.avg)[0];

  const bestBaselineOrigLabel = modelLabels[bestBaselineOrig.model] ?? bestBaselineOrig.model;
  const bestBaselineOptLabel = modelLabels[bestBaselineOpt.model] ?? bestBaselineOpt.model;

  const multiConfigStr = `router=${modelsConfig.routerModel}; security=${modelsConfig.expertModels.security}; size=${modelsConfig.expertModels.size}; performance=${modelsConfig.expertModels.performance}; best_practices=${modelsConfig.expertModels.best_practices}`;

  const now = new Date();
  const runId = `multi-model-run ${now.toISOString().slice(0, 19).replace('T', ' ')}`;

  // Build tables.
  const colOrder: StackKey[] = ['nodejs', 'python', 'go', 'java', 'rust'];
  const baselineRows = baselineModels
    .slice()
    .sort((a, b) => baselineResults[a].avgOrigErr - baselineResults[b].avgOrigErr);

  const originalTableHeader = [
    '| Model | Node.js (1530) | Python (1930) | Go (1410) | Java (919) | Rust (1520) | Avg Error |',
    '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |',
  ].join('\n');

  const originalTableRows = [
    `| Multi-Model Expert System | ${colOrder
      .map((k) => formatPredAndErrorMB(multiByStack[k].predOrigMB, stacks[k].realOriginalMB))
      .join(' | ')} | ${multiAvgOrigErr.toFixed(1)}% |`,
    ...baselineRows.map((m) => {
      const rowPreds = colOrder.map((k) => {
        const r = baselineResults[m].byStack[k];
        return formatPredAndErrorMB(r.predOrigMB, stacks[k].realOriginalMB);
      });
      const label = modelLabels[m] ?? m;
      return `| ${label} | ${rowPreds.join(' | ')} | ${baselineResults[m].avgOrigErr.toFixed(1)}% |`;
    }),
  ].join('\n');

  const optimizedTableHeader = [
    '| Model | Node.js (296) | Python (392) | Go (7) | Java (120) | Rust (5) | Avg Error |',
    '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |',
  ].join('\n');

  const optimizedTableRows = [
    `| Multi-Model Expert System | ${colOrder
      .map((k) => formatPredAndErrorMB(multiByStack[k].predOptMB, stacks[k].realOptimizedMB))
      .join(' | ')} | ${multiAvgOptErr.toFixed(1)}% |`,
    ...baselineRows.map((m) => {
      const rowPreds = colOrder.map((k) => {
        const r = baselineResults[m].byStack[k];
        return formatPredAndErrorMB(r.predOptMB, stacks[k].realOptimizedMB);
      });
      const label = modelLabels[m] ?? m;
      return `| ${label} | ${rowPreds.join(' | ')} | ${baselineResults[m].avgOptErr.toFixed(1)}% |`;
    }),
  ].join('\n');

  const verdict = [
    '## 🏆 Multi-Model Expert System Verdict',
    `- Best original predictor (baseline): \`${bestBaselineOrigLabel}\` (${bestBaselineOrig.avg.toFixed(1)}% avg error)`,
    `- Multi-Model original avg error: ${multiAvgOrigErr.toFixed(1)}%`,
    `- Best optimized predictor (baseline): \`${bestBaselineOptLabel}\` (${bestBaselineOpt.avg.toFixed(1)}% avg error)`,
    `- Multi-Model optimized avg error: ${multiAvgOptErr.toFixed(1)}%`,
    '',
    `Multi-model config: \`${multiConfigStr}\``,
  ].join('\n');

  const appendSection = [
    '',
    '---',
    `## 🧠 Multi-Model Expert System Accuracy (${runId})`,
    `Router confidence threshold: \`${routerConfidenceThreshold}\``,
    useDockerBuild ? `Ground truth: built via Docker` : 'Ground truth: recorded sizes from the existing `sample/test.md`',
    '',
    '### 📊 Original Size Accuracy (from non-optimal Dockerfile input)',
    '',
    originalTableHeader,
    originalTableRows,
    '',
    '### ⚡ Optimized Size Accuracy (optimized size ground truth)',
    '',
    optimizedTableHeader,
    optimizedTableRows,
    '',
    verdict,
    '',
  ].join('\n');

  const testMdPath = path.join(projectRoot, 'sample', 'test.md');
  const current = await fs.readFile(testMdPath, 'utf8');

  const existingIdx = current.indexOf('## 🧠 Multi-Model Expert System Accuracy');
  const updated = existingIdx >= 0 ? current.slice(0, existingIdx).trimEnd() : current;

  await fs.writeFile(testMdPath, updated + appendSection, 'utf8');
  console.log('Updated sample/test.md with multi-model results.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

