import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

/**
 * Parola özetleme. Argon2id, GPU/ASIC saldırılarına bcrypt'ten dayanıklıdır ve
 * OWASP'ın güncel önerisidir.
 *
 * Parametreler OWASP asgari yapılandırmasını karşılar (19 MiB bellek, 2 tur).
 */
@Injectable()
export class PasswordService {
  hash(plain: string): Promise<string> {
    return argon2.hash(plain, {
      type: argon2.argon2id,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });
  }

  /**
   * Doğrulama hatası fırlatmaz; bozuk özet de "eşleşmedi" sayılır. Böylece
   * eski/geçersiz kayıtlar 500 yerine normal kimlik hatası üretir.
   */
  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }
}
