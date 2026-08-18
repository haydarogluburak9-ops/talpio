# Yasal yer tutucular — production lansman engeli

Ürün özet sayfaları ve kayıt onayı vardır. Avukat imzalı metin yoktur.

| Metin | Sayfa | Durum |
| --- | --- | --- |
| Privacy Policy | `/yasal/gizlilik` | Ürün özeti + disclaimer |
| Terms | `/yasal/kullanim-kosullari` | Ürün özeti + disclaimer |
| GDPR / KVKK | `/yasal/kvkk` | Ürün özeti + disclaimer |
| Commercial communications consent | kayıt formu `acceptedMarketing` | İsteğe bağlı kutu; `users.marketing_consent_at` saklanır |

Lansman öncesi avukat onayı gerekir. Bu belgeler olmadan production açılmaz.
