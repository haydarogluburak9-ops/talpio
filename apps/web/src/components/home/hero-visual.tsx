'use client';

import {
  BadgeCheck,
  BadgePercent,
  Bookmark,
  Flame,
  Heart,
  MessageCircle,
  Plus,
  Search,
  Send,
  Share2,
  ThumbsUp,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { t } from '@/lib/i18n';

/** Landing hikâye şeridi — gerçekçi profil görselleri (pravatar). */
const STORY_AVATARS = [
  { labelKey: 'home.heroStoryYou' as const, src: 'https://i.pravatar.cc/96?img=5', isOwn: true as const },
  { labelKey: 'home.heroStoryLabel1' as const, src: 'https://i.pravatar.cc/96?img=47', isOwn: false as const },
  { labelKey: 'home.heroStoryLabel2' as const, src: 'https://i.pravatar.cc/96?img=12', isOwn: false as const },
  { labelKey: 'home.heroStoryLabel3' as const, src: 'https://i.pravatar.cc/96?img=32', isOwn: false as const },
  { labelKey: 'home.heroStoryLabel4' as const, src: 'https://i.pravatar.cc/96?img=68', isOwn: false as const },
] as const;

/**
 * Landing hero sağ kompozisyonu — mobilde taşma yapmaz, metin okunabilir kalır.
 */
export function HeroVisual() {
  return (
    <div className="hero-visual relative mx-auto h-[300px] w-full max-w-[20rem] overflow-hidden sm:h-[380px] sm:max-w-[24rem] sm:overflow-visible md:h-[440px] lg:mx-0 lg:h-[540px] lg:max-w-none xl:h-[560px]">
      <div
        className="pointer-events-none absolute inset-[8%] rounded-full opacity-70 blur-3xl"
        aria-hidden
        style={{
          background:
            'radial-gradient(circle at 55% 42%, rgb(255 90 10 / 0.22), rgb(8 24 44 / 0) 62%)',
        }}
      />

      {/* Trend — yalnızca geniş ekran */}
      <div className="landing-float landing-glass absolute top-2 right-0 z-10 hidden w-[13rem] rounded-2xl px-3.5 py-3 md:block lg:top-3 lg:right-[2%]">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 grid size-8 place-items-center rounded-lg bg-[#FF5A0A]/20 text-[#FF5A0A] shadow-[0_0_16px_rgb(255_90_10_/_0.25)]">
            <Flame className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">{t('home.heroTrendTitle')}</p>
            <p className="mt-0.5 text-xs leading-snug text-white/65">{t('home.heroTrendBody')}</p>
          </div>
        </div>
      </div>

      {/* Reactions — tablet+ */}
      <div className="landing-float absolute top-[22%] left-[4%] z-10 hidden flex-col gap-2.5 md:flex lg:left-[8%] lg:top-[20%]">
        <span className="landing-glass inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white">
          <Heart className="size-4 fill-red-500 text-red-500" aria-hidden />
          124
        </span>
        <span className="landing-glass inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white">
          <ThumbsUp className="size-4 fill-sky-400 text-sky-400" aria-hidden />
          86
        </span>
      </div>

      {/* Bookmark / Share — desktop */}
      <div className="landing-float absolute top-[28%] right-[6%] z-10 hidden flex-col gap-3 lg:flex xl:right-[8%]">
        <span className="landing-glass grid size-14 place-items-center rounded-full text-white">
          <Bookmark className="size-5" aria-hidden />
        </span>
        <span className="landing-glass grid size-14 place-items-center rounded-full text-white">
          <Send className="size-5" aria-hidden />
        </span>
      </div>

      {/* Phone — mobilde daha küçük, düşük z-index */}
      <div className="absolute top-0 left-1/2 z-[5] w-[min(88%,240px)] -translate-x-1/2 rotate-[2deg] sm:top-3 sm:w-[min(72%,280px)] sm:rotate-[4deg] md:w-[300px] lg:top-[14px] lg:left-[34%] lg:w-[390px] lg:max-w-none lg:translate-x-0 lg:rotate-[5deg] xl:left-[32%] xl:w-[420px]">
        <HeroPhonePreview />
      </div>

      {/* Yan kartlar — mobilde gizli */}
      <div className="absolute bottom-8 left-0 z-[6] hidden w-[260px] rotate-[4deg] sm:block lg:bottom-[48px] lg:left-[3%] lg:w-[270px] xl:left-[4%] xl:w-[280px]">
        <HeroRequestCard />
      </div>

      <div className="absolute right-0 bottom-5 z-[6] hidden w-[270px] rotate-[4deg] sm:block lg:bottom-[28px] lg:w-[290px] xl:w-[300px]">
        <HeroCampaignCard />
      </div>
    </div>
  );
}

function HeroPhonePreview() {
  return (
    <div className="landing-phone-frame relative overflow-hidden rounded-[2.15rem] p-[7px]">
      <div className="pointer-events-none absolute top-3 left-1/2 z-10 h-[18px] w-[86px] -translate-x-1/2 rounded-full bg-[#0B1220]/90" />
      <div className="overflow-hidden rounded-[1.75rem] bg-white text-[#111827] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.8)]">
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
          <span className="text-[11px] font-semibold tracking-wide text-[#111827]">9:41</span>
          <span className="text-sm font-bold tracking-tight text-[#FF5A0A]">Talpio</span>
          <span className="flex items-center gap-1 text-[#111827]">
            <span className="h-2 w-3.5 rounded-[1px] bg-[#111827]/80" />
            <span className="h-2.5 w-1.5 rounded-[1px] bg-[#111827]" />
          </span>
        </div>

        <p className="px-3.5 pb-1 text-[10px] font-semibold tracking-wide text-[#667085] uppercase">
          {t('social.storiesTitle')}
        </p>
        <div className="flex gap-2.5 overflow-hidden px-3.5 pb-2.5">
          {STORY_AVATARS.map((story) => (
            <div key={story.labelKey} className="flex w-12 shrink-0 flex-col items-center gap-1">
              <span
                className={`relative size-11 overflow-hidden rounded-full ring-2 ring-offset-1 ${
                  story.isOwn
                    ? 'ring-[#FF5A0A] ring-offset-white'
                    : 'ring-[#FF5A0A]/55 ring-offset-white'
                }`}
              >
                <Image
                  src={story.src}
                  alt=""
                  fill
                  sizes="44px"
                  className="object-cover"
                  unoptimized
                />
                {story.isOwn ? (
                  <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-[#FF5A0A] text-white ring-2 ring-white">
                    <Plus className="size-2.5" aria-hidden />
                  </span>
                ) : null}
              </span>
              <span className="max-w-[3rem] truncate text-[10px] font-medium text-[#667085]">
                {t(story.labelKey)}
              </span>
            </div>
          ))}
        </div>

        <div className="mx-3.5 flex items-center gap-2 rounded-full bg-[#F4F6F8] px-3.5 py-2.5 text-[12px] text-[#667085] shadow-[inset_0_1px_2px_rgb(16_24_40_/_0.06)]">
          <Search className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{t('social.searchPlaceholder')}</span>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2 px-3.5">
          <Link
            href="/tedarik"
            className="rounded-xl bg-[#FFF1E8] px-2 py-2.5 text-center text-[12px] font-semibold text-[#FF5A0A] shadow-[0_1px_0_rgb(255_255_255_/_0.8)_inset]"
          >
            {t('nav.newRequest')}
          </Link>
          <Link
            href="/kesfet"
            className="rounded-xl bg-[#FF5A0A] px-2 py-2.5 text-center text-[12px] font-semibold text-white shadow-[0_6px_14px_rgb(255_90_10_/_0.35)]"
          >
            {t('social.quickDeal')}
          </Link>
        </div>

        <div className="mt-3 flex gap-3 overflow-hidden border-b border-[#E8EBF0] px-3.5 text-[12px] font-semibold">
          {[
            t('social.feedTabAll'),
            t('social.feedTabDeals'),
            t('social.feedTabRequests'),
            t('social.feedTabCampaigns'),
          ].map((tab, index) => (
            <span
              key={tab}
              className={
                index === 0
                  ? 'border-b-2 border-[#FF5A0A] pb-2 text-[#FF5A0A]'
                  : 'pb-2 text-[#667085]'
              }
            >
              {tab}
            </span>
          ))}
        </div>

        <div className="space-y-2.5 p-3.5">
          <div className="flex items-center gap-2">
            <span className="relative size-9 shrink-0 overflow-hidden rounded-full shadow-[0_2px_6px_rgb(16_185_129_/_0.35)]">
              <Image
                src="https://i.pravatar.cc/72?img=15"
                alt=""
                fill
                sizes="36px"
                className="object-cover"
                unoptimized
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 truncate text-[13px] font-semibold">
                {t('home.heroStoreName')}
                <BadgeCheck className="size-3.5 fill-sky-500 text-white" aria-hidden />
              </p>
              <p className="text-[11px] text-[#667085]">{t('home.heroStoreMeta')}</p>
            </div>
            <span className="rounded-full bg-[#FFF1E8] px-2 py-0.5 text-[11px] font-bold tracking-wide text-[#FF5A0A]">
              {t('home.heroDealBadge')}
            </span>
          </div>

          <div className="flex gap-3">
            <div className="relative h-[6.5rem] w-[5.75rem] shrink-0 overflow-hidden rounded-xl bg-[#F3F5F7] shadow-[0_8px_18px_rgb(16_24_40_/_0.12)]">
              <Image
                src="/brand/landing-product-oil.png"
                alt=""
                fill
                sizes="96px"
                className="object-cover"
                priority
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] leading-snug font-bold tracking-[-0.01em]">
                Castrol EDGE 5W-30 20 LT
              </p>
              <p className="mt-1.5 text-[11px] text-[#98A2B3]">
                {t('home.heroNormalPrice')}{' '}
                <span className="text-[#667085] line-through decoration-[#98A2B3]">€92</span>
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-[#667085]">{t('home.heroSpecialPrice')}</p>
              <div className="mt-0.5 flex flex-wrap items-end gap-2">
                <p className="text-[22px] leading-none font-extrabold tracking-[-0.03em] text-[#FF5A0A]">
                  €77
                </p>
                <span className="rounded-md bg-[#FF5A0A] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-[0_4px_10px_rgb(255_90_10_/_0.4)]">
                  {t('home.heroDiscount', { percent: '16' })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[t('home.heroStockChip'), t('home.heroValidChip'), t('home.heroCityChip')].map((chip) => (
              <span
                key={chip}
                className="rounded-lg bg-[#F4F6F8] px-2 py-1 text-[11px] font-medium text-[#667085]"
              >
                {chip}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3 text-[#98A2B3]">
              <Heart className="size-4" aria-hidden />
              <MessageCircle className="size-4" aria-hidden />
              <Bookmark className="size-4" aria-hidden />
              <Share2 className="size-4" aria-hidden />
            </div>
            <Link
              href="/kesfet"
              className="inline-flex h-9 items-center rounded-lg bg-[#FF5A0A] px-3.5 text-[12px] font-bold text-white shadow-[0_8px_16px_rgb(255_90_10_/_0.38)]"
            >
              {t('home.heroAskOffer')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroRequestCard() {
  return (
    <Link
      href="/tedarik"
      className="landing-card-premium block rounded-2xl border border-[rgb(15_23_42_/_0.08)] bg-white p-4 transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-2.5">
        <span className="relative size-10 shrink-0 overflow-hidden rounded-full shadow-[0_4px_10px_rgb(13_27_42_/_0.28)]">
          <Image
            src="https://i.pravatar.cc/80?img=33"
            alt=""
            fill
            sizes="40px"
            className="object-cover"
            unoptimized
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <p className="truncate text-sm font-semibold text-[#111827]">{t('home.heroBuyerName')}</p>
            <span className="shrink-0 rounded-full bg-[#FFF1E8] px-2 py-0.5 text-[11px] font-bold tracking-wide text-[#FF5A0A]">
              {t('home.heroRequestBadge')}
            </span>
          </div>
          <p className="text-xs text-[#667085]">{t('home.heroBuyerMeta')}</p>
        </div>
      </div>

      <p className="mt-3 text-[15px] leading-snug font-bold tracking-[-0.015em] text-[#111827]">
        {t('home.heroRequestTitle')}
      </p>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {[t('home.heroRequestChipQty'), t('home.heroRequestChipGrade'), t('home.heroRequestChipEta')].map((chip) => (
          <span
            key={chip}
            className="rounded-full bg-[#F4F6F8] px-2.5 py-1 text-[11px] font-medium text-[#475467] ring-1 ring-[#E8EBF0]"
          >
            {chip}
          </span>
        ))}
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {[33, 12, 68].map((img) => (
              <span
                key={img}
                className="relative size-6 overflow-hidden rounded-full ring-2 ring-white"
              >
                <Image
                  src={`https://i.pravatar.cc/48?img=${img}`}
                  alt=""
                  fill
                  sizes="24px"
                  className="object-cover"
                  unoptimized
                />
              </span>
            ))}
          </div>
          <p className="text-xs font-semibold text-[#344054]">{t('job.offerCount', { count: 12 })}</p>
        </div>
        <span className="inline-flex h-9 items-center rounded-lg bg-[#FF5A0A] px-3.5 text-xs font-bold text-white shadow-[0_8px_16px_rgb(255_90_10_/_0.35)]">
          {t('home.heroAskOffer')}
        </span>
      </div>
    </Link>
  );
}

function HeroCampaignCard() {
  return (
    <Link
      href="/kesfet"
      className="landing-card-premium block overflow-hidden rounded-2xl border border-[rgb(15_23_42_/_0.08)] bg-white transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-2.5 p-4 pb-2">
        <span className="relative size-10 shrink-0 overflow-hidden rounded-full shadow-[0_4px_10px_rgb(13_27_42_/_0.28)]">
          <Image
            src="https://i.pravatar.cc/80?img=52"
            alt=""
            fill
            sizes="40px"
            className="object-cover"
            unoptimized
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <p className="flex items-center gap-1 truncate text-sm font-semibold text-[#111827]">
              {t('home.heroCampaignStore')}
              <BadgeCheck className="size-3.5 fill-sky-500 text-white" aria-hidden />
            </p>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold tracking-wide text-emerald-700">
              {t('social.campaignBadge')}
            </span>
          </div>
          <p className="text-xs text-[#667085]">{t('home.heroBuyerMeta')}</p>
        </div>
      </div>

      <p className="px-4 text-[15px] leading-snug font-bold tracking-[-0.015em] text-[#111827]">
        {t('home.heroCampaignTitle')}
      </p>

      <div className="relative mx-4 mt-2.5 h-28 overflow-hidden rounded-xl bg-[#111827] shadow-[0_10px_24px_rgb(16_24_40_/_0.18)]">
        <Image
          src="/brand/landing-product-bolts.png"
          alt=""
          fill
          sizes="260px"
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/35 via-transparent to-[#FF5A0A]/15" />
        <span className="absolute right-2.5 bottom-2.5 grid size-14 place-content-center rounded-full bg-[#FF5A0A] text-center text-[11px] leading-tight font-extrabold text-white shadow-[0_10px_22px_rgb(255_90_10_/_0.5)] ring-2 ring-white/40">
          %20
          <br />
          {t('home.heroSaleBadge')}
        </span>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5 text-[#667085]">
          <span className="inline-flex items-center gap-1 text-xs font-medium">
            <Heart className="size-4 fill-red-500 text-red-500" aria-hidden />
            87
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium">
            <MessageCircle className="size-4" aria-hidden />
            6
          </span>
        </div>
        <span className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#FF5A0A] bg-[#FFF7F2] px-3 text-xs font-bold text-[#FF5A0A]">
          <BadgePercent className="size-3.5" aria-hidden />
          {t('home.heroAskOffer')}
        </span>
      </div>
    </Link>
  );
}
