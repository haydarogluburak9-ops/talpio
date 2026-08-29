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

/** Uluslararası hesapların portreleri; adres uzunluğu tabloyu okunmaz kılmasın. */
const portrait = (id: string): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=256&h=256&q=80`;

const PORTRAIT = {
  lukas: portrait('photo-1560250097-0b93528c311a'),
  anna: portrait('photo-1573496359142-b8d87734a5a2'),
  camille: portrait('photo-1580489944761-15a19d654956'),
  julien: portrait('photo-1519085360753-af0119f7cbe7'),
  carmen: portrait('photo-1544005313-94ddf0286df2'),
  diego: portrait('photo-1506794778202-cad84cf45f1d'),
  omar: portrait('photo-1552058544-f2b08422138a'),
  layla: portrait('photo-1531123897727-8f129e1688ce'),
  youssef: portrait('photo-1607346256330-dee7af15f7c5'),
  oliver: portrait('photo-1517841905240-472988babdf9'),
  emma: portrait('photo-1534528741775-53994a69daeb'),
  grace: portrait('photo-1489424731084-a5d8b219a5bb'),
  wei: portrait('photo-1546525848-3ce03ca516f6'),
  priya: portrait('photo-1568602471122-7832951cc4c5'),
  kenji: portrait('photo-1580894732444-8ecded7900cd'),
  sofia: portrait('photo-1524504388940-b1c1722653e1'),
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

  // Uluslararası vitrin hesapları.
  lukasbrandt: { avatar: PORTRAIT.lukas },
  brandtindustrie: { avatar: PORTRAIT.lukas, cover: IMG.workshop },
  annavogel: { avatar: PORTRAIT.anna },
  camillelaurent: { avatar: PORTRAIT.camille },
  laurentemballage: { avatar: PORTRAIT.camille, cover: IMG.pallets },
  julienmoreau: { avatar: PORTRAIT.julien },
  carmenortega: { avatar: PORTRAIT.carmen },
  ortegaalimentacion: { avatar: PORTRAIT.carmen, cover: IMG.warehouse },
  diegoramirez: { avatar: PORTRAIT.diego },
  omaralfarsi: { avatar: PORTRAIT.omar },
  alfarsitrading: { avatar: PORTRAIT.omar, cover: IMG.barrels },
  laylahaddad: { avatar: PORTRAIT.layla },
  haddadtextiles: { avatar: PORTRAIT.layla, cover: IMG.warehouse },
  youssefmansour: { avatar: PORTRAIT.youssef },
  oliverbennett: { avatar: PORTRAIT.oliver },
  bennettelectronics: { avatar: PORTRAIT.oliver, cover: IMG.electric },
  emmaclarke: { avatar: PORTRAIT.emma },
  clarkemedical: { avatar: PORTRAIT.emma, cover: IMG.lights },
  gracesullivan: { avatar: PORTRAIT.grace },
  weilim: { avatar: PORTRAIT.wei },
  limlogistics: { avatar: PORTRAIT.wei, cover: IMG.truck },
  priyanair: { avatar: PORTRAIT.priya },
  nairtextiles: { avatar: PORTRAIT.priya, cover: IMG.pallets },
  kenjitanaka: { avatar: PORTRAIT.kenji },
  tanakaprecision: { avatar: PORTRAIT.kenji, cover: IMG.tools },
  sofiaalmeida: { avatar: PORTRAIT.sofia },
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

  // --- Uluslararası akış -------------------------------------------------
  // Saat damgaları bilerek Türkçe gönderilerin arasına serpiştirildi: hepsi
  // aynı bloğa yığılırsa akışın altında ayrı bir "yabancı bölüm" gibi durur.

  {
    author: 'brandtindustrie',
    hoursAgo: 1.5,
    type: PostType.CAMPAIGN,
    image: IMG.workshop,
    body: 'Wartungsaktion für Werkstätten: Ersatzteilsets mit Mengenrabatt, Lieferung innerhalb Deutschlands in 48 Stunden. #maschinen #ersatzteile #berlin',
    deal: {
      title: 'Ersatzteilset Wartung',
      listPriceMinor: 890000,
      dealPriceMinor: 749000,
      discountPercent: 16,
      unit: 'Set',
      stockQuantity: '25 Sets',
      locationText: 'Berlin',
    },
    comments: [
      { author: 'annavogel', body: 'Passt das auch für ältere Modelle?' },
      { author: 'kenjitanaka', body: 'Good pricing for this segment.' },
    ],
    likedBy: ['annavogel', 'julienmoreau', 'kenjitanaka', 'burak', 'oliverbennett'],
    savedBy: ['annavogel'],
  },
  {
    author: 'annavogel',
    hoursAgo: 2.5,
    type: PostType.REQUEST_SHARE,
    image: IMG.pallets,
    body: 'Suche Eichenholzplatten für eine Möbelserie, 200 Stück, Lieferung nach Berlin. Angebote willkommen. #holz #einkauf #berlin',
    request: {
      title: 'Eichenholzplatten, 200 Stück',
      requestType: RequestType.PRODUCT_SUPPLY,
      quantity: 200,
      unit: 'Stück',
      deliveryAddressText: 'Berlin',
    },
    comments: [{ author: 'lukasbrandt', body: 'Ich kann einen Lieferanten empfehlen.' }],
    likedBy: ['lukasbrandt', 'camillelaurent', 'muratsahin'],
  },
  {
    author: 'laurentemballage',
    hoursAgo: 3.5,
    type: PostType.DEAL,
    image: IMG.pallets,
    body: "Déstockage de palettes et cartons double cannelure. Tarif dégressif dès 500 unités, expédition dans toute l'Europe. #emballage #logistique #paris",
    deal: {
      title: 'Cartons double cannelure',
      listPriceMinor: 320000,
      dealPriceMinor: 268000,
      discountPercent: 16,
      unit: 'lot',
      stockQuantity: '60 lots',
      locationText: 'Paris',
    },
    comments: [
      { author: 'julienmoreau', body: 'Quel est le délai pour 2 000 unités ?' },
      { author: 'weilim', body: 'We ship to Southeast Asia if you need onward freight.' },
    ],
    likedBy: ['julienmoreau', 'carmenortega', 'weilim', 'gracesullivan'],
    savedBy: ['julienmoreau'],
    sharedBy: ['carmenortega'],
  },
  {
    author: 'julienmoreau',
    hoursAgo: 5,
    type: PostType.REQUEST_SHARE,
    image: IMG.warehouse,
    body: "Recherche 5 tonnes d'huile d'olive vierge extra pour la saison. Livraison à Paris, certificat d'origine exigé. #agroalimentaire #achat #paris",
    request: {
      title: "Huile d'olive vierge extra, 5 tonnes",
      requestType: RequestType.PRODUCT_SUPPLY,
      quantity: 5,
      unit: 'tonne',
      deliveryAddressText: 'Paris',
    },
    comments: [
      { author: 'carmenortega', body: 'Tenemos stock disponible, le envío la ficha técnica.' },
    ],
    likedBy: ['carmenortega', 'diegoramirez', 'sofiaalmeida'],
    savedBy: ['carmenortega'],
  },
  {
    author: 'ortegaalimentacion',
    hoursAgo: 6,
    type: PostType.CAMPAIGN,
    image: IMG.warehouse,
    body: 'Campaña de temporada: aceite de oliva, conservas y legumbres al por mayor. Precio por palet y envío a toda la península. #alimentacion #mayorista #madrid',
    deal: {
      title: 'Palet aceite de oliva',
      listPriceMinor: 1450000,
      dealPriceMinor: 1290000,
      discountPercent: 11,
      unit: 'palet',
      stockQuantity: '30 palets',
      locationText: 'Madrid',
    },
    comments: [
      { author: 'diegoramirez', body: '¿Hacéis envío a restaurantes en Madrid capital?' },
      { author: 'sofiaalmeida', body: 'Nos interesa para distribución en São Paulo.' },
    ],
    likedBy: ['diegoramirez', 'sofiaalmeida', 'julienmoreau', 'youssefmansour', 'burak'],
    savedBy: ['diegoramirez', 'sofiaalmeida'],
    sharedBy: ['julienmoreau'],
  },
  {
    author: 'alfarsitrading',
    hoursAgo: 7,
    type: PostType.DEAL,
    image: IMG.barrels,
    body: 'عرض خاص على زيوت المحركات والزيوت الهيدروليكية. أسعار الجملة للبراميل وشحن سريع إلى دول الخليج. #زيوت #جملة #دبي',
    deal: {
      title: 'برميل زيت هيدروليكي ISO 46',
      listPriceMinor: 1720000,
      dealPriceMinor: 1490000,
      discountPercent: 13,
      unit: 'برميل',
      stockQuantity: '40 برميل',
      locationText: 'Dubai',
    },
    comments: [
      { author: 'youssefmansour', body: 'هل الشحن متاح إلى القاهرة؟' },
      { author: 'elifyag', body: 'Aynı segmentte biz de çalışıyoruz, fiyat rekabetçi.' },
    ],
    likedBy: ['youssefmansour', 'laylahaddad', 'elifyag', 'burak', 'demiryag'],
    savedBy: ['youssefmansour'],
  },
  {
    author: 'bennettelectronics',
    hoursAgo: 8,
    type: PostType.NEW_PRODUCT,
    image: IMG.electric,
    body: 'New stock: connectors, passive components and PCBs. Cut-tape and full-reel quantities available from the London warehouse. #electronics #components #london',
    deal: {
      title: 'Connector assortment reel',
      listPriceMinor: 540000,
      dealPriceMinor: 469000,
      discountPercent: 13,
      unit: 'reel',
      stockQuantity: '80 reels',
      locationText: 'London',
    },
    comments: [
      { author: 'gracesullivan', body: 'Do you ship samples to New York?' },
      { author: 'kenjitanaka', body: 'Interested in the PCB line for prototypes.' },
    ],
    likedBy: ['gracesullivan', 'kenjitanaka', 'priyanair', 'weilim', 'muratsahin'],
    savedBy: ['gracesullivan'],
    sharedBy: ['kenjitanaka'],
  },
  {
    author: 'haddadtextiles',
    hoursAgo: 9,
    type: PostType.NEW_PRODUCT,
    image: IMG.warehouse,
    body: 'مجموعة أقمشة قطنية جديدة للموسم القادم. إنتاج بالجملة وتصدير إلى أوروبا والخليج. #أقمشة #ملابس #القاهرة',
    deal: {
      title: 'قماش قطني - لفة',
      listPriceMinor: 260000,
      dealPriceMinor: 224000,
      discountPercent: 14,
      unit: 'لفة',
      stockQuantity: '150 لفة',
      locationText: 'Cairo',
    },
    comments: [{ author: 'priyanair', body: 'We do similar private-label runs from Mumbai.' }],
    likedBy: ['priyanair', 'omaralfarsi', 'youssefmansour', 'carmenortega'],
    savedBy: ['priyanair'],
  },
  {
    author: 'gracesullivan',
    hoursAgo: 10,
    type: PostType.REQUEST_SHARE,
    image: IMG.tools,
    body: 'Sourcing CNC-machined aluminium housings for a hardware pilot run. 500 units, tolerance ±0.05 mm. Quotes welcome. #sourcing #cnc #newyork',
    request: {
      title: 'CNC aluminium housings, 500 units',
      requestType: RequestType.PRODUCT_SUPPLY,
      quantity: 500,
      unit: 'unit',
      deliveryAddressText: 'New York',
    },
    comments: [
      { author: 'kenjitanaka', body: 'We can hold that tolerance. Sending a quote.' },
      { author: 'lukasbrandt', body: 'Wir fertigen ähnliche Teile in Berlin.' },
    ],
    likedBy: ['kenjitanaka', 'lukasbrandt', 'oliverbennett', 'weilim'],
    savedBy: ['kenjitanaka'],
  },
  {
    author: 'limlogistics',
    hoursAgo: 12,
    type: PostType.BUSINESS_UPDATE,
    image: IMG.truck,
    body: 'Bonded warehouse capacity opened up in Singapore. Sea and air freight with customs clearance across Southeast Asia. #logistics #freight #singapore',
    comments: [{ author: 'priyanair', body: 'Useful for our Mumbai to Singapore lane.' }],
    likedBy: ['priyanair', 'kenjitanaka', 'gracesullivan', 'camillelaurent'],
    sharedBy: ['priyanair'],
  },
  {
    author: 'nairtextiles',
    hoursAgo: 14,
    type: PostType.CAMPAIGN,
    image: IMG.pallets,
    body: 'Private-label garment production, MOQ from 500 pieces. Cotton and blended fabrics in stock. #textile #manufacturing #mumbai',
    deal: {
      title: 'Cotton fabric roll',
      listPriceMinor: 210000,
      dealPriceMinor: 178000,
      discountPercent: 15,
      unit: 'roll',
      stockQuantity: '200 rolls',
      locationText: 'Mumbai',
    },
    comments: [{ author: 'laylahaddad', body: 'أسعار جيدة جدًا لهذه الكمية.' }],
    likedBy: ['laylahaddad', 'sofiaalmeida', 'gracesullivan', 'weilim', 'selinkoc'],
    savedBy: ['laylahaddad'],
  },
  {
    author: 'tanakaprecision',
    hoursAgo: 16,
    type: PostType.BUSINESS_UPDATE,
    image: IMG.tools,
    body: 'Five-axis line is now free for small-series work. Prototype to production, jigs and precision tooling. #machining #precision #tokyo',
    comments: [{ author: 'gracesullivan', body: 'Sent you the housing drawings.' }],
    likedBy: ['gracesullivan', 'oliverbennett', 'lukasbrandt', 'weilim'],
    savedBy: ['gracesullivan'],
  },
  {
    author: 'clarkemedical',
    hoursAgo: 18,
    type: PostType.DEAL,
    image: IMG.lights,
    body: 'Clinic restock: disposables and PPE, CE-marked with traceable batches. Volume pricing for practices and hospitals. #medical #supply #london',
    deal: {
      title: 'Clinic disposables pack',
      listPriceMinor: 380000,
      dealPriceMinor: 329000,
      discountPercent: 13,
      unit: 'pack',
      stockQuantity: '90 packs',
      locationText: 'London',
    },
    comments: [{ author: 'youssefmansour', body: 'هل تصدرون إلى مصر؟' }],
    likedBy: ['oliverbennett', 'gracesullivan', 'youssefmansour', 'annavogel'],
  },
  {
    author: 'diegoramirez',
    hoursAgo: 20,
    type: PostType.REQUEST_SHARE,
    image: IMG.warehouse,
    body: 'Buscamos proveedor de café en grano para 12 restaurantes en Madrid. 800 kg al mes, contrato anual. #cafe #hosteleria #madrid',
    request: {
      title: 'Café en grano, 800 kg/mes',
      requestType: RequestType.PRODUCT_SUPPLY,
      quantity: 800,
      unit: 'kg',
      deliveryAddressText: 'Madrid',
    },
    comments: [
      { author: 'carmenortega', body: 'Le paso nuestra oferta anual hoy mismo.' },
      { author: 'sofiaalmeida', body: 'Trabajamos con tostadores en Brasil si necesita origen.' },
    ],
    likedBy: ['carmenortega', 'sofiaalmeida', 'julienmoreau'],
    savedBy: ['carmenortega'],
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
  {
    author: 'brandtindustrie',
    hoursAgo: 0.5,
    type: PostType.BUSINESS_UPDATE,
    image: IMG.workshop,
    body: 'Frühschicht: Wartungssets sind kommissioniert und gehen heute raus. #maschinen #story',
  },
  {
    author: 'ortegaalimentacion',
    hoursAgo: 1.1,
    type: PostType.CAMPAIGN,
    image: IMG.warehouse,
    body: 'Cargando palets para los envíos de hoy. Quedan pocas unidades de la campaña. #alimentacion #story',
  },
  {
    author: 'alfarsitrading',
    hoursAgo: 1.6,
    type: PostType.NEW_PRODUCT,
    image: IMG.barrels,
    body: 'وصلت شحنة جديدة من البراميل. الطلبات تُشحن اليوم. #زيوت #story',
  },
  {
    author: 'bennettelectronics',
    hoursAgo: 2.2,
    type: PostType.NEW_PRODUCT,
    image: IMG.electric,
    body: 'Reels counted and boxed. Same-day dispatch from London. #electronics #story',
  },
  {
    author: 'laurentemballage',
    hoursAgo: 2.8,
    type: PostType.DEAL,
    image: IMG.pallets,
    body: "Chargement du jour : palettes prêtes pour l'expédition. #emballage #story",
  },
  {
    author: 'tanakaprecision',
    hoursAgo: 3.4,
    type: PostType.BUSINESS_UPDATE,
    image: IMG.tools,
    body: 'Setting up the five-axis for a new small-series run. #machining #story',
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

  // Uluslararası hesaplar. Yerli hesaplarla da bağlanırlar: iki küme ayrı
  // kalırsa akış tek dilde görünür ve ağ ikiye bölünmüş hissettirir.
  ['annavogel', 'brandtindustrie'],
  ['annavogel', 'laurentemballage'],
  ['annavogel', 'tanakaprecision'],
  ['julienmoreau', 'laurentemballage'],
  ['julienmoreau', 'ortegaalimentacion'],
  ['julienmoreau', 'haddadtextiles'],
  ['diegoramirez', 'ortegaalimentacion'],
  ['diegoramirez', 'limlogistics'],
  ['sofiaalmeida', 'ortegaalimentacion'],
  ['sofiaalmeida', 'nairtextiles'],
  ['youssefmansour', 'alfarsitrading'],
  ['youssefmansour', 'clarkemedical'],
  ['youssefmansour', 'haddadtextiles'],
  ['gracesullivan', 'bennettelectronics'],
  ['gracesullivan', 'tanakaprecision'],
  ['gracesullivan', 'limlogistics'],
  ['gracesullivan', 'brandtindustrie'],
  ['lukasbrandt', 'tanakaprecision'],
  ['lukasbrandt', 'bennettelectronics'],
  ['camillelaurent', 'limlogistics'],
  ['carmenortega', 'laurentemballage'],
  ['omaralfarsi', 'limlogistics'],
  ['laylahaddad', 'nairtextiles'],
  ['oliverbennett', 'tanakaprecision'],
  ['priyanair', 'limlogistics'],
  ['kenjitanaka', 'bennettelectronics'],
  ['weilim', 'nairtextiles'],
  ['emmaclarke', 'bennettelectronics'],

  // Diller arası köprü.
  ['burak', 'brandtindustrie'],
  ['burak', 'bennettelectronics'],
  ['selinkoc', 'alfarsitrading'],
  ['selinkoc', 'nairtextiles'],
  ['muratsahin', 'laurentemballage'],
  ['muratsahin', 'ortegaalimentacion'],
  ['gracesullivan', 'demiryag'],
  ['annavogel', 'ahmetyapi'],
  ['diegoramirez', 'demiryag'],
  ['omaralfarsi', 'demiryag'],
  ['kenjitanaka', 'metalplus'],
  ['priyanair', 'ahmetyapi'],
];

const CATEGORY_FOLLOWS: Array<[string, string]> = [
  ['burak', 'insaat-yapi'],
  ['burak', 'madeni-yag-kimya'],
  ['selinkoc', 'madeni-yag-kimya'],
  ['muratsahin', 'insaat-yapi'],

  ['annavogel', 'mobilya-ev'],
  ['annavogel', 'makine-ekipman'],
  ['julienmoreau', 'gida-icecek-toptan'],
  ['julienmoreau', 'ambalaj-lojistik'],
  ['diegoramirez', 'gida-icecek-toptan'],
  ['sofiaalmeida', 'gida-icecek-toptan'],
  ['youssefmansour', 'insaat-yapi'],
  ['youssefmansour', 'saglik-medikal'],
  ['gracesullivan', 'elektronik-komponent'],
  ['gracesullivan', 'makine-ekipman'],
  ['lukasbrandt', 'makine-ekipman'],
  ['camillelaurent', 'ambalaj-lojistik'],
  ['carmenortega', 'gida-icecek-toptan'],
  ['omaralfarsi', 'madeni-yag-kimya'],
  ['laylahaddad', 'giyim-moda'],
  ['oliverbennett', 'elektronik-komponent'],
  ['emmaclarke', 'saglik-medikal'],
  ['weilim', 'ambalaj-lojistik'],
  ['priyanair', 'giyim-moda'],
  ['kenjitanaka', 'makine-ekipman'],
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
        isDemo: true,
      },
      create: {
        name: account.provider.businessName,
        slug: account.provider.storeUsername,
        ownerUserId: user.id,
        providerProfileId: provider.id,
        verificationStatus: account.provider.verified ? 'VERIFIED' : 'UNVERIFIED',
        isDemo: true,
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
