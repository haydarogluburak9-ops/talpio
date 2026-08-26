import type { PrismaClient } from '../../../src/generated/prisma/client';
import {
  PostType,
  PostVisibility,
  RequestSource,
  RequestStatus,
  RequestType,
} from '../../../src/generated/prisma/enums';

import { refreshDemoStories } from '../../../src/modules/social/demo-story-refresh';
import { DEMO_ACCOUNTS } from './demo-accounts';

const IMG = {
  site: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1400&q=80',
  cement: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1400&q=80',
  warehouse: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1400&q=80',
  electric: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1400&q=80',
  workshop: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1400&q=80',
  steel: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1400&q=80',
  windows: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
  lights: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1400&q=80',
  truck: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1400&q=80',
  tools: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1400&q=80',
  barrels: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&w=1400&q=80',
  pallets: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1400&q=80',
} as const;

const PROFILE_PHOTOS: Record<string, { avatar: string; cover?: string }> = {
  burak: {
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
  },
  elifyag: {
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80',
  },
  demiryag: {
    avatar: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=256&h=256&q=80',
    cover: IMG.barrels,
  },
  ahmetkaya: {
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&h=256&q=80',
  },
  ahmetyapi: {
    avatar: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=256&h=256&q=80',
    cover: IMG.site,
  },
  xyzelektrik: {
    avatar: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=256&h=256&q=80',
    cover: IMG.electric,
  },
  ganteppvc: {
    avatar: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=256&h=256&q=80',
    cover: IMG.windows,
  },
  anadolucimento: {
    avatar: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=256&h=256&q=80',
    cover: IMG.cement,
  },
  metalplus: {
    avatar: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=256&h=256&q=80',
    cover: IMG.steel,
  },
  denizinsaat: {
    avatar: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=256&h=256&q=80',
    cover: IMG.truck,
  },
  selinkoc: {
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&h=256&q=80',
  },
  muratsahin: {
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
  },
};

type SeedPost = {
  author: string;
  hoursAgo: number;
  type: PostType;
  body: string;
  image?: string;
  deal?: {
    title: string;
    listPriceMinor: number;
    dealPriceMinor: number;
    discountPercent: number;
    unit?: string;
    stockQuantity?: string;
    locationText?: string;
  };
  /**
   * REQUEST_SHARE gönderileri için kaynak talep. Bağlantı olmadan akıştaki
   * "Teklif ver" eylemi hedefsiz kalır.
   */
  request?: {
    title: string;
    requestType: RequestType;
    quantity?: number;
    unit?: string;
    budgetMinor?: number;
    deliveryAddressText?: string;
  };
  comments?: Array<{ author: string; body: string }>;
  likedBy?: string[];
  savedBy?: string[];
  sharedBy?: string[];
};

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function upsertPublicImage(
  prisma: PrismaClient,
  url: string,
  name: string,
) {
  return prisma.fileAsset.upsert({
    where: { storageKey: url },
    create: {
      storageKey: url,
      mimeType: 'image/jpeg',
      sizeBytes: 220_000,
      originalName: name,
      isPublic: true,
    },
    update: { isPublic: true },
  });
}

