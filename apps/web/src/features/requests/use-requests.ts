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

export function useMatchedRequests() {
  return useQuery({
    queryKey: queryKeys.requests.matched(),
    queryFn: ({ signal }) => apiClient.requests.listMatched({}, signal),
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
    mutationFn: (body: CreateCommerceRequestPayload) => apiClient.requests.create(body),
    onSuccess: (request) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.requests.all() });
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

export function useAcceptRequestOffer(requestId: string) {
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
