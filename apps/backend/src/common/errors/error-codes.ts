import type { HttpStatus } from '@nestjs/common';
import { ERROR_CODES, ERROR_CODE_STATUS as SHARED_ERROR_CODE_STATUS } from '@talpio/types';
import type { ErrorCode } from '@talpio/types';

/**
 * Hata kodlarının tek kaynağı `@talpio/types` paketidir; backend, web,
 * admin ve mobil aynı listeyi kullanır. Burada yalnızca NestJS tarafındaki
 * kullanım için yeniden dışa aktarılır.
 */
export { ERROR_CODES };
export type { ErrorCode };

export const ERROR_CODE_STATUS = SHARED_ERROR_CODE_STATUS as Record<ErrorCode, HttpStatus>;
