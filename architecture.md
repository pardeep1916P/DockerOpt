# Response Handle Architecture v2

## v1 Limitation (resolved)
- LLM-based router added 2-4s latency with no accuracy benefit.
- Experts had no ground-truth anchor data, causing size hallucinations.
- Simple weighted-average merge couldn't resolve conflicting estimates.

## v2 Enhanced Pipeline

### 1. Static Dockerfile Parser (zero latency)
- Parses Dockerfile for exact layer counts, base image lookup, multi-stage detection.
- Provides ground-truth numbers injected into expert prompts as context.
- Base image sizes from a curated lookup table (~60 common images).

### 2. Deterministic Intent Classifier (zero latency)
- Replaced LLM router with regex-based pattern matching.
- Classifies intent (security/size/performance/best_practices/mixed).
- Selects 2-3 experts based on Dockerfile characteristics.
- Always confident (deterministic) — no fallback to all experts needed.

### 3. Context-Enhanced Expert System
- Each expert receives static analysis as verified ground truth in prompts.
- Per-expert timeouts (default 15s) prevent slow experts from blocking.
- `Promise.allSettled` ensures partial results are still usable.
- Supports `contextPrefix` injection and abort signals.

### 4. Synthesizer (conditional reconciliation)
- Triggered only when expert size estimates diverge >40%.
- Receives all expert outputs + static analysis as a "judge" model.
- Reconciles conflicting estimates using ground-truth anchors.
- Uses a fast model (configurable, defaults to router model).

### 5. Enhanced Merge Strategy
- Layer counts: exact from static parser (not LLM-estimated).
- Sizes: synthesizer override when available, else weighted average.
- Issues/vulns: deduplicated by title/CVE, highest-confidence wins.
- Logs: include static analysis + synthesizer activity for transparency.

## Data Flow

```
Dockerfile → Static Parser (0ms) → Classifier (0ms) → Select Experts
                                                        ↓
                                              Expert 1, 2, 3 (parallel)
                                                        ↓
                                              Divergence > 40%?
                                              ↓ Yes          ↓ No
                                         Synthesizer    Weighted Merge
                                              ↓               ↓
                                           AnalysisResult → UI
```

## Expected Improvements
- **Latency**: ~40% faster (no router LLM call)
- **Original size accuracy**: ~40% better (anchored estimates)
- **Optimized size accuracy**: ~65% better (scratch/distroless handling)
- **Layer counts**: 100% accurate (static parse)
- **API cost**: ~20% cheaper (fewer calls)
