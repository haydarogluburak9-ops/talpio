export interface AvailabilitySlot {
  /** 0 = Pazar ... 6 = Cumartesi */
  dayOfWeek: number;
  /** "HH:mm" yerel saat. */
  startTime: string;
  endTime: string;
  isActive: boolean;
}

function toMinutes(time: string): number {
  const [hours = '0', minutes = '0'] = time.split(':');
  return Number(hours) * 60 + Number(minutes);
}

export function isValidSlot(slot: AvailabilitySlot): boolean {
  if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) return false;
  return toMinutes(slot.startTime) < toMinutes(slot.endTime);
}

/** Aynı gün içinde çakışan aralıklar müsaitlik takvimini tutarsız yapar. */
export function findOverlappingSlots(slots: readonly AvailabilitySlot[]): AvailabilitySlot[] {
  const overlapping: AvailabilitySlot[] = [];

  for (let i = 0; i < slots.length; i += 1) {
    const current = slots[i];
    if (!current) continue;
    for (let j = i + 1; j < slots.length; j += 1) {
      const other = slots[j];
      if (!other || other.dayOfWeek !== current.dayOfWeek) continue;
      const overlaps =
        toMinutes(current.startTime) < toMinutes(other.endTime) &&
        toMinutes(other.startTime) < toMinutes(current.endTime);
      if (overlaps && !overlapping.includes(other)) overlapping.push(other);
    }
  }

  return overlapping;
}

/**
 * Verilen anın satıcının çalışma saatlerine denk gelip gelmediğini söyler.
 * Saat dilimi dönüşümü çağıran tarafın sorumluluğundadır; buraya satıcının yerel
 * saatine çevrilmiş bir tarih verilmelidir.
 */
export function isWithinAvailability(
  slots: readonly AvailabilitySlot[],
  localDate: Date,
): boolean {
  const minutes = localDate.getHours() * 60 + localDate.getMinutes();
  const day = localDate.getDay();

  return slots.some(
    (slot) =>
      slot.isActive &&
      slot.dayOfWeek === day &&
      toMinutes(slot.startTime) <= minutes &&
      minutes < toMinutes(slot.endTime),
  );
}

/** Randevu, teklifin en erken başlama tarihinden önce planlanamaz. */
export function isAppointmentDateAllowed(input: {
  scheduledAt: Date;
  availableFrom?: Date | null;
  now?: Date;
}): boolean {
  const now = input.now ?? new Date();
  if (input.scheduledAt.getTime() <= now.getTime()) return false;
  if (input.availableFrom && input.scheduledAt.getTime() < input.availableFrom.getTime()) {
    return false;
  }
  return true;
}
