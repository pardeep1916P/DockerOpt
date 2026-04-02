/**
 * @deprecated Use `classifier.ts` instead.
 * This LLM-based router is kept as a fallback but is no longer
 * used in the main pipeline. The static classifier in classifier.ts
 * provides the same functionality with zero latency.
 */
import OpenAI from 'openai';
import { ROUTER_SYSTEM_PROMPT } from './prompts';
import { extractJsonObject } from './json';
import type { ExpertName, RouterResult } from './types';

const EXPERTS: ExpertName[] = ['security', 'size', 'performance', 'best_practices'];

function normalizeRouterResult(input: unknown): RouterResult {
  const obj = (typeof input === 'object' && input ? input : {}) as Record<string, unknown>;

  const expertsRaw = Array.isArray(obj.experts) ? obj.experts : EXPERTS;
  const experts = (expertsRaw as unknown[])
    .map((e) => String(e) as ExpertName)
    .filter((e) => EXPERTS.includes(e));

  const routerConfidence = Number(obj.routerConfidence);
  const conf = Number.isFinite(routerConfidence) ? Math.min(1, Math.max(0, routerConfidence)) : 0;

  const intentRaw = String(obj.intent ?? 'mixed');
  const allowedIntents: RouterResult['intent'][] = ['security', 'size', 'performance', 'best_practices', 'mixed'];
  const intent = allowedIntents.includes(intentRaw as RouterResult['intent']) ? (intentRaw as RouterResult['intent']) : 'mixed';

  return {
    intent,
    experts: experts.length > 0 ? experts : EXPERTS,
    routerConfidence: conf,
    reason: typeof obj.reason === 'string' ? obj.reason : undefined,
  };
}

export async function routeDockerfile(
  client: OpenAI,
  model: string,
  dockerfile: string,
): Promise<RouterResult> {
  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: ROUTER_SYSTEM_PROMPT },
        { role: 'user', content: dockerfile },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content ?? '{}';
    const parsed = extractJsonObject(raw);
    return normalizeRouterResult(parsed);
  } catch {
    return {
      intent: 'mixed',
      experts: EXPERTS,
      routerConfidence: 0,
      reason: 'Router failed to parse; using all experts.',
    };
  }
}

