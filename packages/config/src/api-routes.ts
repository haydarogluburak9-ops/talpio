export const API_VERSION = 'v1';
export const API_PREFIX = `api/${API_VERSION}`;

/**
 * API yollarının tek kaynağı. Backend controller yolları, web/admin istemcileri
 * ve testler bu tanımları kullanır; yol değişikliği tek yerden yapılır.
 */
export const API_ROUTES = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    logoutAll: '/auth/logout-all',
    me: '/auth/me',
    verifyEmail: '/auth/verify-email',
    requestPhoneCode: '/auth/phone/request-code',
    verifyPhone: '/auth/phone/verify',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    sessions: '/auth/sessions',
  },
  users: {
    root: '/users',
    byId: (id: string) => `/users/${id}`,
    me: '/users/me',
    addresses: '/users/me/addresses',
    addressById: (id: string) => `/users/me/addresses/${id}`,
  },
  providers: {
    root: '/providers',
    byId: (id: string) => `/providers/${id}`,
    me: '/providers/me',
    services: '/providers/me/services',
    serviceAreas: '/providers/me/service-areas',
    availability: '/providers/me/availability',
    documents: '/providers/me/documents',
    earnings: '/providers/me/earnings',
    reviews: (id: string) => `/providers/${id}/reviews`,
    favorites: '/providers/favorites',
    favoriteById: (id: string) => `/providers/favorites/${id}`,
  },
  catalog: {
    categories: '/categories',
    categoryById: (id: string) => `/categories/${id}`,
    countries: '/locations/countries',
    cities: '/locations/cities',
    districts: '/locations/districts',
    neighborhoods: '/locations/neighborhoods',
  },
  jobs: {
    root: '/jobs',
    byId: (id: string) => `/jobs/${id}`,
    publish: (id: string) => `/jobs/${id}/publish`,
    cancel: (id: string) => `/jobs/${id}/cancel`,
    status: (id: string) => `/jobs/${id}/status`,
    attachments: (id: string) => `/jobs/${id}/attachments`,
    offers: (id: string) => `/jobs/${id}/offers`,
    /** Ustaya açık iş havuzu. */
    available: '/jobs/available',
  },
  offers: {
    root: '/offers',
    byId: (id: string) => `/offers/${id}`,
    accept: (id: string) => `/offers/${id}/accept`,
    reject: (id: string) => `/offers/${id}/reject`,
    withdraw: (id: string) => `/offers/${id}/withdraw`,
    mine: '/offers/mine',
  },
  orders: {
    root: '/orders',
    byId: (id: string) => `/orders/${id}`,
    /** Müşteri ödemeyi tamamlar; iş takvime alınır. */
    pay: (id: string) => `/orders/${id}/pay`,
    /** Usta işe başladığını bildirir. */
    start: (id: string) => `/orders/${id}/start`,
    /** Usta işi bitirir; müşteri onayı beklenir. */
    complete: (id: string) => `/orders/${id}/complete`,
    approve: (id: string) => `/orders/${id}/approve`,
    cancel: (id: string) => `/orders/${id}/cancel`,
  },
  messages: {
    /** Listeleme (GET) ve siparişin sohbetini açma (POST) aynı yolu kullanır. */
    conversations: '/messages/conversations',
    conversationById: (id: string) => `/messages/conversations/${id}`,
    messages: (conversationId: string) => `/messages/conversations/${conversationId}/messages`,
    read: (conversationId: string) => `/messages/conversations/${conversationId}/read`,
  },
  reviews: {
    root: '/reviews',
    byId: (id: string) => `/reviews/${id}`,
    reply: (id: string) => `/reviews/${id}/reply`,
  },
  notifications: {
    root: '/notifications',
    read: (id: string) => `/notifications/${id}/read`,
    readAll: '/notifications/read-all',
    deviceTokens: '/notifications/device-tokens',
  },
  payments: {
    root: '/payments',
    byId: (id: string) => `/payments/${id}`,
    checkout: '/payments/checkout',
    webhook: '/payments/webhook',
    transactions: '/payments/transactions',
    /** Ustanın cüzdan özeti: kullanılabilir bakiye ve bloke hakediş. */
    wallet: '/payments/wallet',
    refund: (id: string) => `/payments/${id}/refund`,
  },
  support: {
    tickets: '/support/tickets',
    ticketById: (id: string) => `/support/tickets/${id}`,
    ticketMessages: (id: string) => `/support/tickets/${id}/messages`,
    complaints: '/support/complaints',
  },
  files: {
    upload: '/files/upload',
    byId: (id: string) => `/files/${id}`,
  },
  admin: {
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    userById: (id: string) => `/admin/users/${id}`,
    userStatus: (id: string) => `/admin/users/${id}/status`,
    userRevokeSessions: (id: string) => `/admin/users/${id}/revoke-sessions`,
    providers: '/admin/providers',
    providerVerification: (id: string) => `/admin/providers/${id}/verification`,
    providerDocuments: '/admin/provider-documents',
    jobs: '/admin/jobs',
    offers: '/admin/offers',
    orders: '/admin/orders',
    payments: '/admin/payments',
    transactions: '/admin/transactions',
    commissions: '/admin/commissions',
    categories: '/admin/categories',
    locations: '/admin/locations',
    reviews: '/admin/reviews',
    complaints: '/admin/complaints',
    supportTickets: '/admin/support-tickets',
    notifications: '/admin/notifications',
    settings: '/admin/settings',
    auditLogs: '/admin/audit-logs',
  },
  health: {
    live: '/health',
    ready: '/health/ready',
  },
} as const;
