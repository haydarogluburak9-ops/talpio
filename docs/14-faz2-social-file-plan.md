# Faz 2 — Sosyal profil, takip, paylaşım, akış

Ücretsiz sosyal katman. Request ayrı domain kalır; akışta `FeedItem` projeksiyonu ile gösterilebilir.

## Kapsam (MVP)

- Kişisel + işletme sosyal profil
- Takip / takibi bırak
- Post oluştur (metin + görsel)
- Beğen, yorum (tek seviye yanıt opsiyonel), kaydet
- Ana akış (post + isteğe bağlı açık talep kartları)
- Web ince UI; Expo mobil sosyal ekranları yok
- Moderasyon iskeleti: ContentReport, UserBlock

## Prisma

`SocialProfile`, `Follow`, `Post`, `PostMedia`, `PostLike`, `PostComment`, `SavedPost`, `FeedItem`, `ContentReport`, `UserBlock`  
(+ opsiyonel Hashtag MVP dışı veya basit string tags Json)

## Backend

`modules/social/` — profiles, follows, posts, feed, reports  
Permissions: `social.profile.manage`, `social.post.create`, `social.interact`  
Notifications: `SOCIAL_FOLLOW`, `SOCIAL_LIKE`, `SOCIAL_COMMENT`

## Web

- Nav: `/akis` (Ana akış)
- `/u/[username]` profil
- Post oluştur modal/sayfa
- Beğen / kaydet / yorum

## Koruma

jobs/offers/orders/payments/requests bozulmaz. Premium ≠ güven rozeti.
