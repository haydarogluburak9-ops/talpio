import { createTranslator } from '@ustapilot/localization';

import { publicEnv } from './env';

/**
 * Şimdilik tek dil sunucu tarafında sabitlenir. Dil seçimi devreye girdiğinde
 * bu fabrika istek başına çözülen dille çağrılacak; çağrı yerleri değişmez.
 */
export const i18n = createTranslator(publicEnv.defaultLocale);
export const t = i18n.t;
