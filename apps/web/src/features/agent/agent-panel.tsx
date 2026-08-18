'use client';

import { Button } from '@talpio/ui';
import { Bot } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useAiCredits } from '@/features/billing/use-billing';
import { publicEnv } from '@/lib/env';
import { t } from '@/lib/i18n';

import {
  useApproveAgentAction,
  useAgentThread,
  useEnsureAgentThread,
  usePendingAgentActions,
  usePostAgentMessage,
  useRejectAgentAction,
} from './use-agent';

/**
 * Satıcı panelinde daraltılabilir agent sohbeti.
 * Onay bekleyen yazma aksiyonları aynı panelde gösterilir.
 */
export function AgentPanel() {
  const [open, setOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const ensureThread = useEnsureAgentThread();
  const thread = useAgentThread(threadId);
  const pending = usePendingAgentActions(open);
  const postMessage = usePostAgentMessage(threadId);
  const approve = useApproveAgentAction();
  const reject = useRejectAgentAction();
  const credits = useAiCredits(publicEnv.featurePremium);

  useEffect(() => {
    if (!open || threadId || ensureThread.isPending) return;
    let cancelled = false;
    ensureThread.mutate(undefined, {
      onSuccess: (created) => {
        if (!cancelled) setThreadId(created.id);
      },
    });
    return () => {
      cancelled = true;
    };
    // Yalnızca panel açılışı / thread yokluğu tetikler.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ensureThread kimliği her render'da değişir
  }, [open, threadId]);

  async function onSend() {
    const content = draft.trim();
    if (!content || !threadId || postMessage.isPending) return;
    setDraft('');
    await postMessage.mutateAsync(content);
  }

  return (
    <section className="social-panel overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-brand-900 px-5 py-4 text-white">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-accent-400">
            <Bot className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold tracking-tight">{t('agent.title')}</h2>
            <p className="text-sm text-white/70">{t('agent.subtitle')}</p>
            {credits.data ? (
              <p className="mt-1 text-xs text-accent-300">
                {t('billing.creditsRemaining', {
                  remaining: credits.data.balanceCredits,
                  monthly: credits.data.monthlyCredits,
                })}
                {credits.data.balanceCredits < credits.data.monthlyCredits * 0.2 ? (
                  <span className="ml-2 text-white/80">{t('billing.upgradeHint')}</span>
                ) : null}
              </p>
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          className="shrink-0 bg-accent-500 text-white hover:bg-accent-600"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? t('agent.close') : t('agent.open')}
        </Button>
      </div>

      {open ? (
        <div className="flex flex-col gap-4 p-5">
          {pending.data && pending.data.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-brand-900 dark:text-foreground">
                {t('agent.pendingActions')}
              </p>
              {pending.data.map((action) => (
                <div
                  key={action.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-muted/70 px-3 py-2"
                >
                  <p className="min-w-0 flex-1 text-sm">{action.summary}</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-accent-500 text-white hover:bg-accent-600"
                      disabled={approve.isPending}
                      onClick={() => approve.mutate(action.id)}
                    >
                      {t('agent.approve')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={reject.isPending}
                      onClick={() => reject.mutate(action.id)}
                    >
                      {t('agent.reject')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
            {thread.data?.messages.length ? (
              thread.data.messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === 'USER'
                      ? 'ml-8 rounded-2xl rounded-br-md bg-brand-900 px-3 py-2 text-sm text-white'
                      : 'mr-8 rounded-2xl rounded-bl-md bg-surface-muted px-3 py-2 text-sm text-foreground'
                  }
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-foreground-muted">{t('agent.empty')}</p>
            )}
            {postMessage.isPending ? (
              <p className="text-sm text-foreground-muted">{t('agent.thinking')}</p>
            ) : null}
          </div>

          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void onSend();
            }}
          >
            <input
              className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent-500/50"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t('agent.placeholder')}
              disabled={!threadId || postMessage.isPending}
            />
            <Button
              type="submit"
              className="bg-accent-500 text-white hover:bg-accent-600"
              disabled={!threadId || !draft.trim() || postMessage.isPending}
            >
              {t('agent.send')}
            </Button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
