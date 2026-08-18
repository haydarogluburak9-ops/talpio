# Cursor deploy runner — SSH key: ~/.ssh/talpio_deploy
$ErrorActionPreference = "Stop"
$Host_ = "46.225.220.245"
$Key = Join-Path $env:USERPROFILE ".ssh\talpio_deploy"
$ScriptUrl = "https://raw.githubusercontent.com/haydarogluburak9-ops/talpio/main/scripts/vps-full-deploy.sh"

if (-not (Test-Path $Key)) {
  Write-Error "Deploy key yok: $Key"
}

ssh -i $Key -o StrictHostKeyChecking=accept-new "root@$Host_" @"
set -e
curl -fsSL '$ScriptUrl' | bash
"@
