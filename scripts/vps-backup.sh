#!/usr/bin/env bash
# Talpio veritabanı ve dosya yedeği.
#
#   bash scripts/vps-backup.sh              # tek seferlik yedek
#   bash scripts/vps-backup.sh --install    # her gece 03:00 için cron kurar
#
# Yedekler sunucunun kendi diskinde durur. Bu, hatalı migration ve yanlış
# silme gibi vakaların çoğunu kurtarır ama sunucunun kendisi kaybolursa işe
# yaramaz; kopyanın sunucu dışına alınması ayrıca yapılmalıdır (bkz. --install
# çıktısındaki not).
set -euo pipefail

INSTALL_DIR="${TALPIO_INSTALL_DIR:-/root/talpio}"
BACKUP_DIR="${TALPIO_BACKUP_DIR:-/root/backups}"
COMPOSE_FILE="docker-compose.prod.yml"
KEEP_DAYS="${TALPIO_BACKUP_KEEP_DAYS:-14}"

log() { echo "==> $*"; }

if [[ "${1:-}" == "--install" ]]; then
  # Cron PATH'i dar olduğu için tam yol yazılır; docker /usr/bin altında.
  line="0 3 * * * PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin bash $INSTALL_DIR/scripts/vps-backup.sh >> /root/backup.log 2>&1"
  current="$(crontab -l 2>/dev/null || true)"
  if grep -qF "vps-backup.sh" <<< "$current"; then
    echo "Cron görevi zaten kurulu."
  else
    printf '%s\n%s\n' "$current" "$line" | grep -v '^$' | crontab -
    echo "Cron kuruldu: her gece 03:00, log /root/backup.log"
  fi
  echo
  echo "NOT: Yedekler yalnızca bu sunucuda duruyor. Sunucu kaybolursa yedek de"
  echo "kaybolur. $BACKUP_DIR dizinini düzenli olarak sunucu dışına kopyalayın."
  exit 0
fi

cd "$INSTALL_DIR"
mkdir -p "$BACKUP_DIR"

set -a
# shellcheck disable=SC1091
. ./.env
set +a

: "${POSTGRES_USER:?.env içinde POSTGRES_USER tanımlı değil}"
: "${POSTGRES_DB:?.env içinde POSTGRES_DB tanımlı değil}"

STAMP="$(date +%Y%m%d-%H%M%S)"
DB_FILE="$BACKUP_DIR/talpio-db-$STAMP.sql.gz"

log "Veritabanı yedekleniyor"
# --clean --if-exists: geri yükleme mevcut şemanın üstüne yazabilsin.
docker compose --env-file .env -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists \
  < /dev/null | gzip > "$DB_FILE"

# Boş ya da kırpılmış yedek sessizce birikirse, ihtiyaç anında elde bir şey
# olmadığı fark edilir. Bu yüzden boyut burada doğrulanır.
SIZE="$(stat -c%s "$DB_FILE")"
if [[ "$SIZE" -lt 1024 ]]; then
  echo "Yedek şüpheli derecede küçük ($SIZE bayt); alınmadı sayılıyor." >&2
  rm -f "$DB_FILE"
  exit 1
fi
log "Veritabanı yedeği: $DB_FILE ($(numfmt --to=iec "$SIZE"))"

log "Yüklenen dosyalar yedekleniyor (MinIO)"
FILES_FILE="$BACKUP_DIR/talpio-files-$STAMP.tar.gz"
if docker run --rm \
  -v talpio-prod_minio-data:/data:ro \
  -v "$BACKUP_DIR:/backup" \
  alpine tar czf "/backup/$(basename "$FILES_FILE")" -C /data . 2>/dev/null; then
  log "Dosya yedeği: $FILES_FILE ($(numfmt --to=iec "$(stat -c%s "$FILES_FILE")"))"
else
  echo "Uyarı: MinIO birimi yedeklenemedi; birim adını kontrol edin." >&2
  echo "  docker volume ls | grep minio" >&2
fi

log "$KEEP_DAYS günden eski yedekler siliniyor"
find "$BACKUP_DIR" -name 'talpio-*' -type f -mtime "+$KEEP_DAYS" -print -delete

log "Bitti"
ls -lh "$BACKUP_DIR" | tail -5