const FEED_POSTS: SeedPost[] = [
  {
    author: 'ahmetyapi',
    hoursAgo: 1,
    type: PostType.CAMPAIGN,
    image: IMG.cement,
    body: 'Bu hafta şantiyeye özel çimento kampanyası. Palet bazlı fiyat, İstanbul içi teslim. #cimento #indirim #insaat #istanbul',
    deal: {
      title: 'Çimento palet kampanyası',
      listPriceMinor: 285000,
      dealPriceMinor: 249000,
      discountPercent: 13,
      unit: 'palet',
      stockQuantity: '40 palet',
      locationText: 'Istanbul',
    },
    comments: [
      { author: 'burak', body: 'Bu kampanyayı denedik, sevkiyat zamanında geldi.' },
      { author: 'selinkoc', body: 'Minimum palet kaç?' },
    ],
    likedBy: ['burak', 'selinkoc', 'muratsahin', 'demiryag', 'xyzelektrik'],
    savedBy: ['burak', 'denizinsaat'],
    sharedBy: ['selinkoc'],
  },
  {
    author: 'selinkoc',
    hoursAgo: 2,
    type: PostType.REQUEST_SHARE,
    image: IMG.barrels,
    body: 'Acil: 2 ton hidrolik yağ lazım, ISO 46. New York loft projesi. Teklif bekliyorum. #madeniyağ #acil #newyork',
    request: {
      title: '2 ton hidrolik yağ (ISO 46)',
      requestType: RequestType.PRODUCT_SUPPLY,
      quantity: 2,
      unit: 'ton',
      deliveryAddressText: 'New York',
    },
    comments: [
      { author: 'elifyag', body: 'Stokta var, mesaj atın fiyatı ileteyim.' },
      { author: 'muratsahin', body: 'Biz de aynı ürünü arıyorduk, takip.' },
    ],
    likedBy: ['elifyag', 'burak', 'demiryag', 'muratsahin'],
    savedBy: ['demiryag'],
  },
  {
    author: 'xyzelektrik',
    hoursAgo: 3,
    type: PostType.DEAL,
    image: IMG.electric,
    body: 'NYM kablo stok eritme. 3x2.5 ve 3x1.5 makara. Bugün sipariş, yarın yola çıkar. #elektrik #indirim #kablo',
    deal: {
      title: 'NYM 3x2.5 makara',
      listPriceMinor: 420000,
      dealPriceMinor: 365000,
      discountPercent: 13,
      unit: 'makara',
      stockQuantity: '18 makara',
      locationText: 'Berlin',
    },
    comments: [{ author: 'ahmetkaya', body: 'Bu talebe teklif verdik, fiyat tuttu.' }],
    likedBy: ['burak', 'ahmetyapi', 'denizinsaat', 'muratsahin', 'selinkoc'],
    savedBy: ['burak'],
    sharedBy: ['ahmetyapi'],
  },
  {
    author: 'demiryag',
    hoursAgo: 4,
    type: PostType.NEW_PRODUCT,
    image: IMG.workshop,
    body: 'Yeni gelen 5W-30 sentetik. Filo için varil fiyatı konuşulur. #madeniyağ #yenürün #filo',
    deal: {
      title: '5W-30 sentetik varil',
      listPriceMinor: 1850000,
      dealPriceMinor: 1640000,
      discountPercent: 11,
      unit: 'varil',
      stockQuantity: '12 varil',
      locationText: 'Dubai',
    },
    comments: [{ author: 'burak', body: 'Varil + pompa birlikte olur mu?' }],
    likedBy: ['burak', 'selinkoc', 'muratsahin', 'ahmetyapi'],
    savedBy: ['selinkoc'],
  },
  {
    author: 'ganteppvc',
    hoursAgo: 5,
    type: PostType.BUSINESS_UPDATE,
    image: IMG.windows,
    body: 'Yeni sezon PVC profil renkleri geldi. Antrasit ve meşe stokta. Showroom’a bekleriz. #pvc #gaziantep #yenisezon',
    comments: [{ author: 'denizinsaat', body: 'Antrasit için metraj çalışması yapalım.' }],
    likedBy: ['burak', 'denizinsaat', 'ahmetyapi', 'selinkoc'],
  },
  {
    author: 'anadolucimento',
    hoursAgo: 6,
    type: PostType.LIMITED_STOCK,
    image: IMG.pallets,
    body: 'Haftalık kota: 80 ton çimento. Şantiye teslim slotları doluyor. #cimento #insaat #stok',
    deal: {
      title: 'Şantiye teslim çimento',
      listPriceMinor: 245000,
      dealPriceMinor: 229000,
      discountPercent: 7,
      unit: 'ton',
      stockQuantity: '80 ton',
      locationText: 'Ankara',
    },
    likedBy: ['ahmetyapi', 'denizinsaat', 'burak', 'muratsahin', 'metalplus'],
    savedBy: ['ahmetyapi', 'denizinsaat'],
    sharedBy: ['denizinsaat'],
  },
  {
    author: 'metalplus',
    hoursAgo: 7,
    type: PostType.BULK_PRICE,
    image: IMG.steel,
    body: 'İnşaat demiri 12-14-16 tonajlı alıma özel. Kesim dahil konuşulur. #metal #demir #insaat',
    deal: {
      title: 'İnşaat demiri tonaj',
      listPriceMinor: 2650000,
      dealPriceMinor: 2480000,
      discountPercent: 6,
      unit: 'ton',
      stockQuantity: '35 ton',
      locationText: 'London',
    },
    comments: [{ author: 'ahmetyapi', body: '14’lük 8 ton için yazın.' }],
    likedBy: ['ahmetyapi', 'denizinsaat', 'burak', 'selinkoc'],
  },
  {
    author: 'muratsahin',
    hoursAgo: 8,
    type: PostType.REQUEST_SHARE,
    image: IMG.warehouse,
    body: 'Berlin’e 6.000 m PVC profil. Teklif ve teslim süresi önemli. #pvc #talep #berlin',
    request: {
      title: '6.000 m PVC profil tedariki',
      requestType: RequestType.WHOLESALE,
      quantity: 6000,
      unit: 'm',
      deliveryAddressText: 'Berlin',
    },
    comments: [{ author: 'hasanozturk', body: 'Gaziantep’ten yükleriz, navlun ayrı hesaplanır.' }],
    likedBy: ['ganteppvc', 'burak', 'denizinsaat', 'selinkoc'],
    savedBy: ['ganteppvc'],
  },
  {
    author: 'denizinsaat',
    hoursAgo: 9,
    type: PostType.QUESTION,
    image: IMG.tools,
    body: 'Madrid organize sanayide elektrik pano tedarikçisi arayan var mı? Referans önemli. #elektrik #pano #madrid',
    comments: [
      { author: 'xyzelektrik', body: 'İki referans şantiye gönderebilirim.' },
      { author: 'burak', body: 'XYZ ile çalıştık, yanıt süreleri iyiydi.' },
    ],
    likedBy: ['xyzelektrik', 'burak', 'ahmetyapi', 'selinkoc'],
  },
  {
    author: 'ahmetyapi',
    hoursAgo: 11,
    type: PostType.SERVICE_PROMOTION,
    image: IMG.truck,
    body: 'Şantiye lojistiği: aynı gün İstanbul içi, 24 saatte bölge. #insaat #lojistik #istanbul',
    likedBy: ['burak', 'selinkoc', 'demiryag', 'muratsahin'],
  },
  {
    author: 'elifyag',
    hoursAgo: 13,
    type: PostType.TEXT,
    image: IMG.barrels,
    body: 'Cuma hatırlatması: hidrolik yağ numune setleri hazır. Atölyeler yazsın. #madeniyağ #numune',
    likedBy: ['burak', 'selinkoc', 'muratsahin'],
    comments: [{ author: 'selinkoc', body: 'ISO 68 de var mı?' }],
  },
  {
    author: 'xyzelektrik',
    hoursAgo: 16,
    type: PostType.CAMPAIGN,
    image: IMG.lights,
    body: 'Aydınlatma armatürlerinde proje iskontosu. 50+ adet için özel liste. #elektrik #indirim #aydinlatma',
    deal: {
      title: 'Proje aydınlatma iskontosu',
      listPriceMinor: 89000,
      dealPriceMinor: 72000,
      discountPercent: 19,
      unit: 'adet',
      stockQuantity: '200 adet',
      locationText: 'Ankara',
    },
    likedBy: ['denizinsaat', 'burak', 'ahmetyapi', 'muratsahin', 'selinkoc'],
    savedBy: ['denizinsaat'],
  },
  {
    author: 'ahmetyapi',
    hoursAgo: 0.4,
    type: PostType.BUSINESS_UPDATE,
    image: IMG.site,
    body: 'Sabah şantiye. Paletler yerinde, döküm 10:00’da. #insaat #istanbul',
    likedBy: ['burak', 'selinkoc', 'denizinsaat'],
  },
  {
    author: 'demiryag',
    hoursAgo: 0.8,
    type: PostType.NEW_PRODUCT,
    image: IMG.workshop,
    body: 'Depo turu: yeni variller rafa çıktı. #madeniyağ',
    likedBy: ['burak', 'selinkoc'],
  },
  {
    author: 'xyzelektrik',
    hoursAgo: 1.2,
    type: PostType.SERVICE_PROMOTION,
    image: IMG.lights,
    body: 'Showroom’da yeni armatür duvarı. Proje için gelin bakın. #elektrik #aydinlatma',
    likedBy: ['burak', 'ahmetyapi', 'denizinsaat'],
  },
  {
    author: 'ganteppvc',
    hoursAgo: 1.6,
    type: PostType.BUSINESS_UPDATE,
    image: IMG.windows,
    body: 'Antrasit doğrama montajı bugün bitti. #pvc',
    likedBy: ['burak', 'denizinsaat'],
  },
];

