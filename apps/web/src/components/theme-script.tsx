'use client';

import { THEME_INIT_SCRIPT } from '@talpio/ui';
import { useServerInsertedHTML } from 'next/navigation';

/**
 * Tema betiğini SSR HTML akışına React ağacının dışında enjekte eder.
 * Böylece FOUC engellenir ve React 19’un bileşen içi <script> uyarısı tetiklenmez.
 */
export function ThemeScript() {
  useServerInsertedHTML(() => (
    <script id="talpio-theme-init" dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
  ));

  return null;
}
