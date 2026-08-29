'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@talpio/config';
import { DocumentStatus, DocumentType, FilePurpose, type ProviderDocument } from '@talpio/types';
import { Button, EmptyState } from '@talpio/ui';
import { useRef, useState } from 'react';

import { apiClient } from '@/lib/api';
import { t } from '@/lib/i18n';

const STATUS_KEY = {
  PENDING: 'verification.pending',
  APPROVED: 'verification.approved',
  REJECTED: 'verification.rejected',
  EXPIRED: 'verification.rejected',
} as const;

export function VerificationDocumentsPanel() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<DocumentType>(DocumentType.TAX_CERTIFICATE);

  const pack = useQuery({
    queryKey: ['providers', 'documents'],
    queryFn: ({ signal }) => apiClient.providers.listMyDocuments(signal),
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const stored = await apiClient.files.upload(file, FilePurpose.PROVIDER_DOCUMENT);
      return apiClient.providers.uploadDocument({ type, fileId: stored.id });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['providers', 'documents'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.businesses.mine() });
    },
  });

  const required = pack.data?.requiredTypes ?? [];
  const documents = pack.data?.documents ?? [];

  return (
    <section className="social-panel flex flex-col gap-4 p-4 sm:p-5">
      <div>
        <h2 className="font-display text-lg font-semibold">{t('verification.title')}</h2>
        <p className="mt-1 text-sm text-foreground-muted">{t('verification.hint')}</p>
      </div>

      {pack.data ? (
        <p className="text-xs font-medium text-foreground-muted">
          {t('verification.required', { country: pack.data.countryCode })}:{' '}
          {required.map((item: DocumentType) => t(`social.credentialsByType.${item}`)).join(', ')}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={type}
          onChange={(event) => setType(event.target.value as DocumentType)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
        >
          {(required.length > 0 ? required : Object.values(DocumentType)).map((item: DocumentType) => (
            <option key={item} value={item}>
              {t(`social.credentialsByType.${item}`)}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          disabled={upload.isPending}
          onClick={() => inputRef.current?.click()}
        >
          {upload.isPending ? t('verification.uploading') : t('verification.upload')}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload.mutate(file);
            event.target.value = '';
          }}
        />
      </div>

      {documents.length === 0 ? (
        <EmptyState title={t('verification.empty')} />
      ) : (
        <ul className="flex flex-col gap-2">
          {documents.map((document: ProviderDocument) => (
            <li
              key={document.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm"
            >
              <span>{t(`social.credentialsByType.${document.type}`)}</span>
              <span className="text-xs text-foreground-muted">
                {t(STATUS_KEY[document.status as DocumentStatus])}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
