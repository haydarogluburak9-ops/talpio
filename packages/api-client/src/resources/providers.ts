import { API_ROUTES } from '@talpio/config';
import type {
  DocumentType,
  ProviderDocument,
  ProviderProfile,
  ProviderService,
  ProviderSummary,
} from '@talpio/types';

import type { HttpClient } from '../http-client';

export interface UpdateProviderProfileBody {
  /** `null` işletme adını kaldırır. */
  businessName?: string | null;
  about?: string | null;
  experienceYears?: number | null;
  acceptsUrgentJobs?: boolean;
  canIssueInvoice?: boolean;
}

export interface ProviderServiceInput {
  categoryId: string;
  subcategoryId?: string | null;
  startingPriceMinor?: number | null;
}

export function createProvidersResource(http: HttpClient) {
  return {
    getMe(signal?: AbortSignal): Promise<ProviderProfile> {
      return http.get<ProviderProfile>(API_ROUTES.providers.me, {
        ...(signal ? { signal } : {}),
      });
    },

    updateMe(body: UpdateProviderProfileBody): Promise<ProviderProfile> {
      return http.patch<ProviderProfile>(API_ROUTES.providers.me, body);
    },

    getById(id: string, signal?: AbortSignal): Promise<ProviderSummary> {
      return http.get<ProviderSummary>(API_ROUTES.providers.byId(id), {
        ...(signal ? { signal } : {}),
      });
    },

    listMyServices(signal?: AbortSignal): Promise<ProviderService[]> {
      return http.get<ProviderService[]>(API_ROUTES.providers.services, {
        ...(signal ? { signal } : {}),
      });
    },

    /** Listenin tamamı gönderilir; gönderilmeyen hizmetler kaldırılır. */
    replaceMyServices(services: ProviderServiceInput[]): Promise<ProviderService[]> {
      return http.put<ProviderService[]>(API_ROUTES.providers.services, { services });
    },

    /** Listenin tamamı gönderilir; gönderilmeyen ilçeler kaldırılır. */
    replaceMyServiceAreas(districtIds: string[]): Promise<ProviderProfile> {
      return http.put<ProviderProfile>(API_ROUTES.providers.serviceAreas, { districtIds });
    },

    listMyDocuments(signal?: AbortSignal) {
      return http.get<{
        countryCode: string;
        requiredTypes: DocumentType[];
        documents: ProviderDocument[];
      }>(API_ROUTES.providers.documents, { ...(signal ? { signal } : {}) });
    },

    uploadDocument(body: { type: DocumentType; fileId: string; expiresAt?: string }) {
      return http.post<ProviderDocument>(API_ROUTES.providers.documents, body);
    },
  };
}

export type ProvidersResource = ReturnType<typeof createProvidersResource>;
