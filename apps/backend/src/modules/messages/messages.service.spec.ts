import { ConversationStatus, MessageType, OrderStatus, UserRole } from '@talpio/types';

import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import { AppException } from '@common/errors/app.exception';
import type { AppConfigService } from '@config/app-config.service';
import type { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import type { FilesService } from '@modules/files/files.service';

import type { ListMessagesQueryDto, SendMessageDto } from './dto/message.dto';
import type { ConversationRow, MessageRow } from './message.mapper';
import { MessagesService } from './messages.service';

const CUSTOMER_ID = 'customer-1';
const PROVIDER_USER_ID = 'provider-user-1';
const CONVERSATION_ID = '0194a1b2-c3d4-7000-8000-000000000010';
const ORDER_ID = '0194a1b2-c3d4-7000-8000-000000000011';

const customer: AuthenticatedUser = { id: CUSTOMER_ID, role: UserRole.CUSTOMER, sessionId: 's1' };
const provider: AuthenticatedUser = {
  id: PROVIDER_USER_ID,
  role: UserRole.PROVIDER,
  sessionId: 's2',
};
const stranger: AuthenticatedUser = { id: 'stranger-1', role: UserRole.CUSTOMER, sessionId: 's3' };
const support: AuthenticatedUser = { id: 'support-1', role: UserRole.SUPPORT, sessionId: 's4' };

function conversationRow(overrides: Partial<ConversationRow> = {}): ConversationRow {
  const now = new Date('2026-02-01T10:00:00.000Z');

  return {
    id: CONVERSATION_ID,
    title: null,
    isGroup: false,
    jobRequestId: 'job-1',
    orderId: ORDER_ID,
    status: ConversationStatus.ACTIVE,
    lastMessageAt: now,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    participants: [
      {
        id: 'p1',
        conversationId: CONVERSATION_ID,
        userId: CUSTOMER_ID,
        lastReadAt: null,
        isMuted: false,
        createdAt: now,
        user: { id: CUSTOMER_ID, fullName: 'Ayşe Demir', avatar: null },
      },
      {
        id: 'p2',
        conversationId: CONVERSATION_ID,
        userId: PROVIDER_USER_ID,
        lastReadAt: null,
        isMuted: false,
        createdAt: now,
        user: { id: PROVIDER_USER_ID, fullName: 'Ahmet Yılmaz', avatar: null },
      },
    ],
    messages: [],
    ...overrides,
  };
}

function messageRow(overrides: Partial<MessageRow> = {}): MessageRow {
  const now = new Date('2026-02-01T10:05:00.000Z');

  return {
    id: 'message-1',
    conversationId: CONVERSATION_ID,
    senderId: CUSTOMER_ID,
    type: MessageType.TEXT,
    body: 'Merhaba, yarın uygun musunuz?',
    latitude: null,
    longitude: null,
    clientMessageId: 'client-key-1',
    isFlagged: false,
    readAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    attachments: [],
    ...overrides,
  };
}

type PrismaMock = {
  conversation: {
    findFirst: jest.Mock;
    findFirstOrThrow: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  conversationParticipant: { updateMany: jest.Mock };
  message: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    groupBy: jest.Mock;
  };
  order: { findFirst: jest.Mock; findUnique: jest.Mock };
  user: { findFirst: jest.Mock };
  $transaction: jest.Mock;
};

function createPrismaMock(): PrismaMock {
  const mock: PrismaMock = {
    conversation: {
      findFirst: jest.fn().mockResolvedValue(conversationRow()),
      findFirstOrThrow: jest.fn().mockResolvedValue(conversationRow()),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(conversationRow()),
      update: jest.fn().mockResolvedValue({}),
    },
    conversationParticipant: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    message: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(messageRow()),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    order: {
      findFirst: jest.fn().mockResolvedValue({
        id: ORDER_ID,
        jobRequestId: 'job-1',
        customerId: CUSTOMER_ID,
        providerProfile: { userId: PROVIDER_USER_ID },
      }),
      findUnique: jest.fn().mockResolvedValue({ status: OrderStatus.IN_PROGRESS }),
    },
    user: { findFirst: jest.fn().mockResolvedValue({ id: PROVIDER_USER_ID }) },
    $transaction: jest.fn(),
  };

  mock.$transaction.mockImplementation((fn: (tx: PrismaMock) => unknown) => fn(mock));

  return mock;
}

function createService(prisma: PrismaMock, files: FilesMock = createFilesMock()): MessagesService {
  const config = {
    fileBaseUrl: 'http://localhost:9000/talpio',
  } as unknown as AppConfigService;

  const notifications = {
    dispatch: jest.fn().mockResolvedValue(undefined),
    dispatchAll: jest.fn().mockResolvedValue(undefined),
  };

  return new MessagesService(
    prisma as unknown as PrismaService,
    config,
    files as unknown as FilesService,
    notifications as never,
  );
}

type FilesMock = { assertOwnedBy: jest.Mock };

function createFilesMock(): FilesMock {
  return { assertOwnedBy: jest.fn().mockResolvedValue(undefined) };
}

/** `skip` prototip üzerinde tanımlı olduğundan gerçek DTO örneği kurulur. */
function listQuery(overrides: Record<string, unknown> = {}): ListMessagesQueryDto {
  return Object.assign(new PaginationQueryDto(), overrides);
}

function sendDto(overrides: Partial<SendMessageDto> = {}): SendMessageDto {
  return {
    type: MessageType.TEXT,
    body: 'Merhaba',
    attachmentFileIds: [],
    clientMessageId: 'client-key-1',
    ...overrides,
  };
}

/** Mock çağrı argümanı `any` olduğundan okumadan önce beklenen şekle daraltılır. */
function firstCallArg<T>(mock: jest.Mock): T {
  return mock.mock.calls[0]?.[0] as T;
}

async function codeOfRejection(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    if (error instanceof AppException) return error.code;
    throw error;
  }

  throw new Error('Beklenen hata fırlatılmadı.');
}

