import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AiFeatureCode } from '@talpio/types';

import { AppException } from '@common/errors/app.exception';
import { AiService } from '@infra/ai/ai.service';
import { AiChatRole } from '@infra/ai/ai-provider';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import { CurrencyService } from '@infra/currency/currency.service';
import { PrismaService } from '@infra/prisma/prisma.service';

const requestDraftSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().min(10).max(4000),
  categorySuggestion: z.string().max(120).nullable().optional(),
  missingQuestions: z.array(z.string().max(200)).max(8).optional(),
  summary: z.string().max(500).optional(),
});

const offerDraftSchema = z.object({
  headline: z.string().min(3).max(160),
  body: z.string().min(10).max(4000),
  deliveryNote: z.string().max(400).nullable().optional(),
});

const socialDraftSchema = z.object({
  headline: z.string().min(3).max(120),
  body: z.string().min(10).max(2000),
  hashtags: z.array(z.string().max(40)).max(12).optional(),
  audienceSuggestion: z.string().max(80).nullable().optional(),
  durationDays: z.number().int().min(1).max(90).nullable().optional(),
});

@Injectable()
export class AiAssistService {
  constructor(
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
    private readonly currency: CurrencyService,
  ) {}

  async draftRequest(user: AuthenticatedUser, prompt: string) {
    const completion = await this.ai.complete({
      featureCode: AiFeatureCode.REQUEST_DRAFT,
      userId: user.id,
      operation: 'request_draft',
      messages: [
        {
          role: AiChatRole.SYSTEM,
          content:
            'Talpio talep taslağı üret. JSON döndür: title, description, categorySuggestion, missingQuestions, summary. Fiyat uydurma. Yayınlama.',
        },
        { role: AiChatRole.USER, content: prompt },
      ],
    });
    return {
      draft: parseJson(completion.content, requestDraftSchema),
      published: false,
      raw: completion.content,
    };
  }

  async draftOffer(
    user: AuthenticatedUser,
    input: {
      prompt: string;
      unitPriceMinor?: number;
      quantity?: number;
      unit?: string;
      currency?: string;
    },
  ) {
    const numbers = {
      unitPriceMinor: input.unitPriceMinor ?? null,
      quantity: input.quantity ?? null,
      unit: input.unit ?? null,
      currency: input.currency ?? (await this.currency.forUser(user.id)),
    };
    const completion = await this.ai.complete({
      featureCode: AiFeatureCode.OFFER_DRAFT,
      userId: user.id,
      operation: 'offer_draft',
      messages: [
        {
          role: AiChatRole.SYSTEM,
          content:
            'Profesyonel teklif metni yaz. JSON: headline, body, deliveryNote. Fiyat hesaplama. Backend sayılarını kullan, uydurma.',
        },
        {
          role: AiChatRole.USER,
          content: JSON.stringify({ prompt: input.prompt, numbers }),
        },
      ],
    });
    return {
      draft: parseJson(completion.content, offerDraftSchema),
      numbers,
      published: false,
    };
  }

  async draftSocial(user: AuthenticatedUser, prompt: string) {
    const completion = await this.ai.complete({
      featureCode: AiFeatureCode.SOCIAL_DRAFT,
      userId: user.id,
      operation: 'social_draft',
      messages: [
        {
          role: AiChatRole.SYSTEM,
          content:
            'Sosyal ticaret gönderi taslağı. JSON: headline, body, hashtags, audienceSuggestion, durationDays. Yayınlama.',
        },
        { role: AiChatRole.USER, content: prompt },
      ],
    });
    return {
      draft: parseJson(completion.content, socialDraftSchema),
      published: false,
    };
  }

  async salesCoach(user: AuthenticatedUser, businessId: string) {
    const membership = await this.prisma.businessMembership.findFirst({
      where: { businessId, userId: user.id, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!membership) {
      throw new AppException('FORBIDDEN', { message: 'İşletme erişimi yok.' });
    }

    const [offers, accepted, customers] = await Promise.all([
      this.prisma.requestOffer.count({ where: { businessId, deletedAt: null } }),
      this.prisma.requestOffer.count({
        where: { businessId, deletedAt: null, status: 'ACCEPTED' },
      }),
      this.prisma.crmCustomer.count({ where: { tenantId: businessId, deletedAt: null } }),
    ]);

    const analytics = {
      offerCount: offers,
      acceptedOfferCount: accepted,
      conversionRate: offers > 0 ? Math.round((accepted / offers) * 100) : null,
      customerCount: customers,
    };

    const completion = await this.ai.complete({
      featureCode: AiFeatureCode.SALES_COACH,
      userId: user.id,
      operation: 'sales_coach',
      messages: [
        {
          role: AiChatRole.SYSTEM,
          content:
            'Satış koçu. Sayıları değiştirme veya uydurma. Yalnızca verilen analitiği açıkla.',
        },
        { role: AiChatRole.USER, content: JSON.stringify(analytics) },
      ],
    });

    return { analytics, explanation: completion.content, published: false };
  }
}

function parseJson<T>(raw: string | null | undefined, schema: z.ZodType<T>): T {
  const text = raw?.trim() ?? '';
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  const slice = start >= 0 && end > start ? text.slice(start, end + 1) : text;
  try {
    return schema.parse(JSON.parse(slice));
  } catch {
    throw new AppException('VALIDATION_ERROR', {
      message: 'AI çıktısı şema doğrulamasından geçmedi. Taslak yayınlanmadı.',
    });
  }
}
