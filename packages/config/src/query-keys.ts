/**
 * TanStack Query anahtar standardı. Web ve admin aynı fabrikayı kullanır;
 * böylece bir mutasyondan sonra hangi sorguların geçersizleneceği tek yerden
 * bilinir ve anahtar çakışmaları önlenir.
 */
export const queryKeys = {
  auth: {
    session: () => ['auth', 'session'] as const,
    sessions: () => ['auth', 'sessions'] as const,
  },
  catalog: {
    categories: (params?: Record<string, unknown>) => ['catalog', 'categories', params ?? {}] as const,
    category: (slug: string) => ['catalog', 'categories', 'detail', slug] as const,
    cities: (countryId?: string) => ['catalog', 'cities', countryId ?? 'all'] as const,
    districts: (cityId: string) => ['catalog', 'districts', cityId] as const,
  },
  jobs: {
    all: () => ['jobs'] as const,
    list: (params?: Record<string, unknown>) => ['jobs', 'list', params ?? {}] as const,
    available: (params?: Record<string, unknown>) => ['jobs', 'available', params ?? {}] as const,
    detail: (id: string) => ['jobs', 'detail', id] as const,
    offers: (jobId: string) => ['jobs', 'detail', jobId, 'offers'] as const,
  },
  offers: {
    all: () => ['offers'] as const,
    mine: (params?: Record<string, unknown>) => ['offers', 'mine', params ?? {}] as const,
    detail: (id: string) => ['offers', 'detail', id] as const,
  },
  orders: {
    all: () => ['orders'] as const,
    list: (params?: Record<string, unknown>) => ['orders', 'list', params ?? {}] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },
  providers: {
    all: () => ['providers'] as const,
    list: (params?: Record<string, unknown>) => ['providers', 'list', params ?? {}] as const,
    detail: (id: string) => ['providers', 'detail', id] as const,
    me: () => ['providers', 'me'] as const,
    myServices: () => ['providers', 'me', 'services'] as const,
    earnings: (params?: Record<string, unknown>) => ['providers', 'me', 'earnings', params ?? {}] as const,
    favorites: () => ['providers', 'favorites'] as const,
  },
  messages: {
    all: () => ['messages'] as const,
    conversations: (params?: Record<string, unknown>) => ['messages', 'conversations', params ?? {}] as const,
    conversation: (id: string) => ['messages', 'conversation', id] as const,
    thread: (conversationId: string) => ['messages', 'conversations', conversationId] as const,
  },
  notifications: {
    all: () => ['notifications'] as const,
    list: (params?: Record<string, unknown>) => ['notifications', 'list', params ?? {}] as const,
    unreadCount: () => ['notifications', 'unread-count'] as const,
  },
  reviews: {
    all: () => ['reviews'] as const,
    mine: (params?: Record<string, unknown>) => ['reviews', 'mine', params ?? {}] as const,
    detail: (id: string) => ['reviews', 'detail', id] as const,
    forOrder: (orderId: string) => ['reviews', 'order', orderId] as const,
    forProvider: (providerId: string, params?: Record<string, unknown>) =>
      ['reviews', 'provider', providerId, params ?? {}] as const,
  },
  payments: {
    all: () => ['payments'] as const,
    list: (params?: Record<string, unknown>) => ['payments', 'list', params ?? {}] as const,
    detail: (id: string) => ['payments', 'detail', id] as const,
    forOrder: (orderId: string) => ['payments', 'order', orderId] as const,
    transactions: (params?: Record<string, unknown>) =>
      ['payments', 'transactions', params ?? {}] as const,
    wallet: () => ['payments', 'wallet'] as const,
  },
  support: {
    tickets: (params?: Record<string, unknown>) => ['support', 'tickets', params ?? {}] as const,
    ticket: (id: string) => ['support', 'tickets', id] as const,
    complaints: (params?: Record<string, unknown>) =>
      ['support', 'complaints', params ?? {}] as const,
  },
  admin: {
    dashboard: () => ['admin', 'dashboard'] as const,
    users: (params?: Record<string, unknown>) => ['admin', 'users', params ?? {}] as const,
    user: (id: string) => ['admin', 'users', 'detail', id] as const,
    providers: (params?: Record<string, unknown>) => ['admin', 'providers', params ?? {}] as const,
    jobs: (params?: Record<string, unknown>) => ['admin', 'jobs', params ?? {}] as const,
    offers: (params?: Record<string, unknown>) => ['admin', 'offers', params ?? {}] as const,
    orders: (params?: Record<string, unknown>) => ['admin', 'orders', params ?? {}] as const,
    payments: (params?: Record<string, unknown>) => ['admin', 'payments', params ?? {}] as const,
    transactions: (params?: Record<string, unknown>) =>
      ['admin', 'transactions', params ?? {}] as const,
    commissions: (params?: Record<string, unknown>) =>
      ['admin', 'commissions', params ?? {}] as const,
    supportTickets: (params?: Record<string, unknown>) =>
      ['admin', 'support-tickets', params ?? {}] as const,
    supportTicket: (id: string) => ['admin', 'support-tickets', id] as const,
    complaints: (params?: Record<string, unknown>) =>
      ['admin', 'complaints', params ?? {}] as const,
    notifications: (params?: Record<string, unknown>) =>
      ['admin', 'notifications', params ?? {}] as const,
    reviews: (params?: Record<string, unknown>) => ['admin', 'reviews', params ?? {}] as const,
    auditLogs: (params?: Record<string, unknown>) => ['admin', 'audit-logs', params ?? {}] as const,
    providerDocuments: (params?: Record<string, unknown>) =>
      ['admin', 'provider-documents', params ?? {}] as const,
    settings: () => ['admin', 'settings'] as const,
    roles: () => ['admin', 'settings', 'roles'] as const,
  },
  system: {
    health: () => ['system', 'health'] as const,
  },
} as const;