/** 24 saatlik hikâye rayı. Seed her çalıştığında saat damgası yenilenir. */
const STORY_POSTS: SeedPost[] = [
  {
    author: 'ahmetyapi',
    hoursAgo: 0.2,
    type: PostType.BUSINESS_UPDATE,
    image: IMG.site,
    body: 'Sabah vardiyası: kalıp sökümü bitti, döküm öğleden sonra. #insaat #hikaye',
  },
  {
    author: 'demiryag',
    hoursAgo: 0.7,
    type: PostType.NEW_PRODUCT,
    image: IMG.barrels,
    body: 'Yeni varil partisi rampa indi. ISO 46 stok yenilendi. #madeniyağ #hikaye',
  },
  {
    author: 'xyzelektrik',
    hoursAgo: 1.4,
    type: PostType.SERVICE_PROMOTION,
    image: IMG.electric,
    body: 'Pano testleri canlı. Proje keşfi için showroom açık. #elektrik #hikaye',
  },
  {
    author: 'ganteppvc',
    hoursAgo: 2.1,
    type: PostType.BUSINESS_UPDATE,
    image: IMG.windows,
    body: 'Antrasit doğrama hattı bugün dolu. Yeni renk kartelası vitrinde. #pvc #hikaye',
  },
  {
    author: 'anadolucimento',
    hoursAgo: 3.2,
    type: PostType.LIMITED_STOCK,
    image: IMG.cement,
    body: 'Öğleden sonra 3 kamyon çıkış. Şantiye slotu kalanlar yazsın. #cimento #hikaye',
  },
  {
    author: 'metalplus',
    hoursAgo: 4.5,
    type: PostType.BULK_PRICE,
    image: IMG.steel,
    body: '14’lük demir kesim hattı çalışıyor. Tonajlı alıma yer var. #metal #hikaye',
  },
  {
    author: 'denizinsaat',
    hoursAgo: 5.5,
    type: PostType.BUSINESS_UPDATE,
    image: IMG.truck,
    body: 'Filo yola çıktı: İstanbul içi aynı gün teslim. #lojistik #hikaye',
  },
  {
    author: 'elifyag',
    hoursAgo: 6.5,
    type: PostType.NEW_PRODUCT,
    image: IMG.workshop,
    body: 'Numune setleri paketlendi. Atölyeler bugün alsın. #madeniyağ #hikaye',
  },
];

