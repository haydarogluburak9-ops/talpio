import { API_ROUTES } from '@talpio/config';
import type { CommerceRequest, RequestOffer } from '@talpio/types';
import type {
  CreateCommerceRequestPayload,
  CreateRequestOfferPayload,
  CreateSupplierBusinessPayload,
} from '@talpio/validation';

import type { HttpClient, Paginated } from '../http-client';

export function createRequestsResource(http: HttpClient) {
  return {
    create(
      body: CreateCommerceRequestPayload & { publish?: boolean },
      signal?: AbortSignal,
    ): Promise<CommerceRequest> {
      return http.post<CommerceRequest>(API_ROUTES.requests.root, body, {
        ...(signal ? { signal } : {}),
      });
    },

    listMine(
      params: { page?: number; limit?: number } = {},
      signal?: AbortSignal,
    ): Promise<Paginated<CommerceRequest>> {
      return http.paginated<CommerceRequest>(API_ROUTES.requests.mine, {
        method: 'GET',
        query: params,
        ...(signal ? { signal } : {}),
      });
    },

    listMatched(
      params: { page?: number; limit?: number } = {},
      signal?: AbortSignal,
    ): Promise<Paginated<CommerceRequest>> {
      return http.paginated<CommerceRequest>(API_ROUTES.requests.matched, {
        method: 'GET',
        query: params,
        ...(signal ? { signal } : {}),
      });
    },

    listMyOffers(limit = 20, signal?: AbortSignal): Promise<RequestOffer[]> {
      return http.get<RequestOffer[]>(API_ROUTES.requests.myOffers, {
        query: { limit },
        ...(signal ? { signal } : {}),
      });
    },

    listNearby(limit = 5, signal?: AbortSignal): Promise<CommerceRequest[]> {
      return http.get<CommerceRequest[]>(API_ROUTES.requests.nearby, {
        query: { limit },
        ...(signal ? { signal } : {}),
      });
    },

    getById(id: string, signal?: AbortSignal): Promise<CommerceRequest> {
      return http.get<CommerceRequest>(API_ROUTES.requests.byId(id), {
        ...(signal ? { signal } : {}),
      });
    },

    publish(id: string): Promise<CommerceRequest> {
      return http.post<CommerceRequest>(API_ROUTES.requests.publish(id));
    },

    listOffers(requestId: string, signal?: AbortSignal): Promise<RequestOffer[]> {
      return http.get<RequestOffer[]>(API_ROUTES.requests.offers(requestId), {
        ...(signal ? { signal } : {}),
      });
    },

    createOffer(requestId: string, body: CreateRequestOfferPayload): Promise<RequestOffer> {
      return http.post<RequestOffer>(API_ROUTES.requests.offers(requestId), body);
    },

    acceptOffer(offerId: string): Promise<{ offer: RequestOffer; orderId: string }> {
      return http.post<{ offer: RequestOffer; orderId: string }>(
        API_ROUTES.requestOffers.accept(offerId),
      );
    },
  };
}

export type BusinessLocaleSettings = {
  id: string;
  businessId: string;
  defaultCurrency: string;
  defaultCountryCode: string;
  defaultTimezone: string;
  taxId?: string | null;
};

export type CrmCustomerRow = {
  id: string;
  displayName: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { workOrders: number };
};

