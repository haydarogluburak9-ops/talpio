'use client';

import { nextJobStatuses } from '@ustapilot/business-logic';
import { JOB_STATUS_TONES } from '@ustapilot/config';
import { formatDate, formatMoney, jobStatusLabel } from '@ustapilot/localization';
import { JobRequestStatus, JobSize, JobTimeSlot, type JobRequest } from '@ustapilot/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  LoadingState,
  StatusPill,
} from '@ustapilot/ui';
import { useState } from 'react';

import { publicEnv } from '@/lib/env';
import { OfferList } from '@/features/offers/offer-list';
import { t } from '@/lib/i18n';

import { useCancelJob, useJob } from './use-jobs';

const SIZE_LABELS: Record<JobSize, string> = {
  [JobSize.SMALL]: 'Küçük',
  [JobSize.MEDIUM]: 'Orta',
  [JobSize.LARGE]: 'Büyük',
  [JobSize.UNKNOWN]: 'Belirtilmedi',
};

const TIME_SLOT_LABELS: Record<JobTimeSlot, string> = {
  [JobTimeSlot.MORNING]: 'Sabah',
  [JobTimeSlot.AFTERNOON]: 'Öğleden sonra',
  [JobTimeSlot.EVENING]: 'Akşam',
  [JobTimeSlot.FLEXIBLE]: 'Fark etmez',
};

export function JobDetail({ jobId }: { jobId: string }) {
  const job = useJob(jobId);

  if (job.isError) {
    return (
      <ErrorState
        title={t('status.errorTitle')}
        description="Talep yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin."
        action={{ label: t('common.retry'), onClick: () => void job.refetch() }}
      />
    );
  }

  if (!job.data) return <LoadingState label="Talep yükleniyor" />;

  return <JobDetailView job={job.data} />;
}

function JobDetailView({ job }: { job: JobRequest }) {
  const locale = publicEnv.defaultLocale;
  const cancelJob = useCancelJob(job.id);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const canCancel = nextJobStatuses(job.status).includes(JobRequestStatus.CANCELLED);
  // Usta seçildikten sonra teklif kabulü kapanır; kural iş mantığında tanımlıdır.
  const canAcceptOffers = nextJobStatuses(job.status).includes(
    JobRequestStatus.PROVIDER_SELECTED,
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CardTitle className="text-xl">{job.title}</CardTitle>
            <StatusPill label={jobStatusLabel(job.status, locale)} tone={JOB_STATUS_TONES[job.status]} />
          </div>
          <p className="text-sm text-foreground-muted">
            {job.category.name}
            {job.subcategory ? ` · ${job.subcategory.name}` : ''} · {job.address.districtName},{' '}
            {job.address.cityName}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="whitespace-pre-line text-sm text-foreground">{job.description}</p>

          <div className="flex flex-wrap gap-2">
            {job.isUrgent ? <Badge tone="danger">{t('job.urgent')}</Badge> : null}
            {job.inspectionRequired ? <Badge tone="info">{t('job.inspectionRequired')}</Badge> : null}
            {job.materialsIncluded ? <Badge tone="info">{t('job.materialsIncluded')}</Badge> : null}
          </div>

          {job.attachments.length > 0 ? (
            <ul className="flex flex-wrap gap-3" aria-label={t('upload.photosLabel')}>
              {job.attachments.map((attachment) => (
                <li key={attachment.id}>
                  <a href={attachment.url} target="_blank" rel="noreferrer">
                    {/* Görseller nesne deposundan gelir; Next optimizasyonu ayrı yapılandırma
                        gerektirdiğinden düz `img` kullanılır. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={attachment.url}
                      alt=""
                      className="size-28 rounded-[--radius-control] border border-border object-cover"
                    />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Talep bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <DetailRow label={t('job.budget')} value={job.budget ? formatMoney(job.budget, locale) : '—'} />
            <DetailRow label="İşin büyüklüğü" value={SIZE_LABELS[job.size]} />
            <DetailRow
              label="Tercih edilen gün"
              value={job.preferredDate ? formatDate(job.preferredDate, locale) : 'Esnek'}
            />
            <DetailRow label="Tercih edilen zaman" value={TIME_SLOT_LABELS[job.preferredTimeSlot]} />
            <DetailRow label="Oluşturulma" value={formatDate(job.createdAt, locale)} />
            <DetailRow
              label="Son geçerlilik"
              value={job.expiresAt ? formatDate(job.expiresAt, locale) : '—'}
            />
            <DetailRow
              label="Adres"
              value={
                job.address.addressLine ??
                `${job.address.districtName}, ${job.address.cityName} (açık adres gizli)`
              }
              className="sm:col-span-2"
            />
          </dl>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">{t('job.offersTitle')}</h2>
          {job.offerCount > 0 ? (
            <p className="text-sm text-foreground-muted">
              {t('job.offerCount', { count: job.offerCount })}
            </p>
          ) : null}
        </div>
        <OfferList jobId={job.id} decidable={canAcceptOffers} />
      </section>

      {canCancel ? (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-5 sm:pt-6">
            {cancelJob.isError ? (
              <p role="alert" className="text-sm text-danger-on-surface">
                Talep iptal edilemedi. Lütfen tekrar deneyin.
              </p>
            ) : null}

            {confirmingCancel ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-foreground">
                  Talebi iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={cancelJob.isPending}
                  onClick={() => cancelJob.mutate(undefined)}
                >
                  Evet, iptal et
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmingCancel(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setConfirmingCancel(true)}>
                Talebi iptal et
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function DetailRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  );
}
