'use client';

import { formatDateTime } from '@ustapilot/localization';
import type { AdminSystemSetting } from '@ustapilot/types';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type TableColumn } from '@/components/ui/data-table';
import { canWrite, useSession } from '@/features/auth/use-session';

import { useAdminSettings, useUpdateSetting } from './use-admin';

const LOCALE = 'tr';
const SECRET_MASK = '********';

export function SettingsPanel() {
  const session = useSession();
  const writable = canWrite(session.data);
  const settings = useAdminSettings();
  const [selected, setSelected] = useState<AdminSystemSetting | null>(null);

  const columns: TableColumn<AdminSystemSetting>[] = [
    {
      key: 'key',
      header: 'Anahtar',
      cell: (setting) => (
        <button type="button" className="min-w-0 text-left" onClick={() => setSelected(setting)}>
          <p className="truncate font-mono text-sm font-medium hover:underline">{setting.key}</p>
          {setting.description ? (
            <p className="truncate text-xs text-foreground-muted">{setting.description}</p>
          ) : null}
        </button>
      ),
    },
    {
      key: 'value',
      header: 'Değer',
      cell: (setting) => (
        <span className="font-mono text-sm tabular-nums">
          {formatSettingValue(setting.value, setting.isSecret)}
        </span>
      ),
    },
    {
      key: 'secret',
      header: 'Gizli',
      hideBelow: 'md',
      cell: (setting) => (
        <span className="text-foreground-muted">{setting.isSecret ? 'Evet' : 'Hayır'}</span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Güncelleme',
      hideBelow: 'lg',
      align: 'right',
      cell: (setting) => (
        <span className="whitespace-nowrap text-foreground-muted">
          {formatDateTime(setting.updatedAt, LOCALE)}
        </span>
      ),
    },
  ];

  const rows = settings.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Sistem ayarları</CardTitle>
          <CardDescription>
            Platform parametreleri veritabanından okunur; gizli değerler maskelenir.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(setting) => setting.id}
            isPending={settings.isPending}
            isError={settings.isError}
            emptyLabel="Henüz ayar yok."
            onRetry={() => void settings.refetch()}
            minWidth={800}
          />
        </CardContent>
      </Card>

      {selected && writable ? (
        <SettingEditor
          setting={selected}
          onClose={() => setSelected(null)}
          onUpdated={(item) => setSelected(item)}
        />
      ) : null}
    </div>
  );
}

function SettingEditor({
  setting,
  onClose,
  onUpdated,
}: {
  setting: AdminSystemSetting;
  onClose: () => void;
  onUpdated: (item: AdminSystemSetting) => void;
}) {
  const update = useUpdateSetting();
  const [draft, setDraft] = useState(
    setting.isSecret ? '' : serializeSettingValue(setting.value),
  );
  const [parseError, setParseError] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="min-w-0">
          <CardTitle className="truncate font-mono text-base">{setting.key}</CardTitle>
          <CardDescription>
            {setting.description ?? 'Açıklama yok.'}
            {setting.isSecret ? ' Gizli alan; mevcut değer gösterilmez.' : null}
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Kapat
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <textarea
          className="min-h-28 w-full rounded-[--radius-control] border border-border bg-surface px-3 py-2 font-mono text-sm"
          value={draft}
          placeholder={setting.isSecret ? 'Yeni değer (JSON)' : undefined}
          onChange={(event) => {
            setDraft(event.target.value);
            setParseError(null);
          }}
        />
        {parseError ? <p className="text-sm text-danger-on-surface">{parseError}</p> : null}
        <Button
          size="sm"
          disabled={update.isPending || draft.trim().length === 0}
          onClick={() => {
            let value: unknown;
            try {
              value = JSON.parse(draft);
            } catch {
              setParseError('Geçerli bir JSON değeri girin.');
              return;
            }

            if (setting.isSecret && value === SECRET_MASK) {
              setParseError('Maskelenmiş değer kaydedilemez; yeni bir değer girin.');
              return;
            }

            update.mutate(
              { key: setting.key, value },
              { onSuccess: (item) => onUpdated(item) },
            );
          }}
        >
          Kaydet
        </Button>
      </CardContent>
    </Card>
  );
}

function formatSettingValue(value: unknown, isSecret: boolean): string {
  if (isSecret) return SECRET_MASK;
  return serializeSettingValue(value);
}

function serializeSettingValue(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value);
  return JSON.stringify(value, null, 2);
}
