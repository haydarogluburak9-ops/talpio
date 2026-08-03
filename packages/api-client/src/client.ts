import { HttpClient } from './http-client';
import type { HttpClientOptions } from './http-client';
import { createAdminResource } from './resources/admin';
import { createAuthResource } from './resources/auth';
import { createCatalogResource } from './resources/catalog';
import { createHealthResource } from './resources/health';
import { createJobsResource } from './resources/jobs';
import { createFilesResource } from './resources/files';
import { createMessagesResource } from './resources/messages';
import { createOffersResource } from './resources/offers';
import { createOrdersResource } from './resources/orders';
import { createPaymentsResource } from './resources/payments';
import { createProvidersResource } from './resources/providers';
import { createReviewsResource } from './resources/reviews';
import { createUsersResource } from './resources/users';

/**
 * Uygulama düzeyinde tek giriş noktası.
 *
 * Kaynak modülleri (auth, jobs, offers ...) ilgili backend uçları devreye
 * girdikçe `resources/` altına eklenir ve burada bağlanır. Böylece istemciler
 * ham yol dizgileriyle değil, tiplenmiş çağrılarla çalışır.
 */
export function createApiClient(options: HttpClientOptions) {
  const http = new HttpClient(options);

  return {
    http,
    setLocale: (locale: string) => http.setLocale(locale),
    health: createHealthResource(http),
    auth: createAuthResource(http),
    catalog: createCatalogResource(http),
    jobs: createJobsResource(http),
    offers: createOffersResource(http),
    orders: createOrdersResource(http),
    payments: createPaymentsResource(http),
    messages: createMessagesResource(http),
    files: createFilesResource(http),
    users: createUsersResource(http),
    providers: createProvidersResource(http),
    reviews: createReviewsResource(http),
    admin: createAdminResource(http),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
