const GENERIC_WORDS = new Set([
  "a",
  "and",
  "association",
  "at",
  "club",
  "college",
  "of",
  "organization",
  "society",
  "student",
  "students",
  "swarthmore",
  "team",
  "the",
]);

export const MIN_CLUB_NAME_SIMILARITY = 0.34;

export function normalizeClubName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function meaningfulWords(value: string) {
  return normalizeClubName(value)
    .split(" ")
    .filter((word) => word.length > 1 && !GENERIC_WORDS.has(word));
}

function initials(value: string) {
  return normalizeClubName(value)
    .split(" ")
    .filter((word) => word.length > 1 && !["and", "at", "club", "of", "the"].includes(word))
    .map((word) => word[0])
    .join("");
}

function bigrams(value: string) {
  const compact = value.replace(/\s/g, "");
  const result = new Set<string>();
  for (let index = 0; index < compact.length - 1; index++) {
    result.add(compact.slice(index, index + 2));
  }
  return result;
}

function diceCoefficient(left: string, right: string) {
  const leftPairs = bigrams(left);
  const rightPairs = bigrams(right);
  if (leftPairs.size === 0 || rightPairs.size === 0) {
    return left === right ? 1 : 0;
  }
  let shared = 0;
  for (const pair of leftPairs) {
    if (rightPairs.has(pair)) shared++;
  }
  return (2 * shared) / (leftPairs.size + rightPairs.size);
}

function editSimilarity(left: string, right: string) {
  if (!left || !right) return 0;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex++) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex++) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitutionCost,
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return 1 - previous[right.length] / Math.max(left.length, right.length);
}

export function clubNameSimilarity(left: string, right: string) {
  const normalizedLeft = normalizeClubName(left);
  const normalizedRight = normalizeClubName(right);
  if (!normalizedLeft || !normalizedRight) return 0;
  if (normalizedLeft === normalizedRight) return 1;

  const leftWords = new Set(meaningfulWords(left));
  const rightWords = new Set(meaningfulWords(right));
  const sharedWords = [...leftWords].filter((word) => rightWords.has(word));
  const unionSize = new Set([...leftWords, ...rightWords]).size;
  const wordScore = unionSize > 0 ? sharedWords.length / unionSize : 0;

  const canonicalLeft = [...leftWords].sort().join(" ");
  const canonicalRight = [...rightWords].sort().join(" ");
  if (canonicalLeft && canonicalLeft === canonicalRight) return 0.98;

  const leftInitials = initials(left);
  const rightInitials = initials(right);
  if (
    (normalizedLeft.replaceAll(" ", "") === rightInitials && rightInitials.length >= 3) ||
    (normalizedRight.replaceAll(" ", "") === leftInitials && leftInitials.length >= 3)
  ) {
    return 0.9;
  }

  const containmentScore =
    Math.min(canonicalLeft.length, canonicalRight.length) >= 4 &&
    (canonicalLeft.includes(canonicalRight) || canonicalRight.includes(canonicalLeft))
      ? 0.82
      : 0;

  return Math.max(
    wordScore,
    containmentScore,
    editSimilarity(canonicalLeft, canonicalRight),
    diceCoefficient(normalizedLeft, normalizedRight),
  );
}

export function findSimilarClubNames<T extends { name: string }>(
  requestedName: string,
  clubs: readonly T[],
  limit = 5,
) {
  return clubs
    .map((club) => ({ club, score: clubNameSimilarity(requestedName, club.name) }))
    .filter(({ score }) => score >= MIN_CLUB_NAME_SIMILARITY)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ club }) => club);
}
