/**
 * Utility for Fuzzy Search in MongoDB
 * Supports:
 * 1. Smart Fuzzy Regex with Spanish phonetics, duplicate consonant collapse, and plural handling.
 * 2. MongoDB Atlas Search ($search with Lucene fuzzy matching) with automated fallback.
 */

/**
 * Generates a flexible regex pattern from user input to tolerate typos,
 * duplicate consonants (e.g. 'ballatas' -> 'balata'), plural forms, and accents.
 */
export function buildFuzzyRegex(searchTerm: string): RegExp {
  if (!searchTerm || !searchTerm.trim()) {
    return new RegExp('.*', 'i');
  }

  const raw = searchTerm.trim();
  // Split into tokens (words) to allow matching multi-word queries flexibly
  const words = raw.split(/\s+/).filter(Boolean);

  const wordPatterns = words.map((word) => {
    // 1. Lowercase
    let w = word.toLowerCase();

    // 2. Remove common trailing plural endings (s, es) for base matching
    let pluralSuffix = '';
    if (w.endsWith('es') && w.length > 3) {
      w = w.slice(0, -2);
      pluralSuffix = '(?:es|s)?';
    } else if (w.endsWith('s') && w.length > 2) {
      w = w.slice(0, -1);
      pluralSuffix = '(?:es|s)?';
    }

    // 3. Escape regex special characters except letters
    let escaped = '';
    for (let i = 0; i < w.length; i++) {
      const char = w[i];
      // Normalize repeated characters to match single or multiple (e.g. 'll' matches 'l' or 'll')
      const nextChar = w[i + 1];
      if (char === nextChar) {
        // Skip duplicate in the template, we'll make it match 1 or more
        continue;
      }

      // Spanish phonetics / common typos:
      // a/á, e/é, i/í/y, o/ó, u/ú/ü
      if (char === 'a' || char === 'á') {
        escaped += '[aá]';
      } else if (char === 'e' || char === 'é') {
        escaped += '[eé]';
      } else if (char === 'i' || char === 'í' || char === 'y') {
        escaped += '[iíy]';
      } else if (char === 'o' || char === 'ó') {
        escaped += '[oó]';
      } else if (char === 'u' || char === 'ú' || char === 'ü') {
        escaped += '[uúü]';
      } else if (char === 'b' || char === 'v') {
        escaped += '[bv]+';
      } else if (char === 'c' || char === 's' || char === 'z') {
        escaped += '[csz]+';
      } else if (char === 'l') {
        // Allow 'l' or 'll'
        escaped += 'l+';
      } else if (char === 'r') {
        // Allow 'r' or 'rr'
        escaped += 'r+';
      } else if (/[a-z0-9]/i.test(char)) {
        // Allow single or accidental double consonants
        escaped += `${char}+`;
      } else {
        // Escape standard regex characters
        escaped += `\\${char}`;
      }
    }

    return `${escaped}${pluralSuffix}`;
  });

  // Join words with loose whitespace/wildcard separator
  const finalPattern = wordPatterns.join('.*');
  return new RegExp(finalPattern, 'i');
}

/**
 * Builds an Atlas Search ($search) query stage for MongoDB Atlas
 */
export function buildAtlasSearchStage(
  searchTerm: string,
  fields: string[],
  indexName = 'default',
) {
  const trimmed = searchTerm.trim();
  const maxEdits = trimmed.length > 5 ? 2 : 1;

  return {
    $search: {
      index: indexName,
      compound: {
        should: [
          {
            text: {
              query: trimmed,
              path: fields,
              fuzzy: {
                maxEdits,
                prefixLength: 1,
              },
            },
          },
          {
            autocomplete: {
              query: trimmed,
              path: fields[0],
              fuzzy: {
                maxEdits,
                prefixLength: 1,
              },
            },
          },
        ],
      },
    },
  };
}

/**
 * Normalizes a string by lowercasing, removing diacritics and special characters.
 */
export function cleanSearchString(str?: string | null): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Standard Levenshtein Distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1,     // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Normalized string similarity score between 0 and 1.
 */
export function stringSimilarity(a: string, b: string): number {
  const s1 = cleanSearchString(a);
  const s2 = cleanSearchString(b);
  if (!s1 && !s2) return 1;
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;

  // Substring or token inclusion gives a strong baseline
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    return Math.max(0.85, minLen / maxLen);
  }

  const dist = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Calculates a match score between an incoming vehicle input and an existing vehicle candidate.
 * Takes into account brand similarity, model similarity, token inclusion (e.g. "RUNNER" in "RUNNER 2026"),
 * serial number comparison, and year.
 */
export function calculateVehicleMatchScore(
  input: {
    brand: string;
    model: string;
    year?: number;
    serialNumberLastFour?: string;
  },
  candidate: {
    brand: string;
    model: string;
    year?: number;
    serialNumberLastFour?: string;
  },
): number {
  const inputBrand = cleanSearchString(input.brand);
  const candBrand = cleanSearchString(candidate.brand);
  const inputModel = cleanSearchString(input.model);
  const candModel = cleanSearchString(candidate.model);

  // 1. Brand similarity
  let brandSim = stringSimilarity(inputBrand, candBrand);
  if (
    buildFuzzyRegex(inputBrand).test(candBrand) ||
    buildFuzzyRegex(candBrand).test(inputBrand)
  ) {
    brandSim = Math.max(brandSim, 0.85);
  }

  // If brands are completely different (e.g. Nissan vs Yamaha), cannot be the same vehicle
  if (brandSim < 0.45) {
    return 0;
  }

  // 2. Model similarity
  let modelSim = stringSimilarity(inputModel, candModel);
  // Check token inclusion (e.g. input "RUNNER" inside candidate "RUNNER 2026")
  const inputTokens = inputModel.split(' ').filter(Boolean);
  const candTokens = candModel.split(' ').filter(Boolean);
  if (inputTokens.length > 0 && candTokens.length > 0) {
    const matchingInputTokens = inputTokens.filter((t) =>
      candTokens.some((ct) => ct === t || stringSimilarity(t, ct) >= 0.8),
    );
    if (matchingInputTokens.length === inputTokens.length) {
      modelSim = Math.max(modelSim, 0.9);
    }
  }
  if (
    buildFuzzyRegex(inputModel).test(candModel) ||
    buildFuzzyRegex(candModel).test(inputModel)
  ) {
    modelSim = Math.max(modelSim, 0.85);
  }

  // 3. Combined string similarity
  const inputFull = `${inputBrand} ${inputModel}`;
  const candFull = `${candBrand} ${candModel}`;
  const fullSim = stringSimilarity(inputFull, candFull);

  let score = brandSim * 0.45 + modelSim * 0.45 + fullSim * 0.1;

  // 4. Serial number comparison
  const inSerial = (input.serialNumberLastFour || '').trim().toUpperCase();
  const candSerial = (candidate.serialNumberLastFour || '').trim().toUpperCase();

  if (inSerial && candSerial) {
    if (inSerial === candSerial) {
      score += 0.35; // Significant bonus for identical serial
    } else {
      score -= 0.6; // Heavy penalty: explicit different serial numbers mean different physical units
    }
  }

  // 5. Year comparison
  if (input.year && candidate.year) {
    if (input.year === candidate.year) {
      score += 0.05;
    } else if (Math.abs(input.year - candidate.year) > 2) {
      score -= 0.1;
    }
  }

  return Math.max(0, Math.min(1.5, score));
}

