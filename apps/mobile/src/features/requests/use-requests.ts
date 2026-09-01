import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import type { CreateCommerceRequestPayload, CreateRequestOfferPayload } from '@talpio/validation';
import { queryKeys } from '@talpio/config';

import { apiClient } from '@/lib/api';

export function useMyCommerceRequests() {
  return useQuery({
    queryKey: queryKeys.requests.mine(),
    queryFn: ({ signal }) => apiClient.requests.listMine({}, signal),
  });
}

/** Alıcının tüm taleplerine gelen teklifler; profildeki ticaret alanı besler. */
export function useMyRequestOffers(limit = 20) {
  return useQuery({
    queryKey: queryKeys.requests.myOffers(limit),
    queryFn: ({ signal }) => apiClient.requests.listMyOffers(limit, signal),
  });
}

export function useMatchedRequests(enabled = true) {
  return useQuery({
    queryKey: queryKeys.requests.matched(),
    queryFn: ({ signal }) => apiClient.requests.listMatched({}, signal),
    enabled,
    retry: false,
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
       * bir mağazaya açılan talep özeldir, paylaşılmaz. Paylaşım ikincil; hata
       * alırsa talep yine yayında kalır.
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.all() });
      router.push(`/customer/requests/${request.id}`);
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

export function useAcceptRequestOffer(requestId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (offerId: string) => apiClient.requests.acceptOffer(offerId),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.requests.all() });
      router.push(
        result.conversationId
          ? `/customer/chat/${result.conversationId}`
          : `/customer/orders/${result.orderId}`,
      );
    },
  });
}
