import type { StatusTone } from '@talpio/config';

import { Badge } from './badge';

export {
  JOB_STATUS_TONES,
  OFFER_STATUS_TONES,
  ORDER_STATUS_TONES,
  type StatusTone,
} from '@talpio/config';

export interface StatusPillProps {
  label: string;
  tone?: StatusTone;
  className?: string;
}

/**
 * Etiket metni çağıran taraftan gelir; böylece bileşen dile bağımlı kalmaz ve
 * aynı renk dili web, admin ve mobilde korunur.
 */
export function StatusPill({ label, tone = 'neutral', className }: StatusPillProps) {
  return (
    <Badge tone={tone} className={className}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}
