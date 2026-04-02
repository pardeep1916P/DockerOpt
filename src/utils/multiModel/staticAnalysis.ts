/**
 * Static Dockerfile analysis — zero LLM calls.
 * Provides ground-truth layer counts, base image size lookups,
 * and structural analysis to anchor LLM estimates.
 */

export interface DockerStage {
  name: string | null;
  baseImage: string;
  knownSize: number | null;
}

export interface StaticDockerfileAnalysis {
  stages: DockerStage[];
  finalStage: DockerStage;
  layerCount: number;
  finalStageLayerCount: number;
  hasMultiStage: boolean;
  hasCleanup: boolean;
  detectedPackageManagers: string[];
  estimatedBaseSize: number;
  isScratchFinal: boolean;
  isDistrolessFinal: boolean;
}

/* ── Known base image sizes (bytes, from Docker Hub ~2026) ── */
const BASE_IMAGE_SIZES: Record<string, number> = {
  'scratch': 0,
  'alpine': 7_600_000,
  'alpine:3.19': 7_400_000,
  'alpine:3.20': 7_600_000,
  'ubuntu': 77_800_000,
  'ubuntu:22.04': 77_800_000,
  'ubuntu:24.04': 78_100_000,
  'debian': 124_000_000,
  'debian:bookworm': 124_000_000,
  'debian:bookworm-slim': 74_800_000,
  'debian:bullseye-slim': 80_400_000,
  'node:18': 1_100_000_000,
  'node:20': 1_100_000_000,
  'node:22': 1_130_000_000,
  'node:18-alpine': 177_000_000,
  'node:20-alpine': 180_000_000,
  'node:22-alpine': 185_000_000,
  'node:18-slim': 240_000_000,
  'node:20-slim': 245_000_000,
  'node': 1_130_000_000,
  'python:3.11': 1_010_000_000,
  'python:3.12': 1_020_000_000,
  'python:3.13': 1_030_000_000,
  'python:3.11-slim': 155_000_000,
  'python:3.12-slim': 157_000_000,
  'python:3.13-slim': 160_000_000,
  'python:3.11-alpine': 57_000_000,
  'python:3.12-alpine': 58_000_000,
  'python': 1_030_000_000,
  'golang:1.21': 814_000_000,
  'golang:1.22': 826_000_000,
  'golang:1.23': 840_000_000,
  'golang:1.21-alpine': 258_000_000,
  'golang:1.22-alpine': 262_000_000,
  'golang': 840_000_000,
  'rust:1.77': 1_420_000_000,
  'rust:1.78': 1_430_000_000,
  'rust:latest': 1_440_000_000,
  'rust:slim': 820_000_000,
  'rust:alpine': 810_000_000,
  'rust': 1_440_000_000,
  'eclipse-temurin:17': 390_000_000,
  'eclipse-temurin:21': 400_000_000,
  'eclipse-temurin:17-jre': 274_000_000,
  'eclipse-temurin:21-jre': 280_000_000,
  'eclipse-temurin:17-jre-alpine': 186_000_000,
  'eclipse-temurin:21-jre-alpine': 190_000_000,
  'openjdk:17': 471_000_000,
  'openjdk:21': 480_000_000,
  'openjdk:17-slim': 405_000_000,
  'maven:3.9': 780_000_000,
  'gradle:8': 870_000_000,
  'nginx': 187_000_000,
  'nginx:alpine': 43_000_000,
  'gcr.io/distroless/base-debian12': 20_500_000,
  'gcr.io/distroless/static-debian12': 2_500_000,
  'gcr.io/distroless/java17-debian12': 226_000_000,
  'gcr.io/distroless/cc-debian12': 21_500_000,
};

function lookupBaseImageSize(image: string): number | null {
  if (BASE_IMAGE_SIZES[image] !== undefined) return BASE_IMAGE_SIZES[image];
  const noTag = image.split(':')[0];
  if (BASE_IMAGE_SIZES[noTag] !== undefined) return BASE_IMAGE_SIZES[noTag];
  for (const [key, size] of Object.entries(BASE_IMAGE_SIZES)) {
    if (image.startsWith(key.split(':')[0]) && key.includes(':')) return size;
  }
  return null;
}

/* ── Regex patterns ── */
const LAYER_RE = /^\s*(RUN|COPY|ADD)\s/i;
const FROM_RE = /^\s*FROM\s+(\S+)(?:\s+[Aa][Ss]\s+(\S+))?/i;