const FOLLOW_EDGES: Array<[string, string]> = [
  ['burak', 'demiryag'],
  ['burak', 'ahmetyapi'],
  ['burak', 'xyzelektrik'],
  ['burak', 'ganteppvc'],
  ['burak', 'anadolucimento'],
  ['burak', 'metalplus'],
  ['burak', 'denizinsaat'],
  ['burak', 'selinkoc'],
  ['burak', 'muratsahin'],
  ['selinkoc', 'demiryag'],
  ['selinkoc', 'ahmetyapi'],
  ['selinkoc', 'xyzelektrik'],
  ['muratsahin', 'ganteppvc'],
  ['muratsahin', 'anadolucimento'],
  ['muratsahin', 'metalplus'],
  ['elifyag', 'ahmetyapi'],
  ['elifyag', 'xyzelektrik'],
  ['ahmetkaya', 'demiryag'],
  ['ahmetkaya', 'metalplus'],
  ['denizinsaat', 'ahmetyapi'],
  ['denizinsaat', 'xyzelektrik'],
  ['denizinsaat', 'anadolucimento'],
  ['demiryag', 'ahmetyapi'],
  ['xyzelektrik', 'ahmetyapi'],
  ['ganteppvc', 'denizinsaat'],
];

const CATEGORY_FOLLOWS: Array<[string, string]> = [
  ['burak', 'insaat-yapi'],
  ['burak', 'madeni-yag-kimya'],
  ['selinkoc', 'madeni-yag-kimya'],
  ['muratsahin', 'insaat-yapi'],
];

