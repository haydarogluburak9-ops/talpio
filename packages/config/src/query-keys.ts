/**
 * TanStack Query anahtar standardı. Web ve admin aynı fabrikayı kullanır;
 * böylece bir mutasyondan sonra hangi sorguların geçersizleneceği tek yerden
 * bilinir ve anahtar çakışmaları önlenir.
 */
export const queryKeys = {
  requests: {
    all: () => ['requests'] as const,
    mine: () => ['requests', 'mine'] as const,
    myOffers: (limit: number) => ['requests', 'my-offers', limit] as const,
    matched: () => ['requests', 'matched'] as const,
    nearby: (limit: number) => ['requests', 'nearby', limit] as const,
    detail: (id: string) => ['requests', 'detail', id] as const,
    offers: (id: string) => ['requests', 'offers', id] as const,
  },
  businesses: {
    all: () => ['businesses'] as const,
    mine: () => ['businesses', 'mine'] as const,
  },

  auth: {
    session: () => ['auth', 'session'] as const,
    sessions: () => ['auth', 'sessions'] as const,
  },
  catalog: {
    categories: (params?: Record<string, unknown>) => ['catalog', 'categories', params ?? {}] as const,
    category: (slug: string) => ['catalog', 'categories', 'detail', slug] as const,
    categoryAttributeSchema: (idOrSlug: string) =>
      ['catalog', 'categories', 'attribute-schema', idOrSlug] as const,
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
  social: {
    all: () => ['social'] as const,
    me: () => ['social', 'me'] as const,
    usernameAvailability: (username: string) => ['social', 'username-availability', username] as const,
    profile: (username: string) => ['social', 'profile', username] as const,
    profileSearch: (query: string) => ['social', 'profile-search', query] as const,
    followers: (username: string, params?: Record<string, unknown>) =>
      ['social', 'followers', username, params ?? {}] as const,
    following: (username: string, params?: Record<string, unknown>) =>
      ['social', 'following', username, params ?? {}] as const,
    feed: (params?: Record<string, unknown>) => ['social', 'feed', params ?? {}] as const,
    discover: (params?: Record<string, unknown>) => ['social', 'discover', params ?? {}] as const,
    categoryFollows: () => ['social', 'categoryFollows'] as const,
    analyticsMe: () => ['social', 'analytics', 'me'] as const,
    post: (id: string) => ['social', 'post', id] as const,
    postsByUsername: (username: string, params?: Record<string, unknown>) =>
      ['social', 'posts', username, params ?? {}] as const,
    comments: (postId: string, params?: Record<string, unknown>) =>
      ['social', 'comments', postId, params ?? {}] as const,
    trending: (params?: Record<string, unknown>) =>
      ['social', 'trending', params ?? {}] as const,
    hashtagPosts: (slug: string, params?: Record<string, unknown>) =>
      ['social', 'hashtag', slug, params ?? {}] as const,
    saved: () => ['social', 'saved'] as const,
    stories: () => ['social', 'stories'] as const,
    profileStories: (username: string) => ['social', 'profile-stories', username] as const,
    profileHighlights: (username: string) => ['social', 'profile-highlights', username] as const,
    profileHighlight: (username: string, highlightId: string) =>
      ['social', 'profile-highlight', username, highlightId] as const,
    groups: () => ['social', 'groups'] as const,
    skillSuggest: (query: string) => ['social', 'skill-suggest', query] as const,
    positionSuggest: (query: string) => ['social', 'position-suggest', query] as const,
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
  agent: {
    all: () => ['agent'] as const,
    threads: () => ['agent', 'threads'] as const,
    thread: (id: string) => ['agent', 'threads', id] as const,
    pendingActions: () => ['agent', 'actions', 'pending'] as const,
  },
  billing: {
    all: () => ['billing'] as const,
    credits: () => ['billing', 'credits'] as const,
    transactions: (params?: Record<string, unknown>) =>
      ['billing', 'transactions', params ?? {}] as const,
    usage: (params?: Record<string, unknown>) => ['billing', 'usage', params ?? {}] as const,
    plans: () => ['billing', 'plans'] as const,
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
    subscriptions: () => ['admin', 'subscriptions'] as const,
    campaigns: () => ['admin', 'campaigns'] as const,
    aiUsage: () => ['admin', 'ai-usage'] as const,
    fraudFlags: (params?: Record<string, unknown>) => ['admin', 'fraud-flags', params ?? {}] as const,
    moderation: (params?: Record<string, unknown>) => ['admin', 'moderation', params ?? {}] as const,
    commerceRequests: () => ['admin', 'commerce-requests'] as const,
    backupStatus: () => ['admin', 'backup-status'] as const,
    deadLetters: () => ['admin', 'dead-letters'] as const,
  },
  system: {
    health: () => ['system', 'health'] as const,
    status: () => ['system', 'status'] as const,
    queues: () => ['system', 'queues'] as const,
  },
} as const;
