import type { AnalysisResult, Issue, LayerInfo, OptimizationChange, Vulnerability } from '../../types';

export type ExpertName = 'security' | 'size' | 'performance' | 'best_practices';
export type Intent = 'security' | 'size' | 'performance' | 'best_practices' | 'mixed';

export interface RouterResult {
  intent: Intent;
  experts: ExpertName[];
  routerConfidence: number; // 0..1
  reason?: string;
}

export interface BaseAnalysisRaw {
  originalSize?: number;
  optimizedSize?: number;
  layerCountBefore?: number;
  layerCountAfter?: number;
  optimizationScore?: number;
  issues?: Issue[];
  optimizedDockerfile?: string;
  changes?: OptimizationChange[];
  layersBefore?: LayerInfo[];
  layersAfter?: LayerInfo[];
  vulnerabilities?: Vulnerability[];
  logs?: { timestamp?: string; level?: string; message?: string }[];
  // Extra internal fields can be present; we ignore them during normalization.
  [key: string]: unknown;
}

export interface ExpertAnalysisRaw extends BaseAnalysisRaw {
  expertName?: ExpertName;
  expertConfidence?: number; // 0..1
  expertRationale?: string;
}

export interface NormalizedExpert extends AnalysisResult {
  expertName: ExpertName;
  expertConfidence: number; // 0..1
}

export interface MultiModelConfig {
  routerModel: string;
  expertModels: Record<ExpertName, string>;
}

