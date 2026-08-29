#!/usr/bin/env bash
# Talpio VPS tam kurulum — root olarak çalıştırın:
#   curl -fsSL https://raw.githubusercontent.com/haydarogluburak9-ops/talpio/main/scripts/vps-full-deploy.sh | bash
set -euo pipefail

REPO_URL="${TALPIO_REPO_URL:-https://github.com/haydarogluburak9-ops/talpio.git}"
INSTALL_DIR="${TALPIO_INSTALL_DIR:-/root/talpio}"
BRANCH="${TALPIO_BRANCH:-main}"

log() { echo "==> $*"; }

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Bu script root olarak çalıştırılmalı (sudo bash ...)." >&2
  exit 1
fi

log "Paketler"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq git curl ca-certificates openssl python3

if [[ ! -f /swapfile ]]; then
  log "Swap (4GB VPS için build RAM)"
  fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

if ! command -v docker >/dev/null 2>&1; then
  log "Docker kurulumu"
  curl -fsSL https://get.docker.com | sh
  apt-get install -y -qq docker-compose-plugin ufw fail2ban
  ufw allow OpenSSH
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable
else
  log "Docker zaten kurulu"
fi

if [[ ! -d "$INSTALL_DIR/.git" ]]; then
  log "Repo klonlanıyor: $REPO_URL"
  git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$INSTALL_DIR"
else
  log "Repo güncelleniyor"
  git -C "$INSTALL_DIR" fetch origin "$BRANCH"
  git -C "$INSTALL_DIR" checkout "$BRANCH"
  git -C "$INSTALL_DIR" pull --ff-only origin "$BRANCH" || true
fi

cd "$INSTALL_DIR"

if [[ ! -f .env ]]; then
  log ".env oluşturuluyor (güvenli rastgele secret'lar)"
  python3 << 'PY'
import secrets
from pathlib import Path

src = Path(".env.production.example").read_text(encoding="utf-8")
replacements = {
    "CHANGE_ME_STRONG_DB_PASSWORD": secrets.token_urlsafe(32),
    "CHANGE_ME_ACCESS_SECRET_MIN_32_CHARS": secrets.token_urlsafe(48),
    "CHANGE_ME_REFRESH_SECRET_MIN_32_CHARS": secrets.token_urlsafe(48),
    "CHANGE_ME_MINIO_USER": "talpio_" + secrets.token_hex(4),
    "CHANGE_ME_MINIO_PASSWORD": secrets.token_urlsafe(40),
}
for old, new in replacements.items():
    if old not in src:
        raise SystemExit(f"Missing placeholder in .env.production.example: {old}")
    src = src.replace(old, new)
Path(".env").write_text(src, encoding="utf-8")
print("  .env yazıldı")
PY
else
  log ".env zaten var — dokunulmadı"
fi

log "Docker image build (15-30 dk sürebilir)"
docker compose --env-file .env -f docker-compose.prod.yml build

# `docker compose run` stdin'i tüketir; script `curl | bash` ile çalıştığında
# kalan satırları da yutar ve deploy migrate adımından sonra sessizce biter.
# Bu yüzden her `run` çağrısına `< /dev/null` verilir.
log "Veritabanı migrate (backend başlamadan önce)"
docker compose --env-file .env -f docker-compose.prod.yml run --rm --no-deps backend npx prisma migrate deploy < /dev/null

log "Stack başlatılıyor"
docker compose --env-file .env -f docker-compose.prod.yml up -d --force-recreate web admin backend worker

# Seed tek bir yerde durur: kurulum da, sonradan yapılan tazelemeler de aynı
# script'i çağırır. Kaynakları çalışma imajına bağlayan eski yöntem, imajın
# taşıdığı dosyalar her değiştiğinde sessizce bozuluyordu.
log "Seed"
SEED_DEMO_ACCOUNTS="${SEED_DEMO_ACCOUNTS:-false}" bash "$INSTALL_DIR/scripts/vps-seed.sh" < /dev/null

log "Sağlık kontrolü"
sleep 10
if curl -fsS "https://api.talpio.app/health/ready" >/dev/null 2>&1; then
  echo "OK: https://api.talpio.app/health/ready"
  curl -sS "https://api.talpio.app/health/ready" || true
else
  echo "Uyarı: HTTPS henüz hazır olmayabilir; container logları:"
  docker compose --env-file .env -f docker-compose.prod.yml ps
  docker compose --env-file .env -f docker-compose.prod.yml logs --tail=30 caddy backend || true
fi

log "Bitti — https://talpio.app | https://admin.talpio.app"
