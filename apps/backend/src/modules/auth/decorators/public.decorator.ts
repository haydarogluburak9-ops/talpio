import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'auth:isPublic';

/**
 * Kimlik doğrulama varsayılan olarak zorunludur (global `JwtAuthGuard`).
 * Herkese açık uçlar bu dekoratörle açıkça işaretlenir; böylece bir ucu
 * korumayı unutmak değil, açmak bilinçli bir karar olur.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
