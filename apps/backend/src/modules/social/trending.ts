/**
 * Deterministik trending skoru.
 *
 * uniqueInteractions < minUnique → 0 (spam / tek hesap şişirmesi).
 * Aynı yazardan gelen etkileşim unique sayılmaz (çağıran taraf ayırır).
 */

export const TRENDING_WINDOW_HOURS = 24;
export const TRENDING_MIN_UNIQUE = 3;

export interface TrendingSignals {
  uniqueInteractions: number;
  likeCount: number;
  commentCount: number;
  saveCount: number;
  shareCount: number;
  repostCount: number;
  requestConversions: number;
  freshnessHours: number;
  regionalMatch?: boolean;
  categoryMatch?: boolean;
  /** Aynı yazarın 6 saatte 5+ kez aynı etiketi basması */
  authorSpam?: boolean;
}

export function computeTrendingScore(input: TrendingSignals): number {
  if (input.authorSpam) return 0;
  if (input.uniqueInteractions < TRENDING_MIN_UNIQUE) return 0;

  const hours = Math.max(1, input.freshnessHours);
  const engagement =
    input.likeCount +
    input.commentCount +
    input.saveCount +
    input.shareCount +
    input.repostCount;
  const velocity = engagement / hours;

  let score = 0;
  score += velocity * 3;
  score += input.uniqueInteractions * 2;
  score += Math.max(0, 24 - input.freshnessHours) * 0.4;
  score += input.saveCount * 1.5;
  score += input.requestConversions * 5;
  if (input.regionalMatch) score += 8;
  if (input.categoryMatch) score += 6;

  return Math.round(score * 10) / 10;
}
