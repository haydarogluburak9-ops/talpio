# Tohum verisini sunucuda yeniden yükler — SSH anahtarı: ~/.ssh/talpio_deploy
#
#   ./scripts/run-remote-seed.ps1              # yalnızca katalog verisi
#   ./scripts/run-remote-seed.ps1 -Demo        # vitrin hesaplarını da yükler
#
# Uzun sürdüğü için arka planda çalışır ve çıktıyı /root/seed.log dosyasına
# yazar; SSH bağlantısı koparsa tohumlama yarıda kalmaz.
param(
  [switch]$Demo,
  [switch]$Follow
)

$ErrorActionPreference = "Stop"
$Host_ = "46.225.220.245"
$Key = Join-Path $env:USERPROFILE ".ssh\talpio_deploy"
$LogPath = "/root/seed.log"

if (-not (Test-Path $Key)) {
  Write-Error "Deploy key yok: $Key"
}

$seedDemo = if ($Demo) { "true" } else { "false" }

# Betik sunucudaki checkout'tan çalışır; önce depo güncellenir ki yerelde
# yapılan tohum düzeltmeleri uygulansın.
$remote = @"
set -euo pipefail
cd /root/talpio
git fetch origin main
git reset --hard origin/main
nohup env SEED_DEMO_ACCOUNTS=$seedDemo bash scripts/vps-seed.sh > $LogPath 2>&1 &
echo "baslatildi pid=`$!"
"@

# Satır sonları LF'e çevrilir; CRLF gönderilirse uzak bash `\r` hatası verir.
$remote = $remote -replace "`r", ""
$remote | ssh -i $Key -o StrictHostKeyChecking=accept-new "root@$Host_" "bash -s"

Write-Host ""
Write-Host "Tohumlama arka planda calisiyor. Ilerleme:"
Write-Host "  ssh -i `"$Key`" root@$Host_ `"tail -f $LogPath`""

if (-not $Follow) { return }

while ($true) {
  Start-Sleep -Seconds 20
  $state = (ssh -i $Key "root@$Host_" "if grep -q '==> Bitti' $LogPath; then echo BITTI; elif grep -qiE 'error|Seed ba' $LogPath; then echo HATA; else tail -n 1 $LogPath; fi" | Out-String).Trim()
  Write-Host $state
  if ($state -match "BITTI|HATA") { break }
}
