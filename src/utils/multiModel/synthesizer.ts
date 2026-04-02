/**
 * Synthesizer expert — reconciles conflicting expert results.
 * Only triggered when expert size estimates diverge significantly.
 */
import OpenAI from 'openai';
import { extractJsonObject } from './json';
import type { ExpertAnalysisRaw } from './types';
import { type StaticDockerfileAnalysis, formatStaticAnalysisForPrompt } from './staticAnalysis';

const SYNTHESIZER_SYSTEM_PROMPT = `You are the final reconciliation judge in a multi-expert Docker analysis system.
Multiple specialized experts analyzed a Dockerfile but their estimates DISAGREE significantly.
Reconcile their outputs using the provided static analysis ground truth.

RULES:
1. Static analysis layer counts are EXACT — use them as-is.
2. Static analysis base image sizes are REAL measurements — anchor your estimates to them.
3. If the final stage is FROM scratch, the optimized image is ONLY the copied binary (typically 5-30 MB for Go/Rust).
4. If the final stage is FROM distroless, add only ~20 MB to the binary size.
5. Prefer expert estimates closest to the static analysis anchors.

Return ONLY valid JSON (no markdown, no code fences):
{
  "originalSize": <reconciled original size in bytes>,
  "optimizedSize": <reconciled optimized size in bytes>,
  "optimizationScore": <reconciled 0-100 score>,
  "reasoning": "<explain reconciliation logic>"
}`;

export interface SynthesizerOutput {
  originalSize: number;
  optimizedSize: number;
  optimizationScore: number;
  reasoning: string;
}

export function shouldRunSynthesizer(
  expertResults: ExpertAnalysisRaw[],
  threshold: number = 0.4,
): boolean {
  if (expertResults.length < 2) return false;
  const sizes = expertResults.map((e) => Number(e.originalSize ?? 0)).filter((n) => n > 0);
  if (sizes.length < 2) return false;
  const max = Math.max(...sizes);
  const min = Math.min(...sizes);
  if (max === 0) return false;
  return (max - min) / max > threshold;
}

export async function runSynthesizer(
  client: OpenAI,
  model: string,
  input: {
    dockerfile: string;
    staticAnalysis: StaticDockerfileAnalysis;
    expertResults: ExpertAnalysisRaw[];
  },
  timeoutMs: number = 12_000,
): Promise<SynthesizerOutput | null> {
  const staticContext = formatStaticAnalysisForPrompt(input.staticAnalysis);

  const expertSummaries = input.expertResults
    .map((e, i) => {
      const origMB = ((Number(e.originalSize) || 0) / 1_048_576).toFixed(0);
      const optMB = ((Number(e.optimizedSize) || 0) / 1_048_576).toFixed(0);
      return `Expert ${i + 1} (${e.expertName}, conf=${e.expertConfidence}): original=${origMB}MB, optimized=${optMB}MB, score=${e.optimizationScore}`;
    })
    .join('\n');

  const userMessage = `${staticContext}\n\n=== EXPERT RESULTS (conflicting) ===\n${expertSummaries}\n=== END ===\n\nDockerfile:\n${input.dockerfile}\n\nReconcile using static analysis as ground truth.`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const completion = await client.chat.completions.create(
      {
        model,
        messages: [
          { role: 'system', content: SYNTHESIZER_SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      },
      { signal: controller.signal },
    );

    clearTimeout(timer);

    const rawText = completion.choices?.[0]?.message?.content ?? '{}';
    const parsed = extractJsonObject(rawText) as Record<string, unknown>;

    return {
      originalSize: Number(parsed.originalSize ?? 0),
      optimizedSize: Number(parsed.optimizedSize ?? 0),
      optimizationScore: Number(parsed.optimizationScore ?? 0),
      reasoning: String(parsed.reasoning ?? ''),
    };
  } catch {
    return null;
  }
}
