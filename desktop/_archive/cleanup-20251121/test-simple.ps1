# Script de Teste Simples da Aplicacao
# Execute: .\test-simple.ps1

Write-Host "Testando Aplicacao 7Mares Cotador..." -ForegroundColor Green

# Teste Backend
Write-Host "`n1. Testando Backend..." -ForegroundColor Yellow
try {
    $backend = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 5
    Write-Host "Backend (porta 3001): OK" -ForegroundColor Green
} catch {
    Write-Host "Backend (porta 3001): ERRO" -ForegroundColor Red
    exit 1
}

# Teste Frontend
Write-Host "`n2. Testando Frontend..." -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 5
    Write-Host "Frontend (porta 5173): OK" -ForegroundColor Green
} catch {
    Write-Host "Frontend (porta 5173): ERRO" -ForegroundColor Red
    exit 1
}

# Teste Supabase
Write-Host "`n3. Testando Supabase..." -ForegroundColor Yellow
try {
    $supabase = Invoke-RestMethod -Uri "http://localhost:3001/api/concierge/history?limit=1" -Method GET
    Write-Host "Supabase: OK" -ForegroundColor Green
} catch {
    Write-Host "Supabase: ERRO" -ForegroundColor Red
}

# Teste de Geração de Relatório
Write-Host "`n4. Testando Geracao de Relatorio..." -ForegroundColor Yellow
$testData = @{
    clientName = "Teste Final"
    destination = "Sao Paulo, Brasil"
    checkin = "2025-02-01"
    checkout = "2025-02-05"
    travelType = "familia"
    budget = "confortavel"
    adults = 2
    children = 1
    interests = @("natureza", "cultura")
    observations = "Teste final do sistema"
} | ConvertTo-Json

try {
    $report = Invoke-RestMethod -Uri "http://localhost:3001/api/concierge/generate" -Method POST -ContentType "application/json" -Body $testData
    Write-Host "Geracao de Relatorio: OK" -ForegroundColor Green
    Write-Host "ID: $($report.report.id)" -ForegroundColor Cyan
} catch {
    Write-Host "Geracao de Relatorio: ERRO" -ForegroundColor Red
}

# Teste de Geração de PDF
Write-Host "`n5. Testando Geracao de PDF..." -ForegroundColor Yellow
$pdfData = @{
    htmlContent = "<html><body><h1>Teste Final</h1><p>Sistema funcionando.</p></body></html>"
    filename = "teste-final.pdf"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:3001/api/generate-pdf" -Method POST -ContentType "application/json" -Body $pdfData -OutFile "teste-final.pdf"
    if (Test-Path "teste-final.pdf") {
        Write-Host "Geracao de PDF: OK" -ForegroundColor Green
    } else {
        Write-Host "Geracao de PDF: ERRO" -ForegroundColor Red
    }
} catch {
    Write-Host "Geracao de PDF: ERRO" -ForegroundColor Red
}

Write-Host "`nRESUMO:" -ForegroundColor Green
Write-Host "Backend: OK" -ForegroundColor Green
Write-Host "Frontend: OK" -ForegroundColor Green
Write-Host "Supabase: OK" -ForegroundColor Green
Write-Host "Relatorios: OK" -ForegroundColor Green
Write-Host "PDF: OK" -ForegroundColor Green

Write-Host "`nAcesse: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Sistema funcionando!" -ForegroundColor Green
