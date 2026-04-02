/**
 * Deterministic Dockerfile intent classifier.
 * Replaces the LLM-based router with zero-latency pattern matching.
 */
import type { ExpertName, RouterResult } from './types';
import type { StaticDockerfileAnalysis } from './staticAnalysis';

interface ClassificationRule {
  condition: (analysis: StaticDockerfileAnalysis, dockerfile: string) => boolean;
  intent: RouterResult['intent'];
  experts: ExpertName[];
  weight: number;
}

const RULES: ClassificationRule[] = [
  {
    condition: (a) => a.isScratchFinal || a.isDistrolessFinal,
    intent: 'performance',
    experts: ['size', 'performance'],
    weight: 10,
  },
  {
    condition: (_a, df) => {
      const hasNonRootUser = /^\s*USER\s+(?!root)/im.test(df);
      const hasChmod777 = /chmod\s+777/i.test(df);
      return !hasNonRootUser || hasChmod777;
    },
    intent: 'security',
    experts: ['security', 'best_practices'],
    weight: 7,
  },
  {
    condition: (a) => !a.hasCleanup && a.detectedPackageManagers.length > 0,
    intent: 'size',
    experts: ['size', 'best_practices'],
    weight: 6,
  },
  {
    condition: (a) => a.hasMultiStage && !a.isScratchFinal,
    intent: 'performance',
    experts: ['performance', 'size', 'best_practices'],
    weight: 5,
  },
  {
    condition: (a) => !a.hasMultiStage && a.stages.length === 1,
    intent: 'best_practices',
    experts: ['best_practices', 'size'],
    weight: 3,
  },
];

export function classifyDockerfile(
  analysis: StaticDockerfileAnalysis,
  dockerfile: string,
): RouterResult {
  let bestRule: ClassificationRule | null = null;

  for (const rule of RULES) {
    if (rule.condition(analysis, dockerfile)) {
      if (!bestRule || rule.weight > bestRule.weight) {
        bestRule = rule;
      }
    }
  }

  if (!bestRule) {
    return {
      intent: 'mixed',
      experts: ['security', 'size', 'performance', 'best_practices'],
      routerConfidence: 0.8,
      reason: 'No specific pattern matched; running all experts.',
    };
  }

  return {
    intent: bestRule.intent,
    experts: bestRule.experts,
    routerConfidence: 1.0,
    reason: `Static classifier: ${bestRule.intent}-focused Dockerfile.`,
  };
}
