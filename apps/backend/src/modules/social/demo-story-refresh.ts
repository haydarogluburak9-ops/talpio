import { PostType, PostVisibility } from '@/generated/prisma/enums';
import type { PrismaClient } from '@/generated/prisma/client';

/** Lansman öncesi demo hikâye içeriği. Lansman sonrası DEMO_STORY_REFRESH_ENABLED=false yapın. */
const DEMO_STORY_IMAGES = {
  site: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1400&q=80',
  cement: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1400&q=80',
  electric: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1400&q=80',
  workshop: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1400&q=80',
  steel: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1400&q=80',
  windows: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
  truck: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1400&q=80',
  barrels: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&w=1400&q=80',
} as const;

type DemoStorySeed = {
  author: string;
  hoursAgo: number;
  type: PostType;
  image: string;
  body: string;
};

const DEMO_STORY_POSTS: DemoStorySeed[] = [
  {
    author: 'ahmetyapi',
    hoursAgo: 0.2,
    type: PostType.BUSINESS_UPDATE,
    image: DEMO_STORY_IMAGES.site,
    body: 'Sabah vardiyası: kalıp sökümü bitti, döküm öğleden sonra. #insaat #hikaye',
  },
  {
    author: 'demiryag',
    hoursAgo: 0.7,
    type: PostType.NEW_PRODUCT,
    image: DEMO_STORY_IMAGES.barrels,
    body: 'Yeni varil partisi rampa indi. ISO 46 stok yenilendi. #madeniyağ #hikaye',
  },
  {
    author: 'xyzelektrik',
    hoursAgo: 1.4,
    type: PostType.SERVICE_PROMOTION,
    image: DEMO_STORY_IMAGES.electric,
    body: 'Pano testleri canlı. Proje keşfi için showroom açık. #elektrik #hikaye',
  },
  {
    author: 'ganteppvc',
    hoursAgo: 2.1,
    type: PostType.BUSINESS_UPDATE,
    image: DEMO_STORY_IMAGES.windows,
    body: 'Antrasit doğrama hattı bugün dolu. Yeni renk kartelası vitrinde. #pvc #hikaye',
  },
  {
    author: 'anadolucimento',
    hoursAgo: 3.2,
    type: PostType.LIMITED_STOCK,
    image: DEMO_STORY_IMAGES.cement,
    body: 'Öğleden sonra 3 kamyon çıkış. Şantiye slotu kalanlar yazsın. #cimento #hikaye',
  },
  {
    author: 'metalplus',
    hoursAgo: 4.5,
    type: PostType.BULK_PRICE,
    image: DEMO_STORY_IMAGES.steel,
    body: '14’lük demir kesim hattı çalışıyor. Tonajlı alıma yer var. #metal #hikaye',
  },
  {
    author: 'denizinsaat',
    hoursAgo: 5.5,
    type: PostType.BUSINESS_UPDATE,
    image: DEMO_STORY_IMAGES.truck,
    body: 'Filo yola çıktı: İstanbul içi aynı gün teslim. #lojistik #hikaye',
  },
  {
    author: 'elifyag',
    hoursAgo: 6.5,
    type: PostType.NEW_PRODUCT,
    image: DEMO_STORY_IMAGES.workshop,
    body: 'Numune setleri paketlendi. Atölyeler bugün alsın. #madeniyağ #hikaye',
  },
];

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function upsertPublicImage(prisma: PrismaClient, url: string, name: string) {
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

/** Mevcut demo hikâyeleri kapatır, son 24 saat içinde görünecek yenilerini ekler. */
export async function refreshDemoStories(prisma: PrismaClient): Promise<number> {
  const expired = await prisma.post.findMany({
    where: { body: { contains: '#hikaye' }, deletedAt: null },
    select: { id: true },
  });

  if (expired.length) {
    const ids = expired.map((row) => row.id);
    await prisma.post.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });
    await prisma.feedItem.deleteMany({ where: { postId: { in: ids } } });
  }

  const usernames = [...new Set(DEMO_STORY_POSTS.map((item) => item.author))];
  const profiles = await prisma.socialProfile.findMany({
    where: { username: { in: usernames }, deletedAt: null },
    select: { id: true, username: true },
  });
  const byUsername = new Map(profiles.map((profile) => [profile.username, profile.id]));
  let created = 0;

  for (const item of DEMO_STORY_POSTS) {
    const authorId = byUsername.get(item.author);
    if (!authorId) continue;

    const post = await prisma.post.create({
      data: {
        authorProfileId: authorId,
        type: item.type,
        body: item.body,
        visibility: PostVisibility.PUBLIC,
        createdAt: hoursAgo(item.hoursAgo),
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

    const file = await upsertPublicImage(prisma, item.image, `${item.author}-story-${post.id}.jpg`);
    await prisma.postMedia.create({
      data: { postId: post.id, fileId: file.id, sortOrder: 0 },
    });

    await prisma.socialProfile.update({
      where: { id: authorId },
      data: { postCount: { increment: 1 } },
    });

    created += 1;
  }

  return created;
}
