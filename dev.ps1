# Chess Coach - Script de desenvolvimento
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Chess Coach - Iniciando ambiente dev" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Backend
Write-Host "`n[1/2] Iniciando backend..." -ForegroundColor Yellow

# Ativa venv e instala dependências se necessário
$backendDir = "$PSScriptRoot\backend"
$venvActivate = "$backendDir\venv\Scripts\Activate.ps1"

if (Test-Path $venvActivate) {
    & $venvActivate

    # Verifica se python-dotenv está instalado
    $dotenvInstalled = pip show python-dotenv 2>$null
    if (-not $dotenvInstalled) {
        Write-Host "Instalando python-dotenv..." -ForegroundColor Yellow
        pip install python-dotenv | Out-Null
    }

    Write-Host "Backend: http://127.0.0.1:8000" -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$backendDir'; .\venv\Scripts\Activate.ps1; cd '..'; uvicorn main:app --reload --app-dir backend`""
} else {
    Write-Host "ERRO: Ambiente virtual não encontrado em $venvActivate" -ForegroundColor Red
}

# 2. Frontend
Write-Host "[2/2] Iniciando frontend..." -ForegroundColor Yellow

$frontendDir = "$PSScriptRoot\frontend"

if (Test-Path "$frontendDir\node_modules") {
    Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$frontendDir'; npm run dev`""
} else {
    Write-Host "Instalando dependências do frontend..." -ForegroundColor Yellow
    Set-Location $frontendDir
    npm install
    Set-Location $PSScriptRoot
    Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$frontendDir'; npm run dev`""
}

Write-Host "`n✅ Ambiente iniciado! Backend + Frontend rodando." -ForegroundColor Green
Write-Host "Pressione qualquer tecla para fechar esta janela..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")