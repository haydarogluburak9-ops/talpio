/**
 * Deterministik tedarikçi eşleştirme.
 *
 * LLM skor üretmez. Her aday için matchScore (0–100) ve açıklanabilir
 * reason kodları/etiketleri yazılır. Hard filter adayı eler; bonuslar sıralar.
 */

export const MATCH_REASON = {
  EXACT_CATEGORY: 'EXACT_CATEGORY',
  SUBCATEGORY_REQUESTED: 'SUBCATEGORY_REQUESTED',
  SPEC_OVERLAP: 'SPEC_OVERLAP',
  DISTRICT_DELIVERY: 'DISTRICT_DELIVERY',
  CITY_DELIVERY: 'CITY_DELIVERY',
  VERIFIED: 'VERIFIED',
  MIN_ORDER_OK: 'MIN_ORDER_OK',
  CAPACITY_OK: 'CAPACITY_OK',
  ACTIVE_7D: 'ACTIVE_7D',
  ACTIVE_30D: 'ACTIVE_30D',
  RESPONSE_RATE: 'RESPONSE_RATE',
  AVAILABLE_NOW: 'AVAILABLE_NOW',
  /** Alıcı bu satıcıyı doğrudan seçti; puanlama uygulanmaz. */
  DIRECT_INVITE: 'DIRECT_INVITE',
} as const;

export type MatchReasonCode = (typeof MATCH_REASON)[keyof typeof MATCH_REASON];

const REASON_LABEL: Record<MatchReasonCode, (details: MatchReasonDetails) => string> = {
  EXACT_CATEGORY: () => 'Exact category match',
  SUBCATEGORY_REQUESTED: () => 'Subcategory aligned with seller category',
  SPEC_OVERLAP: (d) =>
    d.specOverlapCount ? `Specification overlap (${d.specOverlapCount})` : 'Specification overlap',
  DISTRICT_DELIVERY: (d) =>
    d.cityName ? `${d.cityName} district delivery available` : 'District delivery available',
  CITY_DELIVERY: (d) =>
    d.cityName ? `${d.cityName} delivery available` : 'City delivery available',
  VERIFIED: () => 'Verified supplier',
  MIN_ORDER_OK: () => 'Meets minimum order quantity',
  CAPACITY_OK: () => 'Within seller capacity',
  ACTIVE_7D: () => 'Active last 7 days',
  ACTIVE_30D: () => 'Active last 30 days',
  RESPONSE_RATE: (d) =>
    d.responseRatePct != null
      ? `Response rate ${d.responseRatePct}%`
      : 'Responds to matched requests',
  AVAILABLE_NOW: () => 'Seller available now',
  DIRECT_INVITE: () => 'Buyer requested a quote from you directly',
};

export interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface MatcherBusiness {
  id: string;
  isActive: boolean;
  verificationStatus: string;
  minOrderQuantity: { toString(): string } | number | null;
  maxOrderQuantity?: { toString(): string } | number | null;
  categoryIds: readonly string[];
  /** cityId → districtId[] (boş/null = tüm şehir) */
  serviceAreas: ReadonlyMap<string, readonly (string | null)[]>;
  memberUserIds?: readonly string[];
  lastActiveAt?: Date | null;
  /** 0–1; null = henüz yeterli örnek yok */
  responseRate?: number | null;
  availability?: readonly AvailabilitySlot[] | null;
  /** Satıcının desteklediği spec anahtarları (yoksa overlap atlanır) */
  supportedSpecKeys?: readonly string[];
  blockedWithBuyer?: boolean;
}

export interface MatcherRequest {
  categoryId: string | null;
  subcategoryId?: string | null;
  deliveryCityId: string | null;
  deliveryDistrictId: string | null;
  cityName?: string | null;
  quantity: { toString(): string } | number | null;
  specificationKeys?: readonly string[];
  buyerUserId?: string | null;
}

export interface MatchReasonDetails {
  cityName?: string | null;
  specOverlapCount?: number;
  responseRatePct?: number | null;
}

export interface MatchReasons {
  codes: MatchReasonCode[];
  labels: string[];
  details: MatchReasonDetails;
}

export interface MatchCandidate {
  businessId: string;
  score: number;
  reasons: MatchReasons;
}

export interface MatcherOptions {
  now?: Date;
}

const DAY_MS = 86_400_000;

