'use client';

import { BadgeCheck, Heart, MessageCircle, Plus } from 'lucide-react';
import Image from 'next/image';

import { t } from '@/lib/i18n';

const STORY_FRAMES = [
  {
    src: 'https://i.pravatar.cc/400?img=47',
    className: 'left-[4%] -rotate-6 z-[1]',
    badge: null as null | 'heart' | 'deal',
  },
  {
    src: 'https://i.pravatar.cc/400?img=12',
    className: 'left-1/2 -translate-x-1/2 z-[3]',
    badge: 'heart' as const,
  },
  {
    src: 'https://i.pravatar.cc/400?img=32',
    className: 'right-[4%] rotate-6 z-[2]',
    badge: 'deal' as const,
  },
] as const;

function StoryFrame({
  src,
  className,
  badge,
}: {
  src: string;
  className: string;
  badge: null | 'heart' | 'deal';
}) {
  return (
    <div className={`absolute top-0 h-full w-[46%] ${className}`}>
      <div className="relative h-full overflow-hidden rounded-[1.35rem] border-[3px] border-white bg-white shadow-[0_18px_40px_rgb(16_24_40_/_0.14),0_0_0_1px_rgb(232_235_240_/_0.9)]">
        <Image src={src} alt="" fill sizes="180px" className="object-cover" unoptimized />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/15" />

        {badge === 'heart' ? (
          <span className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/95 text-red-500 shadow-[0_4px_14px_rgb(16_24_40_/_0.12)]">
            <Heart className="size-4 fill-current" aria-hidden />
          </span>
        ) : null}

        {badge === 'deal' ? (
          <span className="absolute top-3 left-3 rounded-full bg-[#FF5A0A] px-2.5 py-1 text-[10px] font-bold tracking-wide text-white shadow-[0_4px_12px_rgb(255_90_10_/_0.35)]">
            {t('home.heroDealBadge')}
          </span>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-3 pb-3 pt-10">
          <p className="truncate text-xs font-semibold text-white">{t('home.heroStoreName')}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-white/80">
            <BadgeCheck className="size-3 fill-sky-400 text-white" aria-hidden />
            {t('home.heroStoreMeta')}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Auth sol panel — açık zemin, Instagram tarzı üst üste hikâye kartları.
 */
export function AuthHeroVisual() {
  return (
    <div className="relative mx-auto h-[220px] w-full max-w-[420px] sm:h-[240px] lg:h-[260px]">
      <div
        className="pointer-events-none absolute inset-[8%] rounded-full blur-3xl"
        aria-hidden
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgb(255 90 10 / 0.12), rgb(255 255 255 / 0) 68%)',
        }}
      />

      <div className="relative mx-auto h-full w-full max-w-[340px]">
        {STORY_FRAMES.map((frame) => (
          <StoryFrame key={frame.src} src={frame.src} className={frame.className} badge={frame.badge} />
        ))}

        <span className="absolute -bottom-1 left-[6%] z-[4] inline-flex items-center gap-1.5 rounded-full border border-[#E8EBF0] bg-white px-3 py-1.5 text-xs font-semibold text-[#344054] shadow-[0_8px_20px_rgb(16_24_40_/_0.08)]">
          <Heart className="size-3.5 fill-red-500 text-red-500" aria-hidden />
          124
        </span>

        <span className="absolute right-0 bottom-[20%] z-[4] inline-flex items-center gap-1.5 rounded-full border border-[#E8EBF0] bg-white px-3 py-1.5 text-xs font-semibold text-[#344054] shadow-[0_8px_20px_rgb(16_24_40_/_0.08)]">
          <MessageCircle className="size-3.5 text-[#FF5A0A]" aria-hidden />
          18
        </span>

        <span className="absolute top-[4%] left-0 z-[4] grid size-10 place-items-center rounded-full border border-[#E8EBF0] bg-white text-[#FF5A0A] shadow-[0_8px_20px_rgb(16_24_40_/_0.08)]">
          <Plus className="size-4" aria-hidden />
        </span>
      </div>
    </div>
  );
}
