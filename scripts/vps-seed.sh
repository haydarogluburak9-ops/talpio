#!/usr/bin/env bash
# Talpio tohum verisini sunucuda yeniden yükler.
#
#   bash scripts/vps-seed.sh
#
# Neden ayrı bir script: `vps-full-deploy.sh` paket kurulumundan güvenlik
# duvarına kadar her şeyi yapıyor ve tüm imajları yeniden derliyor. Yalnızca
# katalog ya da vitrin verisini tazelemek için onu çalıştırmak yirmi dakika ve
# gereksiz risk demek.
#
# Çalışma imajı seed'i çalıştıramaz: `tsx` bir geliştirme bağımlılığı ve imaja
# yalnızca `dist` kopyalanıyor, TypeScript kaynakları yok. Bu yüzden seed
# Dockerfile'ın `build` aşamasından çalıştırılır; orada kaynaklar, üretilmiş
# Prisma istemcisi ve tsx zaten hazırdır.
set -euo pipefail

INSTALL_DIR="${TALPIO_INSTALL_DIR:-/root/talpio}"
COMPOSE_FILE="docker-compose.prod.yml"
SEED_IMAGE="talpio-seed"

log() { echo "==> $*"; }

cd "$INSTALL_DIR"

if [[ ! -f .env ]]; then
  echo ".env bulunamadı: $INSTALL_DIR/.env" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
. ./.env
set +a

: "${POSTGRES_USER:?.env içinde POSTGRES_USER tanımlı değil}"
: "${POSTGRES_PASSWORD:?.env içinde POSTGRES_PASSWORD tanımlı değil}"
: "${POSTGRES_DB:?.env içinde POSTGRES_DB tanımlı değil}"

# Vitrin hesapları yalnızca açıkça istendiğinde oluşturulur; seed'in kendisi de
# NODE_ENV=production ise bunu reddeder.
SEED_DEMO="${SEED_DEMO_ACCOUNTS:-false}"

# Ağ adı compose proje adına göre değişir. Çalışan postgres konteynerinden
# okumak, adı script'e gömmekten daha dayanıklı.
NETWORK="$(docker inspect -f '{{range $name, $_ := .NetworkSettings.Networks}}{{$name}}{{end}}' talpio-postgres 2>/dev/null || true)"
if [[ -z "$NETWORK" ]]; then
  echo "Postgres konteyneri çalışmıyor; önce stack'i başlatın." >&2
  echo "  docker compose --env-file .env -f $COMPOSE_FILE up -d" >&2
  exit 1
fi

log "Seed imajı derleniyor (build aşaması)"
docker build -f docker/backend.Dockerfile --target build -t "$SEED_IMAGE" .

log "Migration'lar uygulanıyor"
docker compose --env-file .env -f "$COMPOSE_FILE" run --rm --no-deps \
  backend npx prisma migrate deploy < /dev/null

log "Tohum verisi yükleniyor (demo hesapları: $SEED_DEMO)"
docker run --rm \
  --network "$NETWORK" \
  -e DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public" \
  -e NODE_ENV="${NODE_ENV:-production}" \
  -e SEED_DEMO_ACCOUNTS="$SEED_DEMO" \
  -e DEMO_PASSWORD="${DEMO_PASSWORD:-}" \
  -e ADMIN_PASSWORD="${ADMIN_PASSWORD:-}" \
  -w /app/apps/backend \
  "$SEED_IMAGE" npx prisma db seed

log "Servisler yeniden başlatılıyor"
docker compose --env-file .env -f "$COMPOSE_FILE" up -d

log "Bitti"
