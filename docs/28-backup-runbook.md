# Yedekleme ve geri yükleme

Production Postgres yedeği uygulama sürecinin parçası değildir; operasyon runbook'udur.
Bu dosya sahte “yedek alındı” iddiası taşımaz.

## Ne yedeklenir

- PostgreSQL (`talpio` veritabanı): asıl kaynak
- MinIO / S3 kova: yüklenen dosyalar
- Redis: önbellek ve kuyruk; kayıp tolere edilir, outbox DB'dedir

## Postgres (örnek)

```bash
pg_dump "$DATABASE_URL" --format=custom --file="talpio-$(date -u +%Y%m%dT%H%M%SZ).dump"
```

Geri yükleme:

```bash
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" talpio-YYYYMMDD.dump
```

## Nesne deposu

MinIO/`mc mirror` veya S3 sürümleme. Kovayı silmeden önce dump doğrulanır.

## Sıklık

- Günlük dump + 7 günlük saklama (operasyon kararı)
- Restore denemesi aylık, staging üzerinde

## Uygulama notu

`npm run db:migrate:deploy` yedekten sonra şema sürümünü hizalar.
Worker ve API, restore sırasında durdurulur.
