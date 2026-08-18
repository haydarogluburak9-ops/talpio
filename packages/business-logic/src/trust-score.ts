/**
 * İşletme güven skoru. Yalnızca gerçek doğrulama ve işlem sinyalleri.
 * Premium / abonelik girdisi yoktur ve eklenmemelidir.
 */

export const TRUST_SCORE_WEIGHTS = {
  identity: 8,
  business: 18,
  tax: 8,
  documents: 10,
  orders: 16,
  reviews: 14,
  complaints: 8,
  refunds: 6,
  response: 8,
  age: 4,
} as const;

export type TrustScoreSignalCode = keyof typeof TRUST_SCORE_WEIGHTS;

/** Girdi tipi kasıtlı olarak isPremium / subscription içermez. */
export interface TrustScoreSignals {
  identityVerified: boolean;
  businessVerified: boolean;
  taxVerified: boolean;
  approvedDocumentCount: number;
  successfulOrderCount: number;
  /** 0–5; değerlendirme yoksa null — sahte ortalama basılmaz. */
  reviewScore: number | null;
  reviewCount: number;
  complaintCount: number;
  refundCount: number;
  paymentCount: number;
  /** 0–100; ölçüm yoksa null. */
  responseRatePercent: number | null;
  accountAgeDays: number;
  cancelledOrderCount: number;
  contentReportCount: number;
}

export interface TrustScoreBreakdownItem {
  code: TrustScoreSignalCode;
  label: string;
  points: number;
  maxPoints: number;
}

export interface TrustScoreResult {
  score: number;
  breakdown: TrustScoreBreakdownItem[];
}

const LABELS: Record<TrustScoreSignalCode, string> = {
  identity: 'Kimlik doğrulama',
  business: 'İşletme doğrulama',
  tax: 'Vergi bilgisi',
  documents: 'Belge doğrulama',
  orders: 'Tamamlanan sipariş',
  reviews: 'Değerlendirme',
  complaints: 'Şikâyet oranı',
  refunds: 'İade / uyuşmazlık',
  response: 'Yanıt oranı',
  age: 'Hesap yaşı',
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundPoints(value: number): number {
  return clamp(Math.round(value), 0, 100);
}

function ratioSafe(part: number, total: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0;
  return clamp(part / total, 0, 1);
}

export function computeTrustScore(signals: TrustScoreSignals): TrustScoreResult {
  const identity = signals.identityVerified ? TRUST_SCORE_WEIGHTS.identity : 0;
  const business = signals.businessVerified ? TRUST_SCORE_WEIGHTS.business : 0;
  const tax = signals.taxVerified ? TRUST_SCORE_WEIGHTS.tax : 0;
  const documents =
    signals.approvedDocumentCount > 0
      ? Math.min(
          TRUST_SCORE_WEIGHTS.documents,
          Math.round(Math.min(signals.approvedDocumentCount, 2) * (TRUST_SCORE_WEIGHTS.documents / 2)),
        )
      : 0;

  const orderRatio = Math.min(signals.successfulOrderCount, 20) / 20;
  const orders = Math.round(TRUST_SCORE_WEIGHTS.orders * orderRatio);

  const reviews =
    signals.reviewCount > 0 && signals.reviewScore != null && Number.isFinite(signals.reviewScore)
      ? Math.round(TRUST_SCORE_WEIGHTS.reviews * clamp(signals.reviewScore, 0, 5) / 5)
      : 0;

  const complaintLike = signals.complaintCount + signals.contentReportCount;
  const complaintBase = Math.max(signals.successfulOrderCount, 1);
  const complaintRatio = ratioSafe(complaintLike, complaintBase);
  const complaints =
    signals.successfulOrderCount === 0 && complaintLike === 0
      ? Math.round(TRUST_SCORE_WEIGHTS.complaints / 2)
      : Math.round(TRUST_SCORE_WEIGHTS.complaints * (1 - complaintRatio));

  const paymentBase = Math.max(signals.paymentCount, 1);
  const refundRatio = ratioSafe(signals.refundCount, paymentBase);
  const refunds =
    signals.paymentCount === 0 && signals.refundCount === 0
      ? Math.round(TRUST_SCORE_WEIGHTS.refunds / 2)
      : Math.round(TRUST_SCORE_WEIGHTS.refunds * (1 - refundRatio));

  const cancelPenalty =
    signals.successfulOrderCount + signals.cancelledOrderCount > 0
      ? ratioSafe(
          signals.cancelledOrderCount,
          signals.successfulOrderCount + signals.cancelledOrderCount,
        )
      : 0;
  const responseRaw =
    signals.responseRatePercent == null
      ? 0
      : TRUST_SCORE_WEIGHTS.response * clamp(signals.responseRatePercent, 0, 100) / 100;
  const response = Math.round(responseRaw * (1 - cancelPenalty * 0.25));

  const age = Math.round(
    TRUST_SCORE_WEIGHTS.age * clamp(signals.accountAgeDays / 730, 0, 1),
  );

  const breakdown: TrustScoreBreakdownItem[] = [
    { code: 'identity', label: LABELS.identity, points: identity, maxPoints: TRUST_SCORE_WEIGHTS.identity },
    { code: 'business', label: LABELS.business, points: business, maxPoints: TRUST_SCORE_WEIGHTS.business },
    { code: 'tax', label: LABELS.tax, points: tax, maxPoints: TRUST_SCORE_WEIGHTS.tax },
    { code: 'documents', label: LABELS.documents, points: documents, maxPoints: TRUST_SCORE_WEIGHTS.documents },
    { code: 'orders', label: LABELS.orders, points: orders, maxPoints: TRUST_SCORE_WEIGHTS.orders },
    { code: 'reviews', label: LABELS.reviews, points: reviews, maxPoints: TRUST_SCORE_WEIGHTS.reviews },
    { code: 'complaints', label: LABELS.complaints, points: complaints, maxPoints: TRUST_SCORE_WEIGHTS.complaints },
    { code: 'refunds', label: LABELS.refunds, points: refunds, maxPoints: TRUST_SCORE_WEIGHTS.refunds },
    { code: 'response', label: LABELS.response, points: response, maxPoints: TRUST_SCORE_WEIGHTS.response },
    { code: 'age', label: LABELS.age, points: age, maxPoints: TRUST_SCORE_WEIGHTS.age },
  ];

  const score = roundPoints(breakdown.reduce((sum, item) => sum + item.points, 0));
  return { score, breakdown };
}