const CLEANUP_PATTERNS = [
  /rm\s+-rf?\s+\/var\/lib\/apt\/lists/i,
  /apt-get\s+clean/i,
  /--no-cache-dir/i,
  /apk\s+--no-cache/i,
  /npm\s+cache\s+clean/i,
  /yarn\s+cache\s+clean/i,
];

const PACKAGE_MANAGERS = [
  { pattern: /apt-get\s+install/i, name: 'apt' },
  { pattern: /pip3?\s+install/i, name: 'pip' },
  { pattern: /npm\s+(install|ci)/i, name: 'npm' },
  { pattern: /yarn\s+(install|add)/i, name: 'yarn' },
  { pattern: /pnpm\s+(install|add)/i, name: 'pnpm' },
  { pattern: /apk\s+add/i, name: 'apk' },
  { pattern: /cargo\s+build/i, name: 'cargo' },
  { pattern: /go\s+build/i, name: 'go' },
  { pattern: /mvn\s+/i, name: 'maven' },
  { pattern: /gradle\s+/i, name: 'gradle' },
];

/* ── Main parser ── */
export function analyzeDockerfileStatic(dockerfile: string): StaticDockerfileAnalysis {
  const lines = dockerfile.split('\n');
  const stages: DockerStage[] = [];
  let currentStageLayers = 0;
  let totalLayers = 0;
  let hasCleanup = false;
  const detectedPMs = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const fromMatch = trimmed.match(FROM_RE);
    if (fromMatch) {
      stages.push({
        baseImage: fromMatch[1],
        name: fromMatch[2] || null,
        knownSize: lookupBaseImageSize(fromMatch[1]),
      });
      currentStageLayers = 0;
      continue;
    }

    if (LAYER_RE.test(trimmed)) {
      totalLayers++;
      currentStageLayers++;
    }

    for (const cp of CLEANUP_PATTERNS) {
      if (cp.test(trimmed)) { hasCleanup = true; break; }
    }
    for (const pm of PACKAGE_MANAGERS) {
      if (pm.pattern.test(trimmed)) detectedPMs.add(pm.name);
    }
  }

  const finalStage = stages.length > 0
    ? stages[stages.length - 1]
    : { baseImage: 'unknown', name: null, knownSize: null };

  return {
    stages,
    finalStage,
    layerCount: totalLayers,
    finalStageLayerCount: currentStageLayers,
    hasMultiStage: stages.length > 1,
    hasCleanup,
    detectedPackageManagers: [...detectedPMs],
    estimatedBaseSize: finalStage.knownSize ?? 0,
    isScratchFinal: finalStage.baseImage === 'scratch',
    isDistrolessFinal: finalStage.baseImage.includes('distroless'),
  };
}

/* ── Format for prompt injection ── */
export function formatStaticAnalysisForPrompt(a: StaticDockerfileAnalysis): string {
  const lines: string[] = ['=== STATIC ANALYSIS (verified ground truth) ==='];

  if (a.hasMultiStage) {
    lines.push(`Build stages: ${a.stages.length} (multi-stage build)`);
    for (const s of a.stages) {
      const sz = s.knownSize !== null ? `${(s.knownSize / 1_048_576).toFixed(0)} MB` : 'unknown';
      lines.push(`  - ${s.name ? `"${s.name}"` : '(unnamed)'}: ${s.baseImage} (${sz})`);
    }
  }

  const fSz = a.finalStage.knownSize !== null
    ? `${(a.finalStage.knownSize / 1_048_576).toFixed(0)} MB`
    : 'unknown';
  lines.push(`Final stage base: ${a.finalStage.baseImage} (${fSz})`);

  if (a.isScratchFinal)
    lines.push('WARNING: Final stage is FROM scratch — image contains ONLY copied binary, typically 5-30 MB');
  if (a.isDistrolessFinal)
    lines.push('WARNING: Final stage is distroless — minimal runtime, no shell/package manager');

  lines.push(`Layer count: ${a.layerCount} (exact)`);
  lines.push(`Final stage layers: ${a.finalStageLayerCount}`);
  lines.push(`Cleanup detected: ${a.hasCleanup ? 'Yes' : 'No'}`);

  if (a.detectedPackageManagers.length > 0)
    lines.push(`Package managers: ${a.detectedPackageManagers.join(', ')}`);

  lines.push('=== END STATIC ANALYSIS ===');
  return lines.join('\n');
}
