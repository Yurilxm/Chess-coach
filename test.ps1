# test.ps1 - Roda backend (pytest) e frontend (vitest) em sequencia.
# Uso: .\test.ps1   (da raiz do projeto)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Chess Coach - Testes (backend + frontend)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$root = $PSScriptRoot

# 1. Backend (pytest via venv)
Write-Host "`n[1/2] Backend (pytest)" -ForegroundColor Yellow
& "$root\backend\venv\Scripts\python.exe" -m pytest
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nBackend: FALHOU" -ForegroundColor Red
    exit 1
}
Write-Host "Backend: OK" -ForegroundColor Green

# 2. Frontend (vitest)
Write-Host "`n[2/2] Frontend (vitest)" -ForegroundColor Yellow
Push-Location "$root\frontend"
try {
    npm test
    $npmExit = $LASTEXITCODE
} finally {
    Pop-Location
}
if ($npmExit -ne 0) {
    Write-Host "`nFrontend: FALHOU" -ForegroundColor Red
    exit 1
}
Write-Host "Frontend: OK" -ForegroundColor Green

Write-Host "`nTodos os testes passaram." -ForegroundColor Green
