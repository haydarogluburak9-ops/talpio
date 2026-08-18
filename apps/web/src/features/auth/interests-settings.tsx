'use client';

import { Button } from '@talpio/ui';
import { useEffect, useState } from 'react';

import { InterestPicker } from '@/features/auth/interest-picker';
import { useCategoryFollows, useReplaceInterests } from '@/features/social/use-social';
import { t } from '@/lib/i18n';

export function InterestsSettings() {
  const follows = useCategoryFollows(true);
  const replace = useReplaceInterests();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (follows.data) {
      setSelected(follows.data.map((item) => item.categoryId));
    }
  }, [follows.data]);

  return (
    <section className="social-panel space-y-3 p-5 sm:p-6">
      <InterestPicker selected={selected} onChange={setSelected} />
      <Button
        type="button"
        size="sm"
        disabled={selected.length < 3 || replace.isPending}
        onClick={() => replace.mutate(selected)}
      >
        {replace.isPending ? t('common.loading') : t('auth.interestsSave')}
      </Button>
      {replace.isSuccess ? (
        <p className="text-xs font-medium text-success-700">{t('auth.interestsSaved')}</p>
      ) : null}
      {replace.isError ? (
        <p role="alert" className="text-xs font-medium text-danger-500">
          {t('status.errorMessage')}
        </p>
      ) : null}
    </section>
  );
}
