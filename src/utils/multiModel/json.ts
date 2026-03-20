/**
 * Attempts to extract a JSON object from a model response.
 * The app prompts require strict JSON, but some models may wrap output in markdown fences.
 */
export function extractJsonObject<T = unknown>(raw: string): T {
  const cleaned = raw
    .replace(/```(?:json)?\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  // Strict prompts should return valid JSON only, but some providers/models
  // still add leading/trailing text. Try to locate the outer JSON object.
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const candidate = cleaned.slice(start, end + 1);
      return JSON.parse(candidate) as T;
    }
    throw new Error('Failed to parse JSON from model response');
  }
}

