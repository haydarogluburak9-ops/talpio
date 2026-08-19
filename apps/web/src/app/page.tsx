import { Container, cn } from '@talpio/ui';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ClipboardPlus,
  Compass,
  Headphones,
  Plus,
  Scale,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { HeroVisual } from '@/components/home/hero-visual';
import { HomeFeedRedirect } from '@/features/social/home-feed-redirect';
import { t } from '@/lib/i18n';
import { applyRequestLocale } from '@/lib/server-locale';

/** Ürün yetenekleri — üretim istatistiği değildir. */
const stats = [
  { icon: ClipboardPlus, labelKey: 'home.statRequest' as const },
  { icon: Scale, labelKey: 'home.statOffer' as const },
  { icon: TrendingUp, labelKey: 'home.statDeal' as const },
  { icon: Compass, labelKey: 'home.statDiscover' as const },
  { icon: Headphones, labelKey: 'home.statMessage' as const },
  { icon: Building2, labelKey: 'home.statOps' as const },
] as const;

const benefits = [
  { icon: Shield, labelKey: 'home.benefitSecure' as const },
  { icon: Zap, labelKey: 'home.benefitFast' as const },
  { icon: Sparkles, labelKey: 'home.benefitEasy' as const },
  { icon: TrendingUp, labelKey: 'home.benefitProfitable' as const },
] as const;

const features = [
  {
    href: '/tedarik',
    icon: ClipboardPlus,
    tone: 'bg-[#FFF1E8] text-[#FF5A0A]',
    titleKey: 'home.featureRequestTitle' as const,
    bodyKey: 'home.featureRequestBody' as const,
    ctaKey: 'home.featureRequestCta' as const,
  },
  {
    href: '/kesfet',
    icon: Compass,
    tone: 'bg-sky-50 text-sky-700',
    titleKey: 'home.featureDealsTitle' as const,
    bodyKey: 'home.featureDealsBody' as const,
    ctaKey: 'home.featureDealsCta' as const,
  },
  {
    href: '/nasil-calisir',
    icon: Scale,
    tone: 'bg-emerald-50 text-emerald-700',
    titleKey: 'home.featureCompareTitle' as const,
    bodyKey: 'home.featureCompareBody' as const,
    ctaKey: 'home.featureCompareCta' as const,
  },
  {
    href: '/kayit',
    icon: TrendingUp,
    tone: 'bg-violet-50 text-violet-700',
    titleKey: 'home.featureGrowTitle' as const,
    bodyKey: 'home.featureGrowBody' as const,
    ctaKey: 'home.featureGrowCta' as const,
  },
] as const;

const proofAvatars = [
  'https://i.pravatar.cc/72?img=5',
  'https://i.pravatar.cc/72?img=47',
  'https://i.pravatar.cc/72?img=12',
  'https://i.pravatar.cc/72?img=32',
  'https://i.pravatar.cc/72?img=68',
] as const;