export function createBusinessesResource(http: HttpClient) {
  return {
    createSupplier(body: CreateSupplierBusinessPayload, signal?: AbortSignal) {
      return http.post(API_ROUTES.businesses.supplier, body, {
        ...(signal ? { signal } : {}),
      });
    },

    listMine(signal?: AbortSignal) {
      return http.get(API_ROUTES.businesses.mine, { ...(signal ? { signal } : {}) });
    },

    getLocaleSettings(businessId: string, signal?: AbortSignal): Promise<BusinessLocaleSettings> {
      return http.get<BusinessLocaleSettings>(API_ROUTES.businesses.localeSettings(businessId), {
        ...(signal ? { signal } : {}),
      });
    },

    updateLocaleSettings(
      businessId: string,
      body: Partial<
        Pick<
          BusinessLocaleSettings,
          'defaultCurrency' | 'defaultCountryCode' | 'defaultTimezone' | 'taxId'
        >
      >,
    ): Promise<BusinessLocaleSettings> {
      return http.patch<BusinessLocaleSettings>(
        API_ROUTES.businesses.localeSettings(businessId),
        body,
      );
    },

    listCrmCustomers(businessId: string, signal?: AbortSignal): Promise<CrmCustomerRow[]> {
      return http.get<CrmCustomerRow[]>(API_ROUTES.businesses.crmCustomers(businessId), {
        ...(signal ? { signal } : {}),
      });
    },

    createCrmCustomer(
      businessId: string,
      body: {
        displayName: string;
        phone?: string | null;
        email?: string | null;
        notes?: string | null;
        source?: string;
        tags?: string[];
      },
    ) {
      return http.post(API_ROUTES.businesses.crmCustomers(businessId), body);
    },

    getCrmCustomer(businessId: string, customerId: string, signal?: AbortSignal) {
      return http.get(API_ROUTES.businesses.crmCustomer(businessId, customerId), {
        ...(signal ? { signal } : {}),
      });
    },

    addCrmNote(businessId: string, customerId: string, body: string, fileAssetId?: string) {
      return http.post(API_ROUTES.businesses.crmNotes(businessId, customerId), {
        body,
        ...(fileAssetId ? { fileAssetId } : {}),
      });
    },

    addCrmFollowUp(businessId: string, customerId: string, body: { dueAt: string; body: string }) {
      return http.post(API_ROUTES.businesses.crmFollowUps(businessId, customerId), body);
    },

    completeCrmFollowUp(businessId: string, customerId: string, followUpId: string) {
      return http.patch(API_ROUTES.businesses.crmFollowUpComplete(businessId, customerId, followUpId));
    },

    getCrmAnalytics(businessId: string, signal?: AbortSignal) {
      return http.get(API_ROUTES.businesses.crmAnalytics(businessId), {
        ...(signal ? { signal } : {}),
      });
    },

    listWorkOrders(businessId: string, signal?: AbortSignal) {
      return http.get(API_ROUTES.businesses.workOrders(businessId), {
        ...(signal ? { signal } : {}),
      });
    },

    createWorkOrder(
      businessId: string,
      body: { customerId: string; title: string; source?: string; notes?: string | null },
    ) {
      return http.post(API_ROUTES.businesses.workOrders(businessId), body);
    },

    listWorkOrderBoard(businessId: string, signal?: AbortSignal) {
      return http.get(API_ROUTES.businesses.workOrderBoard(businessId), {
        ...(signal ? { signal } : {}),
      });
    },

    updateWorkOrderStage(businessId: string, workOrderId: string, stage: string) {
      return http.patch(API_ROUTES.businesses.workOrderStage(businessId, workOrderId), { stage });
    },

    assignWorkOrder(businessId: string, workOrderId: string, assigneeUserId: string) {
      return http.patch(API_ROUTES.businesses.workOrderAssign(businessId, workOrderId), {
        assigneeUserId,
      });
    },

    listTasks(businessId: string, signal?: AbortSignal) {
      return http.get(API_ROUTES.businesses.tasks(businessId), {
        ...(signal ? { signal } : {}),
      });
    },

    createTask(businessId: string, body: { title: string; dueAt?: string | null; priority?: string }) {
      return http.post(API_ROUTES.businesses.tasks(businessId), body);
    },

    getDashboard(businessId: string, signal?: AbortSignal) {
      return http.get(API_ROUTES.businesses.dashboard(businessId), {
        ...(signal ? { signal } : {}),
      });
    },

    getTrustScore(businessId: string, signal?: AbortSignal) {
      return http.get(API_ROUTES.businesses.trustScore(businessId), {
        ...(signal ? { signal } : {}),
      });
    },

    listCampaigns(businessId: string, signal?: AbortSignal) {
      return http.get(API_ROUTES.businesses.campaigns(businessId), {
        ...(signal ? { signal } : {}),
      });
    },

    createCampaign(businessId: string, body: { title: string; description?: string | null }) {
      return http.post(API_ROUTES.businesses.campaigns(businessId), body);
    },

    searchVerified(q: string, signal?: AbortSignal) {
      return http.get<
        Array<{
          id: string;
          name: string;
          verificationStatus: string;
          socialProfile: { username: string | null; displayName: string | null } | null;
        }>
      >(API_ROUTES.businesses.search, {
        query: { q },
        ...(signal ? { signal } : {}),
      });
    },

    claimEmployment(businessId: string) {
      return http.post(API_ROUTES.businesses.employmentClaims(businessId));
    },

    listEmploymentClaims(businessId: string, signal?: AbortSignal) {
      return http.get<
        Array<{
          id: string;
          status: string;
          createdAt: string;
          user: { id: string; fullName: string; email: string };
        }>
      >(API_ROUTES.businesses.employmentClaims(businessId), {
        ...(signal ? { signal } : {}),
      });
    },

    decideEmployment(businessId: string, userId: string, approve: boolean) {
      return http.patch(API_ROUTES.businesses.employmentClaimByUser(businessId, userId), {
        approve,
      });
    },
  };
}
