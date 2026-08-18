import type { RequestView } from '@talpio/types';

/** JobRequest satırını salt-okunur RequestView'a dönüştürür. */
export function toRequestViewFromJobRequest(job: {
  id: string;
  title: string;
  description: string;
  status: string;
  categoryId: string;
  customerId: string;
  cityId: string;
  districtId: string;
  budgetMinor: number | null;
  currency: string;
  publishedAt: Date | null;
  commerceRequestId?: string | null;
}): RequestView {
  return {
    id: job.id,
    kind: 'job_request',
    title: job.title,
    description: job.description,
    status: job.status,
    categoryId: job.categoryId,
    buyerUserId: job.customerId,
    cityId: job.cityId,
    districtId: job.districtId,
    budgetMinor: job.budgetMinor,
    currency: job.currency,
    publishedAt: job.publishedAt?.toISOString() ?? null,
    commerceRequestId: job.commerceRequestId ?? null,
    jobRequestId: job.id,
  };
}

export async function linkJobRequestToCommerceRequest(
  prisma: {
    jobRequest: {
      update: (args: {
        where: { id: string };
        data: { commerceRequestId: string };
      }) => Promise<unknown>;
    };
  },
  jobRequestId: string,
  commerceRequestId: string,
): Promise<void> {
  await prisma.jobRequest.update({
    where: { id: jobRequestId },
    data: { commerceRequestId },
  });
}