async function findCityId(prisma: PrismaClient, name?: string | null): Promise<string | null> {
  if (!name) return null;
  const token = name.split(/[/·,]/)[0]?.trim();
  if (!token) return null;
  const city = await prisma.city.findFirst({
    where: { name: { equals: token, mode: 'insensitive' } },
    select: { id: true },
  });
  return city?.id ?? null;
}

export async function seedSocialNetwork(prisma: PrismaClient): Promise<void> {
  const usernames = new Set<string>();
  for (const account of DEMO_ACCOUNTS) {
    usernames.add(account.socialUsername);
    if (account.provider) usernames.add(account.provider.storeUsername);
  }

  for (const account of DEMO_ACCOUNTS) {
    if (!account.provider) continue;
    const user = await prisma.user.findUnique({
      where: { email: account.email },
      select: { id: true },
    });
    if (!user) continue;
    const provider = await prisma.providerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!provider) continue;

    const business = await prisma.business.upsert({
      where: { slug: account.provider.storeUsername },
      update: {
        name: account.provider.businessName,
        ownerUserId: user.id,
        providerProfileId: provider.id,
        verificationStatus: account.provider.verified ? 'VERIFIED' : 'UNVERIFIED',
        deletedAt: null,
        isActive: true,
      },
      create: {
        name: account.provider.businessName,
        slug: account.provider.storeUsername,
        ownerUserId: user.id,
        providerProfileId: provider.id,
        verificationStatus: account.provider.verified ? 'VERIFIED' : 'UNVERIFIED',
      },
    });

    const category = await prisma.serviceCategory.findUnique({
      where: { slug: account.provider.categorySlug },
      select: { id: true },
    });
    if (category) {
      await prisma.businessCategory.upsert({
        where: {
          businessId_categoryId: { businessId: business.id, categoryId: category.id },
        },
        update: {},
        create: { businessId: business.id, categoryId: category.id },
      });
    }

    const locationText = account.locationText ?? account.provider.cityName;
    const locationCityId = await findCityId(prisma, locationText);

    await prisma.socialProfile.upsert({
      where: { businessId: business.id },
      update: {
        username: account.provider.storeUsername,
        displayName: account.provider.businessName,
        bio: account.provider.about,
        locationText,
        locationCityId,
        isVerifiedDisplay: Boolean(account.provider.verified),
        deletedAt: null,
      },
      create: {
        kind: 'BUSINESS',
        businessId: business.id,
        username: account.provider.storeUsername,
        displayName: account.provider.businessName,
        bio: account.provider.about,
        locationText,
        locationCityId,
        isVerifiedDisplay: Boolean(account.provider.verified),
      },
    });
  }

  const profiles = await prisma.socialProfile.findMany({
    where: { username: { in: [...usernames] }, deletedAt: null },
    select: { id: true, username: true, userId: true },
  });
  const byUsername = new Map(profiles.map((profile) => [profile.username, profile.id]));
  const userIdByUsername = new Map(
    profiles.flatMap((profile) => (profile.userId ? [[profile.username, profile.userId]] : [])),
  );
  const profileIds = profiles.map((profile) => profile.id);

  await prisma.follow.deleteMany({
    where: {
      followerProfileId: { in: profileIds },
      followingProfileId: { in: profileIds },
    },
  });
  await prisma.categoryFollow.deleteMany({
    where: { profileId: { in: profileIds } },
  });
  await prisma.post.deleteMany({
    where: { authorProfileId: { in: profileIds } },
  });
  // Talep paylaşımları her tohumlamada yeniden bağlanır. Yalnızca tohum
  // kaynaklı (IMPORT) kayıtları siliyoruz; demo kullanıcıların uygulamadan
  // oluşturduğu gerçek talepler korunur.
  await prisma.commerceRequest.deleteMany({
    where: {
      buyerUserId: { in: [...userIdByUsername.values()] },
      source: RequestSource.IMPORT,
    },
  });

  for (const [follower, following] of FOLLOW_EDGES) {
    const followerId = byUsername.get(follower);
    const followingId = byUsername.get(following);
    if (!followerId || !followingId || followerId === followingId) continue;
    await prisma.follow.create({
      data: { followerProfileId: followerId, followingProfileId: followingId },
    });
  }

  for (const [username, slug] of CATEGORY_FOLLOWS) {
    const profileId = byUsername.get(username);
    const category = await prisma.serviceCategory.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!profileId || !category) continue;
    await prisma.categoryFollow.create({
      data: { profileId, categoryId: category.id },
    });
  }

  const createdPosts: Array<{ id: string; item: SeedPost }> = [];

  for (const item of [...FEED_POSTS, ...STORY_POSTS]) {
    const authorId = byUsername.get(item.author);
    if (!authorId) continue;

    const buyerUserId = userIdByUsername.get(item.author);
    let commerceRequestId: string | null = null;
    if (item.request && buyerUserId) {
      const created = await prisma.commerceRequest.create({
        data: {
          buyerUserId,
          requestType: item.request.requestType,
          title: item.request.title,
          description: item.body,
          quantity: item.request.quantity,
          unit: item.request.unit,
          budgetMinor: item.request.budgetMinor,
          deliveryAddressText: item.request.deliveryAddressText,
          status: RequestStatus.PUBLISHED,
          source: RequestSource.IMPORT,
          publishedAt: hoursAgo(item.hoursAgo),
          createdAt: hoursAgo(item.hoursAgo),
        },
        select: { id: true },
      });
      commerceRequestId = created.id;
    }

    const post = await prisma.post.create({
      data: {
        authorProfileId: authorId,
        type: item.type,
        body: item.body,
        visibility: PostVisibility.PUBLIC,
        createdAt: hoursAgo(item.hoursAgo),
        ...(commerceRequestId ? { commerceRequestId } : {}),
        ...(item.deal
          ? {
              promoLabel: item.deal.title,
              originalPriceMinor: item.deal.listPriceMinor,
              promoPriceMinor: item.deal.dealPriceMinor,
              promoCurrency: 'TRY',
              dealMetadata: {
                create: {
                  title: item.deal.title,
                  productName: item.deal.title,
                  listPriceMinor: item.deal.listPriceMinor,
                  dealPriceMinor: item.deal.dealPriceMinor,
                  discountPercent: item.deal.discountPercent,
                  currency: 'TRY',
                  unit: item.deal.unit,
                  stockQuantity: item.deal.stockQuantity,
                  locationText: item.deal.locationText,
                  shippingIncluded: true,
                  vatIncluded: true,
                },
              },
            }
          : {}),
      },
    });

    await prisma.feedItem.create({
      data: {
        kind: 'POST',
        postId: post.id,
        authorProfileId: authorId,
        createdAt: hoursAgo(item.hoursAgo),
      },
    });

    const tags = item.body.match(/#([\p{L}\p{N}_]{2,40})/gu) ?? [];
    const seen = new Set<string>();
    for (const raw of tags) {
      const display = raw.slice(1);
      const slug = display.toLocaleLowerCase('tr-TR');
      if (seen.has(slug)) continue;
      seen.add(slug);
      const hashtag = await prisma.hashtag.upsert({
        where: { slug },
        create: { slug, display: slug, postCount: 1 },
        update: { postCount: { increment: 1 }, display: slug },
      });
      await prisma.postHashtag.create({
        data: { postId: post.id, hashtagId: hashtag.id, createdAt: hoursAgo(item.hoursAgo) },
      });
    }

    if (item.image) {
      const file = await upsertPublicImage(prisma, item.image, `${item.author}-${post.id}.jpg`);
      await prisma.postMedia.create({
        data: { postId: post.id, fileId: file.id, sortOrder: 0 },
      });
    }

    createdPosts.push({ id: post.id, item });
  }

  let likeTotal = 0;
  let commentTotal = 0;

  for (const { id: postId, item } of createdPosts) {
    const likers = new Set(item.likedBy ?? []);
    for (const username of likers) {
      const profileId = byUsername.get(username);
      if (!profileId) continue;
      await prisma.postLike.create({
        data: {
          postId,
          profileId,
          createdAt: hoursAgo(Math.max(0.2, item.hoursAgo - 0.3)),
        },
      });
      likeTotal += 1;
    }

    for (const username of item.savedBy ?? []) {
      const profileId = byUsername.get(username);
      if (!profileId) continue;
      await prisma.savedPost.create({ data: { postId, profileId } });
    }

    for (const username of item.sharedBy ?? []) {
      const profileId = byUsername.get(username);
      if (!profileId) continue;
      await prisma.postShare.create({ data: { postId, profileId } });
    }

    for (const comment of item.comments ?? []) {
      const authorId = byUsername.get(comment.author);
      if (!authorId) continue;
      await prisma.postComment.create({
        data: {
          postId,
          authorProfileId: authorId,
          body: comment.body,
          createdAt: hoursAgo(Math.max(0.1, item.hoursAgo - 0.5)),
        },
      });
      commentTotal += 1;
    }

    await prisma.post.update({
      where: { id: postId },
      data: {
        likeCount: likers.size,
        commentCount: item.comments?.length ?? 0,
        saveCount: item.savedBy?.length ?? 0,
        shareCount: item.sharedBy?.length ?? 0,
      },
    });
  }

  const quoteSource = createdPosts.find(({ item }) => item.author === 'ahmetyapi');
  const quoteAuthor = byUsername.get('denizinsaat');
  if (quoteSource && quoteAuthor) {
    const quote = await prisma.post.create({
      data: {
        authorProfileId: quoteAuthor,
        type: PostType.QUOTE,
        body: 'Bu kampanyayı denedik çok memnun kaldık. Sevkiyat saat 09:00’da şantiyedeydi. #cimento #insaat',
        visibility: PostVisibility.PUBLIC,
        originalPostId: quoteSource.id,
        createdAt: hoursAgo(0.6),
      },
    });
    await prisma.feedItem.create({
      data: {
        kind: 'POST',
        postId: quote.id,
        authorProfileId: quoteAuthor,
        createdAt: hoursAgo(0.6),
      },
    });
    await prisma.post.update({
      where: { id: quoteSource.id },
      data: { repostCount: { increment: 1 } },
    });
  }

  for (const profile of profiles) {
    const photos = PROFILE_PHOTOS[profile.username];
    if (photos) {
      const avatar = await upsertPublicImage(prisma, photos.avatar, `${profile.username}-avatar.jpg`);
      const cover = photos.cover
        ? await upsertPublicImage(prisma, photos.cover, `${profile.username}-cover.jpg`)
        : null;
      await prisma.socialProfile.update({
        where: { id: profile.id },
        data: {
          avatarFileId: avatar.id,
          ...(cover ? { coverFileId: cover.id } : {}),
        },
      });
    }

    const [followers, following, posts] = await Promise.all([
      prisma.follow.count({ where: { followingProfileId: profile.id } }),
      prisma.follow.count({ where: { followerProfileId: profile.id } }),
      prisma.post.count({ where: { authorProfileId: profile.id, deletedAt: null } }),
    ]);
    await prisma.socialProfile.update({
      where: { id: profile.id },
      data: { followerCount: followers, followingCount: following, postCount: posts },
    });
  }

  console.log(
    `  Sosyal ağ: ${createdPosts.length} gönderi, ${FOLLOW_EDGES.length} takip, ${likeTotal} beğeni, ${commentTotal} yorum`,
  );
}

/** Mevcut demo verisini silmeden 24 saatlik hikâye rayını yeniler. */
export async function refreshStories(prisma: PrismaClient): Promise<number> {
  const created = await refreshDemoStories(prisma);
  console.log(`  Hikâyeler yenilendi: ${created} yeni demo hikâye`);
  return created;
}
