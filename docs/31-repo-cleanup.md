# Repo temizlik raporu — 2026-08-17

**Otomatik rename yapılmadı.**

## usta-pilot kalıntıları

| Tür | Örnek | Risk |
| --- | --- | --- |
| Klasör / git remote | `D:\Projects\usta-pilot` | Düşük — ürün adı Talpio |
| Eski paket adı | Dokümanlarda `@ustapilot/*` tarihçesi | Düşük — kod `@talpio/*` |
| Flutter arşiv | Silindi (2026-08-26) — git geçmişinde duruyor | Yok |
| Yorum / docs | Türkçe “usta” anlatımı “satıcı” ile değiştirildi (2026-08-26) | Yok |

## Eski rota / env

| Öğe | Durum |
| --- | --- |
| `/taleplerim` vs `/tedarik` | İki domain; isimler bu fazda netleşti |
| `JWT_REFRESH_SECRET` | Env zorunlu; refresh JWT değil (opak token) — kullanılmıyor |
| `NEXT_PUBLIC_FEATURE_*` | Web + mobil; backend zorlamaz |
| `EXPO_PUBLIC_FEATURE_*` | Bu fazda eklendi |

## Yapılmaması gereken

- Toplu `usta-pilot` → `talpio` klasör rename’i (elle yapılacak)
- `CRAFTSMANSHIP_CERTIFICATE` enum adını değiştirmek — yalnızca Türkçe etiket düzeltildi
- JobRequest tablosunu CommerceRequest ile birleştirmek
- Sosyal tabloların Request/Offer/Order’a yazması
