'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@talpio/config';
import type {
  CreateCommerceRequestPayload,
  CreateRequestOfferPayload,
  CreateSupplierBusinessPayload,
} from '@talpio/validation';
import { useRouter } from 'next/navigation';

import { apiClient } from '@/lib/api';

export function useMyCommerceRequests() {
  return useQuery({
    queryKey: queryKeys.requests.mine(),
    queryFn: ({ signal }) => apiClient.requests.listMine({}, signal),
  });
}

export function useMatchedRequests(enabled = true) {
  return useQuery({
    queryKey: queryKeys.requests.matched(),
    queryFn: ({ signal }) => apiClient.requests.listMatched({}, signal),
    enabled,
    // Alıcı-only hesaplarda 403 döner; ticaret kutusunu düşürmesin.
    retry: false,
  });
}

export function useMyRequestOffers(limit = 20) {
  return useQuery({
    queryKey: queryKeys.requests.myOffers(limit),
    queryFn: ({ signal }) => apiClient.requests.listMyOffers(limit, signal),
  });
}

export function useNearbyRequests(limit = 5, enabled = true) {
  return useQuery({
    queryKey: queryKeys.requests.nearby(limit),
    queryFn: ({ signal }) => apiClient.requests.listNearby(limit, signal),
    enabled,
    staleTime: 60_000,
  });
}

export function useCommerceRequest(id: string) {
  return useQuery({
    queryKey: queryKeys.requests.detail(id),
    queryFn: ({ signal }) => apiClient.requests.getById(id, signal),
    enabled: id.length > 0,
  });
}

export function useRequestOffers(requestId: string) {
  return useQuery({
    queryKey: queryKeys.requests.offers(requestId),
    queryFn: ({ signal }) => apiClient.requests.listOffers(requestId, signal),
    enabled: requestId.length > 0,
  });
}

export function useCreateCommerceRequest() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (body: CreateCommerceRequestPayload) => {
      const request = await apiClient.requests.create(body);

      /**
       * Herkese açık talep akışta da paylaşılır ki takipçiler görsün. Belirli
       * bir mağazaya açılan talep özeldir, paylaşılmaz. Paylaşım uç noktası
       * idempotent; başarısız olursa talep yine de oluşmuş olur, bu yüzden
       * hata talebi geçersiz kılmaz.
       */
      if (!body.businessId) {
        try {
          await apiClient.social.shareRequest(request.id);
        } catch {
          // Akış paylaşımı ikincil; talep zaten yayında.
        }
      }

      return request;
    },
    onSuccess: (request) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.requests.all() });
      // Akışa yeni bir talep paylaşımı düştü; geniş kapsam burada sorun değil,
      // hemen ardından talep detayına gidiliyor.
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.all() });
      router.push(`/tedarik/${request.id}`);
    },
  });
}

export function usePublishCommerceRequest(requestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.requests.publish(requestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.requests.all() });
    },
  });
}

export function useCreateRequestOffer(requestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateRequestOfferPayload) =>
      apiClient.requests.createOffer(requestId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.requests.matched() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.requests.offers(requestId) });
    },
  });
}

export function useAcceptRequestOffer() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (offerId: string) => apiClient.requests.acceptOffer(offerId),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.requests.all() });
      router.push(`/siparislerim/${result.orderId}`);
    },
  });
}

export function useMyBusinesses(enabled = true) {
  return useQuery({
    queryKey: queryKeys.businesses.mine(),
    queryFn: ({ signal }) => apiClient.businesses.listMine(signal),
    enabled,
  });
}

export function useCreateSupplierBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateSupplierBusinessPayload) => apiClient.businesses.createSupplier(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.businesses.all() });
    },
  });
}
