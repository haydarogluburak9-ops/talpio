/** Gönderi gövdesinden #hashtag ve @mention çıkarımı. */

export const MAX_HASHTAGS_PER_POST = 8;
export const MAX_MENTIONS_PER_POST = 5;

const HASHTAG_RE = /#([\p{L}\p{N}_]{2,40})/gu;
const MENTION_RE = /@([a-z0-9._]{2,32})/gi;

export interface ParsedHashtag {
  slug: string;
  display: string;
}

export function normalizeHashtag(raw: string): ParsedHashtag | null {
  const display = raw.replace(/^#/, '').trim();
  if (display.length < 2) return null;
  const slug = display.normalize('NFC').toLocaleLowerCase('tr-TR');
  if (!/^[\p{L}\p{N}_]{2,40}$/u.test(slug)) return null;
  return { slug, display: slug };
}

export function extractHashtags(body: string | null | undefined): ParsedHashtag[] {
  if (!body) return [];
  const seen = new Set<string>();
  const result: ParsedHashtag[] = [];
  const matches = body.matchAll(HASHTAG_RE);
  for (const match of matches) {
    const parsed = normalizeHashtag(match[1] ?? '');
    if (!parsed || seen.has(parsed.slug)) continue;
    seen.add(parsed.slug);
    result.push(parsed);
    if (result.length >= MAX_HASHTAGS_PER_POST) break;
  }
  return result;
}

export function extractMentions(body: string | null | undefined): string[] {
  if (!body) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  const matches = body.matchAll(MENTION_RE);
  for (const match of matches) {
    const username = (match[1] ?? '').toLowerCase().replace(/^\.+|\.+$/g, '');
    if (username.length < 2 || seen.has(username)) continue;
    seen.add(username);
    result.push(username);
    if (result.length >= MAX_MENTIONS_PER_POST) break;
  }
  return result;
}
