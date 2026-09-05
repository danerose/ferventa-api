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
