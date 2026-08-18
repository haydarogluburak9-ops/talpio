/**
 * Satıcı ol hero'sunun sağındaki görsel düzlem.
 * Mağaza vitrini + kampanya yayını çağrışımı; kart / rozet overlay yok.
 */
export function SellerHeroVisual() {
  return (
    <div
      aria-hidden
      className="seller-hero-visual relative mx-auto aspect-[5/4] w-full max-w-sm sm:max-w-md lg:mx-0 lg:max-w-none"
    >
      <div className="absolute inset-[4%] rounded-[2rem] bg-gradient-to-br from-brand-100 via-brand-200/90 to-brand-400/80 ring-1 ring-white/35" />
      <div className="absolute inset-[18%_42%_22%_12%] rounded-2xl bg-brand-900/95 ring-1 ring-white/10" />
      <div className="absolute inset-[28%_14%_34%_48%] rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600" />
      <div className="absolute inset-[58%_18%_14%_18%] rounded-xl bg-white/55 ring-1 ring-white/40" />
      <div className="absolute inset-[64%_46%_20%_24%] h-auto rounded-md bg-accent-500" />
      <div className="seller-orbit absolute left-[62%] top-[18%] size-3 rounded-full bg-accent-400" />
      <div className="seller-orbit-delay absolute left-[72%] top-[28%] size-2 rounded-full bg-white/70" />
    </div>
  );
}