export default async function HomePage() {
  await applyRequestLocale();
  return (
    <>
      <HomeFeedRedirect />

      <section className="relative isolate overflow-hidden bg-[#07192D] text-white">
        <div className="landing-hero-atmosphere pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative z-0 mx-auto grid w-[calc(100%-3rem)] max-w-[1500px] items-center gap-8 py-8 sm:w-[calc(100%-4rem)] sm:py-10 lg:min-h-[560px] lg:grid-cols-[42%_58%] lg:gap-6 lg:py-6 xl:min-h-[580px]">
          <div className="hero-copy order-1 flex max-w-[590px] flex-col lg:justify-center">
            <p className="landing-glass inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-white/90">
              <BadgeCheck className="size-3.5 text-[#FF5A0A]" aria-hidden />
              {t('home.heroBadge')}
            </p>

            <h1 className="mt-5 max-w-[590px] font-sans text-[clamp(2.5rem,4vw,4.125rem)] font-extrabold leading-[1.02] tracking-[-0.035em] text-balance-safe">
              <span className="block">{t('home.heroTitleBefore')}</span>
              <span className="block">
                <span className="text-[#FF5A0A]">{t('home.heroTitleAccent')}</span>
                {t('home.heroTitleMid')}
              </span>
              <span className="block">{t('home.heroTitleAfter')}</span>
            </h1>

            <p className="mt-[26px] max-w-[560px] text-[18px] leading-[1.65] text-white/[0.72] text-balance-safe">
              {t('home.heroSubtitle')}
            </p>

            <div className="mt-7 flex flex-col gap-3.5 sm:flex-row sm:items-center sm:gap-3.5">
              <Link
                href="/kayit"
                aria-label={t('home.ctaCreateRequest')}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-[10px] bg-[#FF5A0A] px-[26px] text-[15px] font-semibold text-white shadow-[0_12px_28px_rgb(255_90_10_/_0.38)] transition-colors hover:bg-[#EA4B00]"
              >
                {t('home.ctaCreateRequest')}
                <Plus className="size-4" aria-hidden />
              </Link>
              <Link
                href="/kayit"
                aria-label={t('home.ctaExploreDeals')}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-[10px] border border-white/20 bg-white/[0.04] px-[26px] text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)] transition-colors hover:bg-white/10"
              >
                <Search className="size-4" aria-hidden />
                {t('home.ctaExploreDeals')}
              </Link>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex -space-x-2">
                {proofAvatars.map((src) => (
                  <span
                    key={src}
                    className="relative size-9 overflow-hidden rounded-full ring-2 ring-[#07192D]"
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="36px"
                      className="object-cover"
                      unoptimized
                    />
                  </span>
                ))}
              </div>
              <p className="text-sm text-white/75">
                <span className="font-bold text-[#FF5A0A]">{t('home.socialProofCount')}</span>{' '}
                {t('home.socialProofRest')}
              </p>
            </div>
          </div>

          <div className="order-2 min-w-0 lg:order-2">
            <HeroVisual />
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-[#06111D] text-white">
        <div className="mx-auto flex min-h-[96px] w-[calc(100%-3rem)] max-w-[1500px] flex-col justify-center gap-3 py-5 sm:w-[calc(100%-4rem)]">
          <ul className="grid w-full grid-cols-2 gap-y-5 sm:grid-cols-3 lg:grid-cols-6 lg:gap-0">
            {stats.map((stat, index) => (
              <li
                key={stat.labelKey}
                className={cn(
                  'flex flex-col items-start gap-1.5 px-2 sm:items-center sm:px-4 sm:text-center',
                  index > 0 && 'lg:border-l lg:border-white/[0.08]',
                )}
              >
                <stat.icon className="size-5 stroke-[1.6] text-[#FF5A0A]" aria-hidden />
                <p className="text-sm font-semibold tracking-[-0.02em] text-white sm:text-base">
                  {t(stat.labelKey)}
                </p>
              </li>
            ))}
          </ul>
          <p className="text-center text-[11px] text-white/45">{t('home.statsDisclaimer')}</p>
        </div>
      </section>

      <section className="bg-[#F8FAFC] text-[#101828]">
        <Container
          size="wide"
          className="grid gap-10 py-12 sm:py-14 lg:grid-cols-[minmax(0,0.32fr)_minmax(0,0.68fr)] lg:items-start lg:gap-12"
        >
          <div>
            <h2 className="font-sans text-[1.75rem] font-extrabold leading-[1.15] tracking-tight sm:text-[2.15rem]">
              {t('home.featuresTitleBefore')}{' '}
              <span className="text-[#FF5A0A]">{t('home.featuresTitleAccent')}</span>
            </h2>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-[#667085]">
              {t('home.featuresHint')}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {benefits.map((item) => (
                <li
                  key={item.labelKey}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E6EAF0] bg-white px-3.5 py-1.5 text-xs font-medium text-[#101828] shadow-[0_1px_2px_rgb(16_24_40_/_0.04)]"
                >
                  <item.icon className="size-3.5 text-[#FF5A0A]" aria-hidden />
                  {t(item.labelKey)}
                </li>
              ))}
            </ul>
          </div>

          <ul className="grid gap-5 sm:grid-cols-2">
            {features.map((feature) => (
              <li
                key={feature.titleKey}
                className="min-h-[196px] rounded-[20px] border border-[#E6EAF0] bg-white p-6 shadow-[0_10px_30px_rgb(16_24_40_/_0.05)] transition-shadow hover:shadow-[0_16px_36px_rgb(16_24_40_/_0.08)]"
              >
                <span
                  className={cn(
                    'grid size-12 place-items-center rounded-2xl shadow-[inset_0_1px_0_rgb(255_255_255_/_0.7)]',
                    feature.tone,
                  )}
                >
                  <feature.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-[15px] font-bold tracking-[-0.01em] text-[#101828]">
                  {t(feature.titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#667085]">{t(feature.bodyKey)}</p>
                <Link
                  href={feature.href}
                  className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#FF5A0A] hover:text-[#EA4B00]"
                >
                  {t(feature.ctaKey)}
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