export function matchBusinessesToRequest(
  request: MatcherRequest,
  businesses: readonly MatcherBusiness[],
  options: MatcherOptions = {},
): MatchCandidate[] {
  const now = options.now ?? new Date();
  const results: MatchCandidate[] = [];
  const specKeys = new Set(
    (request.specificationKeys ?? []).map((key) => key.trim().toLowerCase()).filter(Boolean),
  );

  for (const business of businesses) {
    if (!business.isActive) continue;
    if (business.blockedWithBuyer) continue;

    const details: MatchReasonDetails = { cityName: request.cityName ?? null };
    const codes: MatchReasonCode[] = [];
    let score = 0;

    if (request.categoryId) {
      if (!business.categoryIds.includes(request.categoryId)) continue;
      score += 25;
      codes.push(MATCH_REASON.EXACT_CATEGORY);
    }

    if (request.subcategoryId && request.categoryId) {
      score += 8;
      codes.push(MATCH_REASON.SUBCATEGORY_REQUESTED);
    }

    if (specKeys.size > 0 && business.supportedSpecKeys && business.supportedSpecKeys.length > 0) {
      const supported = new Set(business.supportedSpecKeys.map((key) => key.trim().toLowerCase()));
      let overlap = 0;
      for (const key of specKeys) {
        if (supported.has(key)) overlap += 1;
      }
      if (overlap > 0) {
        details.specOverlapCount = overlap;
        score += Math.min(8, overlap * 4);
        codes.push(MATCH_REASON.SPEC_OVERLAP);
      }
    }

    if (request.deliveryCityId) {
      const districts = business.serviceAreas.get(request.deliveryCityId);
      if (!districts) continue;

      const cityWide = districts.some((d) => d == null);
      const districtMatch =
        request.deliveryDistrictId != null && districts.includes(request.deliveryDistrictId);

      if (!cityWide && !districtMatch && request.deliveryDistrictId) continue;

      if (districtMatch) {
        score += 20;
        codes.push(MATCH_REASON.DISTRICT_DELIVERY);
      } else {
        score += 12;
        codes.push(MATCH_REASON.CITY_DELIVERY);
      }
    }

    if (business.verificationStatus === 'VERIFIED') {
      score += 12;
      codes.push(MATCH_REASON.VERIFIED);
    }

    const qty = toNumber(request.quantity);
    const minQty = toNumber(business.minOrderQuantity);
    const maxQty = toNumber(business.maxOrderQuantity);

    if (qty != null && minQty != null) {
      if (qty < minQty) continue;
      score += 4;
      codes.push(MATCH_REASON.MIN_ORDER_OK);
    }

    if (qty != null && maxQty != null) {
      if (qty > maxQty) continue;
      score += 4;
      codes.push(MATCH_REASON.CAPACITY_OK);
    }

    const lastActive = business.lastActiveAt;
    if (lastActive) {
      const ageMs = now.getTime() - lastActive.getTime();
      if (ageMs <= 7 * DAY_MS) {
        score += 8;
        codes.push(MATCH_REASON.ACTIVE_7D);
      } else if (ageMs <= 30 * DAY_MS) {
        score += 4;
        codes.push(MATCH_REASON.ACTIVE_30D);
      }
    }

    const rate = business.responseRate;
    if (rate != null && Number.isFinite(rate)) {
      const pct = Math.round(Math.min(1, Math.max(0, rate)) * 100);
      details.responseRatePct = pct;
      if (rate >= 0.5) {
        score += 8;
        codes.push(MATCH_REASON.RESPONSE_RATE);
      } else if (rate >= 0.25) {
        score += 4;
        codes.push(MATCH_REASON.RESPONSE_RATE);
      }
    }

    if (isAvailableNow(business.availability, now)) {
      score += 5;
      codes.push(MATCH_REASON.AVAILABLE_NOW);
    }

    const labels = codes.map((code) => REASON_LABEL[code](details));
    results.push({
      businessId: business.id,
      score: Math.min(100, score),
      reasons: { codes, labels, details },
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

function toNumber(value: { toString(): string } | number | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value.toString());
  return Number.isFinite(n) ? n : null;
}

export function isAvailableNow(
  slots: readonly AvailabilitySlot[] | null | undefined,
  now: Date,
): boolean {
  if (!slots || slots.length === 0) return false;
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();

  return slots.some((slot) => {
    if (slot.dayOfWeek !== day) return false;
    const start = parseHhMm(slot.startTime);
    const end = parseHhMm(slot.endTime);
    if (start == null || end == null) return false;
    return minutes >= start && minutes < end;
  });
}

function parseHhMm(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours > 23 || mins > 59) return null;
  return hours * 60 + mins;
}
