import {
  ComplaintStatus,
  ComplaintSubjectType,
  NotificationType,
  SupportTicketStatus,
  UserRole,
} from '@talpio/types';

import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import type { FilesService } from '@modules/files/files.service';
import type { NotificationsService } from '@modules/notifications/notifications.service';

import type {
  CreateComplaintDto,
  CreateSupportTicketDto,
  SupportTicketReplyDto,
} from './dto/support.dto';
import { SupportService } from './support.service';

const CUSTOMER_ID = 'customer-1';
const STAFF_ID = 'staff-1';
const TICKET_ID = '0194a1b2-c3d4-7000-8000-000000000010';
const MESSAGE_ID = '0194a1b2-c3d4-7000-8000-000000000011';
const COMPLAINT_ID = '0194a1b2-c3d4-7000-8000-000000000012';
const ORDER_ID = '0194a1b2-c3d4-7000-8000-000000000013';

const customer: AuthenticatedUser = {
  id: CUSTOMER_ID,
  role: UserRole.CUSTOMER,
  sessionId: 's1',
};

const staff: AuthenticatedUser = {
  id: STAFF_ID,
  role: UserRole.SUPPORT,
  sessionId: 's2',
};

const stranger: AuthenticatedUser = {
  id: 'stranger-1',
  role: UserRole.CUSTOMER,
  sessionId: 's3',
};

function ticketRow(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-03-01T10:00:00.000Z');
  return {
    id: TICKET_ID,
    userId: CUSTOMER_ID,
    subject: 'Ödeme sorunu',
    status: SupportTicketStatus.OPEN,
    assignedToUserId: null,
    orderId: null,
    lastMessageAt: now,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    messages: [
      {
        id: MESSAGE_ID,
        ticketId: TICKET_ID,
        senderId: CUSTOMER_ID,
        body: 'Ödemem bloke kaldı, yardımcı olur musunuz?',
        isFromStaff: false,
        attachmentIds: [] as string[],
        createdAt: now,
        deletedAt: null,
      },
    ],
    ...overrides,
  };
}

function messageRow(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-03-01T11:00:00.000Z');
  return {
    id: '0194a1b2-c3d4-7000-8000-000000000014',
    ticketId: TICKET_ID,
    senderId: STAFF_ID,
    body: 'İnceliyoruz, kısa sürede dönüş yapacağız.',
    isFromStaff: true,
    attachmentIds: [] as string[],
    createdAt: now,
    deletedAt: null,
    ...overrides,
  };
}

