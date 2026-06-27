param(
    [string]$MysqlRootPassword,
    [string]$GeminiApiKey
)

$ErrorActionPreference = "Stop"
$mysqlExe = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Split-Path -Parent $scriptDir
$envFile = Join-Path $backendDir ".env"
$sqlFile = Join-Path $scriptDir "setup-mysql.sql"

Write-Host "`n=== TaskFlow Local Setup ===" -ForegroundColor Cyan

if (-not (Test-Path $mysqlExe)) {
    Write-Host "MySQL not found at: $mysqlExe" -ForegroundColor Red
    Write-Host "Install MySQL 8 or update the path in this script."
    exit 1
}

if (-not $MysqlRootPassword) {
    $secure = Read-Host "Enter MySQL root password" -AsSecureString
    $MysqlRootPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    )
}

Write-Host "Setting up database and tables..." -ForegroundColor Yellow
Get-Content $sqlFile -Raw | & $mysqlExe -u root "-p$MysqlRootPassword"

if ($LASTEXITCODE -ne 0) {
    Write-Host "MySQL setup failed. Check your root password." -ForegroundColor Red
    exit 1
}

Write-Host "Database setup complete." -ForegroundColor Green

if (-not $GeminiApiKey) {
    Write-Host "`nGemini API key (optional — press Enter to skip):" -ForegroundColor Yellow
    Write-Host "Get a free key at: https://aistudio.google.com/apikey"
    $GeminiApiKey = Read-Host "GEMINI_API_KEY"
}

$envContent = @"
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=taskflow
DB_PASSWORD=taskflow_pass
DB_NAME=taskflow

JWT_SECRET=dev_jwt_secret_taskflow_local
JWT_EXPIRES_IN=7d

GEMINI_API_KEY=$GeminiApiKey

CLIENT_URL=http://localhost:5173
"@

Set-Content -Path $envFile -Value $envContent -Encoding UTF8
Write-Host "Updated backend/.env" -ForegroundColor Green

if ($GeminiApiKey) {
    Write-Host "Gemini API key configured — AI features enabled." -ForegroundColor Green
} else {
    Write-Host "No Gemini key set — AI will use fallback responses." -ForegroundColor Yellow
}

Write-Host "`nDone! Start the app with:" -ForegroundColor Cyan
Write-Host "  cd backend && npm run dev"
Write-Host "  cd frontend && npm run dev"
Write-Host ""
