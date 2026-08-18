import { SetMetadata } from '@nestjs/common';

export const RAW_RESPONSE_KEY = 'talpio:raw-response';

/**
 * Yanıtın standart zarfa sarılmasını engeller.
 * Sağlık kontrolü ve webhook gibi gövde biçimi dışarıdan dayatılan uçlarda kullanılır.
 */
export const RawResponse = (): MethodDecorator & ClassDecorator =>
  SetMetadata(RAW_RESPONSE_KEY, true);
