# Faz 2 — Sosyal MVP teslimatı

Ücretsiz sosyal katman: profil, takip, gönderi, etkileşim, akış, moderasyon iskeleti.  
Request / jobs / offers / orders / payments / messages / reviews / billing bozulmadan bırakıldı. Premium ≠ güven rozeti (`isVerifiedDisplay`).

## Mimari

```
Web (/akis, /u/:username)
  → api-client social.*
  → Backend SocialModule
      ProfilesService / FollowsService / PostsService
      InteractionsService / FeedService / ModerationService
  → Prisma: social_profiles, follows, posts, feed_items, …
```

- **Request ≠ Post:** Commerce talep otomatik akışa yazılmaz (`RequestVisibility` eşleştirme içindir). İsteğe bağlı `REQUEST_SHARE` post tipi manuel bağlanabilir.
- **Feed:** takip edilenler ∪ son 30 gün public postlar; engellenenler dışlanır; sıralama `createdAt desc`. ML / kişiselleştirme yok.
- **Mobil:** Expo sosyal ekranı yok; web responsive yeterli.

## Migration

`20260810052116_teklifpilot_faz2_social`

## Dosya listesi (özet)

| Katman | Dosyalar |
|--------|----------|
| Prisma | `apps/backend/prisma/schema.prisma`, migration |
| Types | `packages/types/src/enums/social.ts`, `models/social.ts`, Permission / NotificationType / FilePurpose |
| Validation | `packages/validation/src/social.ts` |
| Config | `API_ROUTES.social`, `queryKeys.social`, deep-links, `SOCIAL` limits |
| Business-logic | `ROLE_PERMISSIONS` + `PLATFORM_ROLE_PERMISSIONS` sosyal izinler |
| Backend | `apps/backend/src/modules/social/*` |
| Api-client | `packages/api-client/src/resources/social.ts` |
| Localization | `nav.feed`, `social.*`, `notification.SOCIAL_*` (tr/en) |
| Web | `/akis`, `/u/[username]`, `features/social/*`, nav |
| Seed | demo `musteri` / `satıcı` SocialProfile (gönderi yok) |
| Docs | bu dosya; `docs/12` Faz 2 → UYGULANDI |

## API

| Method | Path | Permission |
|--------|------|------------|
| GET/PATCH | `/social/profiles/me` | `social.profile.manage` |
| GET | `/social/profiles/:username` | Public |
| GET | `/social/profiles/:username/posts` | Public |
| POST/DELETE | `/social/profiles/:username/follow` | `social.interact` |
| GET | `/social/profiles/:username/followers\|following` | Public |
| POST | `/social/posts` | `social.post.create` |
| GET/DELETE | `/social/posts/:id` | Public / own |
| POST/DELETE | `/social/posts/:id/like` | `social.interact` |
| POST/GET | `/social/posts/:id/comments` | interact / Public |
| POST/DELETE | `/social/posts/:id/save` | `social.interact` |
| GET | `/social/feed` | interact veya post.create |
| POST | `/social/reports` | `social.report` |
| POST/DELETE | `/social/blocks/:userId` | `social.interact` |

Bildirimler: `SOCIAL_FOLLOW`, `SOCIAL_LIKE`, `SOCIAL_COMMENT` → IN_APP + PUSH.

FilePurpose: `POST_MEDIA`, `COVER` (IMAGE kuralları).

## Web rotaları

- `/akis` — ana akış + composer (girişli)
- `/u/[username]` — profil + gönderiler + takip

## Testler

| Suite | Sonuç |
|-------|--------|
| `src/modules/social` | **9 passed** (4 suites) — follow counts/self/block, post+feed, like idempotent/unlike, delete ownership, feed block filter |
| `offers.service.spec` + `requests.service.spec` | **27 passed** (legacy smoke yeşil) |

## Bilinen borç

- Hashtag motoru yok
- Kişiselleştirilmiş / ML feed yok
- Mobil (Expo) sosyal ekran yok
- Yorum yanıt derinliği 1 seviye
- Keşfet / discovery Faz 4
- Public profil okumada `isFollowing` JWT’siz; web istemcisi following listesi ile tamamlar
- Feed cursor basit `createdAt` (eşit timestamp’te titreme mümkün)
- CommerceRequest → FeedItem otomatik projeksiyon yok (bilinçli güvenlik)
