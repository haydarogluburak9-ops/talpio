#!/usr/bin/env bash
# Talpio VPS ilk kurulum (Ubuntu 24.04). root veya sudo ile çalıştırın.
set -euo pipefail

echo "==> Sistem güncellemesi"
apt-get update && apt-get upgrade -y

echo "==> Docker kurulumu"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
apt-get install -y docker-compose-plugin git ufw fail2ban

echo "==> Firewall"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> Deploy kullanıcısı (talpio)"
if ! id talpio >/dev/null 2>&1; then
  useradd -m -s /bin/bash talpio
  usermod -aG docker talpio
fi

echo "==> Bitti. Sonraki adımlar:"
echo "  su - talpio"
echo "  git clone <repo-url> talpio && cd talpio"
echo "  cp .env.production.example .env && nano .env"
echo "  docker compose -f docker-compose.prod.yml up -d --build"
echo "  docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy"
echo "  docker compose -f docker-compose.prod.yml exec backend npm run db:seed"