function complaintRow(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-03-01T12:00:00.000Z');
  return {
    id: COMPLAINT_ID,
    reporterId: CUSTOMER_ID,
    status: ComplaintStatus.OPEN,
    subjectType: ComplaintSubjectType.USER,
    subjectId: '0194a1b2-c3d4-7000-8000-000000000015',
    reason: 'Uygunsuz davranış',
    description: 'İş sırasında kaba davrandı.',
    resolutionNote: null,
    resolvedAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

type PrismaMock = {
  supportTicket: {
    create: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
  };
  supportMessage: { create: jest.Mock };
  complaint: {
    create: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
  };
  order: { findFirst: jest.Mock };
  user: { findFirst: jest.Mock };
  $transaction: jest.Mock;
};

function createService() {
  const prisma: PrismaMock = {
    supportTicket: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    supportMessage: { create: jest.fn() },
    complaint: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    order: { findFirst: jest.fn() },
    user: { findFirst: jest.fn() },
    $transaction: jest.fn((fn: (tx: PrismaMock) => unknown) => fn(prisma)),
  };

  const files = { assertOwnedBy: jest.fn().mockResolvedValue(undefined) };
  const notifications = { dispatch: jest.fn().mockResolvedValue(undefined) };

  return {
    service: new SupportService(
      prisma as never,
      files as unknown as FilesService,
      notifications as unknown as NotificationsService,
    ),
    prisma,
    files,
    notifications,
  };
}

async function codeOfRejection(fn: () => Promise<unknown>): Promise<string> {
  try {
    await fn();
    return 'NO_THROW';
  } catch (error) {
    return (error as { code?: string }).code ?? 'UNKNOWN';
  }
}

describe('SupportService', () => {
  describe('createTicket', () => {
    it('bilet ve ilk mesajı birlikte oluşturur', async () => {
      const { service, prisma, files } = createService();
      const created = ticketRow();
      prisma.supportTicket.create.mockResolvedValue(created);

      const dto: CreateSupportTicketDto = {
        subject: 'Ödeme sorunu',
        body: 'Ödemem bloke kaldı, yardımcı olur musunuz?',
        attachmentFileIds: [],
      };

      const result = await service.createTicket(customer, dto);

      expect(files.assertOwnedBy).toHaveBeenCalledWith(CUSTOMER_ID, []);
      expect(result.id).toBe(TICKET_ID);
      expect(result.messages).toHaveLength(1);
      expect(result.status).toBe(SupportTicketStatus.OPEN);
    });

    it('yabancı siparişe bağlanmayı reddeder', async () => {
      const { service, prisma } = createService();
      prisma.order.findFirst.mockResolvedValue({
        id: ORDER_ID,
        customerId: 'other',
        providerProfile: { userId: 'provider' },
      });

      await expect(
        codeOfRejection(() =>
          service.createTicket(customer, {
            subject: 'Sipariş sorunu',
            body: 'Siparişimle ilgili yardım istiyorum.',
            orderId: ORDER_ID,
            attachmentFileIds: [],
          }),
        ),
      ).resolves.toBe('FORBIDDEN_RESOURCE');
    });
  });

  describe('addMessage', () => {
    it('personel yanıtında WAITING_CUSTOMER ve bildirim üretir', async () => {
      const { service, prisma, notifications } = createService();
      prisma.supportTicket.findFirst.mockResolvedValue(ticketRow());
      prisma.supportMessage.create.mockResolvedValue(messageRow());
      prisma.supportTicket.update.mockResolvedValue({});

      const dto: SupportTicketReplyDto = {
        body: 'İnceliyoruz, kısa sürede dönüş yapacağız.',
        attachmentFileIds: [],
      };

      const message = await service.addMessage(staff, TICKET_ID, dto);

      expect(message.isFromStaff).toBe(true);
      expect(prisma.supportTicket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: SupportTicketStatus.WAITING_CUSTOMER }),
        }),
      );
      expect(notifications.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: CUSTOMER_ID,
          type: NotificationType.SUPPORT_REPLY,
          params: { ticketSubject: 'Ödeme sorunu' },
        }),
      );
    });

    it('kullanıcı yanıtında WAITING_SUPPORT olur, bildirim gitmez', async () => {
      const { service, prisma, notifications } = createService();
      prisma.supportTicket.findFirst.mockResolvedValue(
        ticketRow({ status: SupportTicketStatus.WAITING_CUSTOMER }),
      );
      prisma.supportMessage.create.mockResolvedValue(
        messageRow({ senderId: CUSTOMER_ID, isFromStaff: false, body: 'Teşekkürler, bekliyorum.' }),
      );
      prisma.supportTicket.update.mockResolvedValue({});

      await service.addMessage(customer, TICKET_ID, {
        body: 'Teşekkürler, bekliyorum.',
        attachmentFileIds: [],
      });

      expect(prisma.supportTicket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: SupportTicketStatus.WAITING_SUPPORT }),
        }),
      );
      expect(notifications.dispatch).not.toHaveBeenCalled();
    });

    it('yabancı kullanıcının bilete yazmasını engeller', async () => {
      const { service, prisma } = createService();
      prisma.supportTicket.findFirst.mockResolvedValue(ticketRow());

      await expect(
        codeOfRejection(() =>
          service.addMessage(stranger, TICKET_ID, { body: 'Merhaba', attachmentFileIds: [] }),
        ),
      ).resolves.toBe('FORBIDDEN_RESOURCE');
    });

    it('kapatılmış bilete mesaj yazdırmaz', async () => {
      const { service, prisma } = createService();
      prisma.supportTicket.findFirst.mockResolvedValue(
        ticketRow({ status: SupportTicketStatus.CLOSED }),
      );

      await expect(
        codeOfRejection(() =>
          service.addMessage(customer, TICKET_ID, { body: 'Yeniden aç', attachmentFileIds: [] }),
        ),
      ).resolves.toBe('VALIDATION_ERROR');
    });
  });

  describe('closeTicket', () => {
    it('bileti kapatır', async () => {
      const { service, prisma } = createService();
      prisma.supportTicket.findFirst.mockResolvedValue(ticketRow());
      prisma.supportTicket.update.mockResolvedValue(
        ticketRow({ status: SupportTicketStatus.CLOSED, messages: undefined }),
      );

      const closed = await service.closeTicket(customer, TICKET_ID);
      expect(closed.status).toBe(SupportTicketStatus.CLOSED);
    });
  });

  describe('complaints', () => {
    it('şikâyet oluşturur', async () => {
      const { service, prisma } = createService();
      prisma.complaint.create.mockResolvedValue(complaintRow());

      const dto: CreateComplaintDto = {
        subjectType: ComplaintSubjectType.USER,
        subjectId: '0194a1b2-c3d4-7000-8000-000000000015',
        reason: 'Uygunsuz davranış',
        description: 'İş sırasında kaba davrandı.',
      };

      const result = await service.createComplaint(customer, dto);
      expect(result.status).toBe(ComplaintStatus.OPEN);
      expect(result.reason).toBe('Uygunsuz davranış');
    });

    it('admin çözümlemede resolvedAt yazar', async () => {
      const { service, prisma } = createService();
      prisma.complaint.findFirst.mockResolvedValue({
        id: COMPLAINT_ID,
        status: ComplaintStatus.OPEN,
      });
      prisma.complaint.update.mockResolvedValue({
        ...complaintRow({
          status: ComplaintStatus.RESOLVED,
          resolutionNote: 'Uyarı verildi',
          resolvedAt: new Date('2026-03-02T09:00:00.000Z'),
        }),
        reporter: {
          id: CUSTOMER_ID,
          fullName: 'Ayşe Demir',
          email: 'ayse@example.com',
        },
      });

      const result = await service.updateComplaint(COMPLAINT_ID, {
        status: ComplaintStatus.RESOLVED,
        resolutionNote: 'Uyarı verildi',
      });

      expect(result.status).toBe(ComplaintStatus.RESOLVED);
      expect(result.resolutionNote).toBe('Uyarı verildi');
      expect(result.resolvedAt).toBeTruthy();
    });
  });

  describe('listMine', () => {
    it('yalnızca kendi biletlerini sayfalar', async () => {
      const { service, prisma } = createService();
      prisma.supportTicket.findMany.mockResolvedValue([ticketRow({ messages: undefined })]);
      prisma.supportTicket.count.mockResolvedValue(1);

      const query = Object.assign(new PaginationQueryDto(), { page: 1, limit: 20 });
      const page = await service.listMine(customer, query);

      expect(page.items).toHaveLength(1);
      expect(prisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: CUSTOMER_ID, deletedAt: null }),
        }),
      );
    });
  });
});
