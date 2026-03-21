import OpenAI from 'openai';
import { buildExpertSystemPrompt } from './prompts';
import { extractJsonObject } from './json';
import type { ExpertAnalysisRaw, ExpertName } from './types';

function normalizeExpertRaw(expert: ExpertName, raw: unknown): ExpertAnalysisRaw {
  const obj = (typeof raw === 'object' && raw ? raw : {}) as Record<string, unknown>;
  const expertConfidenceRaw = obj.expertConfidence;
  const expertConfidence = (() => {
    const n = Number(expertConfidenceRaw);
    if (!Number.isFinite(n)) return 0.5;
    return Math.min(1, Math.max(0, n));
  })();

  return {
    ...(obj ?? {}),
    expertName: expert,
    expertConfidence,
  } as ExpertAnalysisRaw;
}

export async function runExpertAnalysis(
  client: OpenAI,
  params: {
    model: string;
    expertName: ExpertName;
    dockerfile: string;
  },
): Promise<ExpertAnalysisRaw> {
  const { model, expertName, dockerfile } = params;
  const systemPrompt = buildExpertSystemPrompt(expertName);

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: dockerfile },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content ?? '{}';
    const parsed = extractJsonObject(raw);
    return normalizeExpertRaw(expertName, parsed);
  } catch (e) {
    // If an expert call fails, return a minimal structure so merger can still work.
    return {
      expertName,
      expertConfidence: 0,
      originalSize: 0,
      optimizedSize: 0,
      layerCountBefore: 0,
      layerCountAfter: 0,
      optimizationScore: 0,
      issues: [],
      optimizedDockerfile: dockerfile,
      changes: [],
      layersBefore: [],
      layersAfter: [],
      vulnerabilities: [],
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'error',
          message: e instanceof Error ? e.message : 'Expert call failed',
        },
      ],
    };
  }
}

