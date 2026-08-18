import {
  findOverlappingSlots,
  isAppointmentDateAllowed,
  isValidSlot,
  isWithinAvailability,
} from './availability';
import type { AvailabilitySlot } from './availability';

const weekday: AvailabilitySlot = {
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '18:00',
  isActive: true,
};

describe('isValidSlot', () => {
  it('başlangıcı bitişten önce olan aralığı kabul eder', () => {
    expect(isValidSlot(weekday)).toBe(true);
  });

  it('ters aralığı reddeder', () => {
    expect(isValidSlot({ ...weekday, startTime: '18:00', endTime: '09:00' })).toBe(false);
  });

  it('geçersiz gün numarasını reddeder', () => {
    expect(isValidSlot({ ...weekday, dayOfWeek: 7 })).toBe(false);
  });
});

describe('findOverlappingSlots', () => {
  it('aynı gündeki çakışmayı bulur', () => {
    const overlapping = findOverlappingSlots([
      weekday,
      { dayOfWeek: 1, startTime: '17:00', endTime: '20:00', isActive: true },
    ]);
    expect(overlapping).toHaveLength(1);
  });

  it('farklı günlerde çakışma saymaz', () => {
    const overlapping = findOverlappingSlots([
      weekday,
      { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isActive: true },
    ]);
    expect(overlapping).toHaveLength(0);
  });

  it('bitişik aralıkları çakışma saymaz', () => {
    const overlapping = findOverlappingSlots([
      weekday,
      { dayOfWeek: 1, startTime: '18:00', endTime: '20:00', isActive: true },
    ]);
    expect(overlapping).toHaveLength(0);
  });
});

describe('isWithinAvailability', () => {
  it('çalışma saati içindeki anı kabul eder', () => {
    // 2 Mart 2026 Pazartesi, yerel saat 10:00
    expect(isWithinAvailability([weekday], new Date(2026, 2, 2, 10, 0))).toBe(true);
  });

  it('çalışma saati dışını reddeder', () => {
    expect(isWithinAvailability([weekday], new Date(2026, 2, 2, 20, 0))).toBe(false);
  });

  it('pasif aralığı dikkate almaz', () => {
    expect(
      isWithinAvailability([{ ...weekday, isActive: false }], new Date(2026, 2, 2, 10, 0)),
    ).toBe(false);
  });
});

describe('isAppointmentDateAllowed', () => {
  const now = new Date('2026-03-01T10:00:00.000Z');

  it('gelecekteki randevuyu kabul eder', () => {
    expect(
      isAppointmentDateAllowed({ scheduledAt: new Date('2026-03-03T10:00:00.000Z'), now }),
    ).toBe(true);
  });

  it('geçmiş tarihi reddeder', () => {
    expect(
      isAppointmentDateAllowed({ scheduledAt: new Date('2026-02-28T10:00:00.000Z'), now }),
    ).toBe(false);
  });

  it('satıcının müsait olduğu tarihten önceye randevu vermez', () => {
    expect(
      isAppointmentDateAllowed({
        scheduledAt: new Date('2026-03-02T10:00:00.000Z'),
        availableFrom: new Date('2026-03-05T10:00:00.000Z'),
        now,
      }),
    ).toBe(false);
  });
});