describe('MessagesService', () => {
  let prisma: PrismaMock;
  let service: MessagesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = createService(prisma);
  });

  describe('sohbet açma', () => {
    it('mevcut sohbeti tekrar oluşturmaz', async () => {
      const conversation = await service.openForOrder(customer, ORDER_ID);

      expect(conversation.id).toBe(CONVERSATION_ID);
      expect(prisma.conversation.create).not.toHaveBeenCalled();
    });

    it('sohbet yoksa iki katılımcıyla açar', async () => {
      prisma.conversation.findFirst.mockResolvedValue(null);

      await service.openForOrder(customer, ORDER_ID);

      const { data } = firstCallArg<{
        data: { participants: { create: { userId: string }[] } };
      }>(prisma.conversation.create);
      expect(data.participants.create.map((item) => item.userId)).toEqual([
        CUSTOMER_ID,
        PROVIDER_USER_ID,
      ]);
    });

    it('siparişin tarafı olmayana sohbet açtırmaz', async () => {
      await expect(codeOfRejection(() => service.openForOrder(stranger, ORDER_ID))).resolves.toBe(
        'FORBIDDEN_RESOURCE',
      );
    });

    it('bulunamayan siparişte 404 üretir', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(codeOfRejection(() => service.openForOrder(customer, ORDER_ID))).resolves.toBe(
        'NOT_FOUND',
      );
    });
  });

  describe('doğrudan sohbet', () => {
    it('kendine mesajı reddeder', async () => {
      await expect(codeOfRejection(() => service.openDirect(customer, CUSTOMER_ID))).resolves.toBe(
        'VALIDATION_ERROR',
      );
    });

    it('siparişsiz 1:1 sohbet açar', async () => {
      prisma.conversation.findFirst.mockResolvedValue(null);
      prisma.conversation.create.mockResolvedValue(
        conversationRow({ orderId: null, jobRequestId: null }),
      );

      await service.openDirect(customer, PROVIDER_USER_ID);

      const { data } = firstCallArg<{
        data: { participants: { create: { userId: string }[] } };
      }>(prisma.conversation.create);
      expect(data.participants.create.map((item) => item.userId)).toEqual([
        CUSTOMER_ID,
        PROVIDER_USER_ID,
      ]);
    });
  });

  describe('mesaj gönderme', () => {
    it('mesajı kaydeder ve sohbetin son mesaj zamanını günceller', async () => {
      await service.send(customer, CONVERSATION_ID, sendDto());

      expect(prisma.message.create).toHaveBeenCalled();
      const { data } = firstCallArg<{ data: { lastMessageAt: Date } }>(prisma.conversation.update);
      expect(data.lastMessageAt).toBeInstanceOf(Date);
    });

    it('göndereni okumuş sayar', async () => {
      await service.send(customer, CONVERSATION_ID, sendDto());

      const args = firstCallArg<{ where: { userId: string }; data: { lastReadAt: Date } }>(
        prisma.conversationParticipant.updateMany,
      );
      expect(args.where.userId).toBe(CUSTOMER_ID);
      expect(args.data.lastReadAt).toBeInstanceOf(Date);
    });

    it('aynı istemci anahtarıyla ikinci kaydı yazmaz', async () => {
      prisma.message.findFirst.mockResolvedValue(messageRow());

      const message = await service.send(customer, CONVERSATION_ID, sendDto());

      expect(message.id).toBe('message-1');
      expect(prisma.message.create).not.toHaveBeenCalled();
    });

    it('telefon numarası içeren mesajı işaretler', async () => {
      await service.send(
        customer,
        CONVERSATION_ID,
        sendDto({ body: 'Beni 0532 123 45 67 arayın' }),
      );

      const { data } = firstCallArg<{ data: { isFlagged: boolean } }>(prisma.message.create);
      expect(data.isFlagged).toBe(true);
    });

    it('sıradan mesajı işaretlemez', async () => {
      await service.send(customer, CONVERSATION_ID, sendDto({ body: 'Yarın sabah uygunum' }));

      const { data } = firstCallArg<{ data: { isFlagged: boolean } }>(prisma.message.create);
      expect(data.isFlagged).toBe(false);
    });

    it('boş mesajı reddeder', async () => {
      await expect(
        codeOfRejection(() =>
          service.send(customer, CONVERSATION_ID, sendDto({ body: undefined })),
        ),
      ).resolves.toBe('VALIDATION_ERROR');
    });

    it('konum içeren mesajda gövde aramaz', async () => {
      await service.send(
        provider,
        CONVERSATION_ID,
        sendDto({
          body: undefined,
          type: MessageType.LOCATION,
          location: { latitude: 37, longitude: 37 },
        }),
      );

      expect(prisma.message.create).toHaveBeenCalled();
    });

    it('iptal edilmiş siparişin sohbetine yazdırmaz', async () => {
      prisma.order.findUnique.mockResolvedValue({ status: OrderStatus.CANCELLED });

      await expect(
        codeOfRejection(() => service.send(customer, CONVERSATION_ID, sendDto())),
      ).resolves.toBe('CONFLICT');
    });

    it('arşivlenmiş sohbete yazdırmaz', async () => {
      prisma.conversation.findFirst.mockResolvedValue(
        conversationRow({ status: ConversationStatus.ARCHIVED }),
      );

      await expect(
        codeOfRejection(() => service.send(customer, CONVERSATION_ID, sendDto())),
      ).resolves.toBe('CONFLICT');
    });

    it('katılımcı olmayan kullanıcı yazamaz', async () => {
      await expect(
        codeOfRejection(() => service.send(stranger, CONVERSATION_ID, sendDto())),
      ).resolves.toBe('FORBIDDEN_RESOURCE');
    });
  });

  describe('okuma ve listeleme', () => {
    it('sohbetleri son mesaja göre sıralar', async () => {
      await service.listConversations(customer, listQuery());

      const { orderBy } = firstCallArg<{ orderBy: Record<string, string>[] }>(
        prisma.conversation.findMany,
      );
      expect(orderBy[0]).toEqual({ lastMessageAt: 'desc' });
    });

    it('yalnızca katılımı olan sohbetleri sorgular', async () => {
      await service.listConversations(customer, listQuery());

      const { where } = firstCallArg<{
        where: { participants: { some: { userId: string } } };
      }>(prisma.conversation.findMany);
      expect(where.participants.some.userId).toBe(CUSTOMER_ID);
    });

    it('mesajları en yeniden eskiye sıralar', async () => {
      await service.listMessages(customer, CONVERSATION_ID, listQuery());

      const { orderBy } = firstCallArg<{ orderBy: Record<string, string> }>(
        prisma.message.findMany,
      );
      expect(orderBy).toEqual({ createdAt: 'desc' });
    });

    it('okundu işaretlemede son okuma zamanını günceller', async () => {
      await service.markRead(provider, CONVERSATION_ID);

      const args = firstCallArg<{ where: { userId: string } }>(
        prisma.conversationParticipant.updateMany,
      );
      expect(args.where.userId).toBe(PROVIDER_USER_ID);
    });

    it('okunmamış sayısını karşı tarafın mesajlarından hesaplar', async () => {
      prisma.message.count.mockResolvedValue(3);

      const conversation = await service.getConversation(customer, CONVERSATION_ID);

      expect(conversation.unreadCount).toBe(3);
      const { where } = firstCallArg<{ where: { senderId: { not: string } } }>(
        prisma.message.count,
      );
      expect(where.senderId.not).toBe(CUSTOMER_ID);
    });

    it('destek ekibi yazışmayı okuyabilir', async () => {
      const conversation = await service.getConversation(support, CONVERSATION_ID);

      expect(conversation.id).toBe(CONVERSATION_ID);
    });

    it('ilgisiz kullanıcıya sohbeti göstermez', async () => {
      await expect(
        codeOfRejection(() => service.getConversation(stranger, CONVERSATION_ID)),
      ).resolves.toBe('FORBIDDEN_RESOURCE');
    });

    it('bulunamayan sohbette 404 üretir', async () => {
      prisma.conversation.findFirst.mockResolvedValue(null);

      await expect(
        codeOfRejection(() => service.getConversation(customer, CONVERSATION_ID)),
      ).resolves.toBe('NOT_FOUND');
    });
  });
});
