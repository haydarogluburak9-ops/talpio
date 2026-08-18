#!/usr/bin/env bash
# Manuel / cron PostgreSQL yedeği. Sahte "yedek alındı" iddiası taşımaz;
# pg_dump çıkışı dosyaya yazılır. S3 kopyası ayrı bir adımda yapılır.
set -euo pipefail

STAMP=$(date -u +%Y%m%dT%H%M%SZ)
OUT_DIR=${BACKUP_DIR:-./backups}
mkdir -p "$OUT_DIR"
FILE="$OUT_DIR/talpio-$STAMP.sql.gz"

if [[ -n "${DATABASE_URL:-}" ]]; then
  pg_dump --no-owner --format=plain "$DATABASE_URL" | gzip > "$FILE"
else
  docker compose exec -T postgres pg_dump -U "${POSTGRES_USER:-talpio}" "${POSTGRES_DB:-talpio}" | gzip > "$FILE"
fi

echo "$FILE"
