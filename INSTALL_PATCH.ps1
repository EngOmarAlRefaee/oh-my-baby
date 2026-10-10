$ErrorActionPreference = 'Stop'
$required = @('AdminDashboardPage.jsx','TeamManagementPage.jsx','AdminPage.jsx')
$patchDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = (Get-Location).Path
$sourceRoot = Join-Path $projectRoot 'resources\js'
if (-not (Test-Path $sourceRoot)) {
  throw "ما لقيت resources\js. افتح PowerShell داخل مجلد website الذي يحتوي artisan وresources ثم أعد التشغيل."
}
$targets = @{}
foreach ($name in $required) {
  $matches = @(Get-ChildItem -Path $sourceRoot -Filter $name -File -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '[\\/](node_modules|vendor|public[\\/]build)[\\/]' })
  if ($matches.Count -ne 1) {
    throw "الملف $name: توقعت نسخة واحدة داخل resources\js ووجدت $($matches.Count). لم يتم نسخ أي ملف. افحص المسارات يدويًا لتجنب تعديل الملف الخطأ."
  }
  $targets[$name] = $matches[0].FullName
}
$backupRoot = Join-Path $projectRoot ('.omb-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backupRoot | Out-Null
foreach ($name in $required) {
  $target = $targets[$name]
  Copy-Item -LiteralPath $target -Destination (Join-Path $backupRoot $name)
}
foreach ($name in $required) {
  Copy-Item -LiteralPath (Join-Path $patchDir $name) -Destination $targets[$name] -Force
  Write-Host "Updated: $($targets[$name])"
}
Write-Host "Backup saved to: $backupRoot"
Write-Host "Next: npm run build"
