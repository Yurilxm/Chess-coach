# Chess Coach - Script de desenvolvimento
#
# Uso:
#   .\dev.ps1                 # Inicia backend + frontend + abre o navegador
#   .\dev.ps1 -NoBrowser      # Nao abre o navegador automaticamente
#
# O script cuida de:
#   1. Criar o venv se nao existir
#   2. Instalar requirements.txt quando o hash muda
#   3. Instalar node_modules se nao existir
#   4. Iniciar backend (uvicorn --reload) e frontend (vite) em janelas separadas
#   5. Abrir o navegador em http://localhost:5173

param(
    [switch]$NoBrowser
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Chess Coach - Iniciando ambiente dev" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$backendDir = "$PSScriptRoot\backend"
$frontendDir = "$PSScriptRoot\frontend"
$venvDir = "$backendDir\venv"
$venvActivate = "$venvDir\Scripts\Activate.ps1"

# ---------------------------------------------
# 1. Backend
# ---------------------------------------------
Write-Host "`n[1/2] Preparando backend..." -ForegroundColor Yellow

# Cria o venv se nao existir
if (-not (Test-Path $venvActivate)) {
    Write-Host "Criando ambiente virtual em backend\venv..." -ForegroundColor Yellow
    Push-Location $backendDir
    try {
        python -m venv venv
        if (-not (Test-Path $venvActivate)) {
            Write-Host "ERRO: falha ao criar o venv. Verifique se Python 3.12 esta no PATH." -ForegroundColor Red
            exit 1
        }
    } finally {
        Pop-Location
    }
}

# Ativa o venv nesta janela
& $venvActivate

# Instala requirements.txt se o hash mudou
$reqFile = "$backendDir\requirements.txt"
$marker = "$venvDir\.last_requirements_hash"
if (Test-Path $reqFile) {
    $currentHash = (Get-FileHash $reqFile -Algorithm MD5).Hash
    $lastHash = if (Test-Path $marker) { (Get-Content $marker -Raw).Trim() } else { "" }

    if ($currentHash -ne $lastHash) {
        Write-Host "Instalando dependencias do backend..." -ForegroundColor Yellow
        pip install -r $reqFile | Out-Null
        $currentHash | Set-Content $marker
    }
}

Write-Host "Backend: http://127.0.0.1:8000" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$backendDir'; .\venv\Scripts\Activate.ps1; cd '..'; uvicorn main:app --reload --app-dir backend`""

# ---------------------------------------------
# 2. Frontend
# ---------------------------------------------
Write-Host "[2/2] Preparando frontend..." -ForegroundColor Yellow

if (-not (Test-Path "$frontendDir\node_modules")) {
    Write-Host "Instalando dependencias do frontend (npm install)..." -ForegroundColor Yellow
    Push-Location $frontendDir
    try {
        npm install
    } finally {
        Pop-Location
    }
}

Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$frontendDir'; npm run dev`""

# ---------------------------------------------
# 3. Abre o navegador
# ---------------------------------------------
if (-not $NoBrowser) {
    Write-Host "`nAbrindo o navegador em http://localhost:5173 (aguarde o Vite subir)..." -ForegroundColor Cyan
    Start-Sleep -Seconds 6
    Start-Process "http://localhost:5173"
}

Write-Host "`nAmbiente iniciado. Backend + Frontend rodando." -ForegroundColor Green
Write-Host "Para parar, feche as duas janelas abertas." -ForegroundColor DarkGray
Write-Host "`nPressione qualquer tecla para fechar esta janela..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
