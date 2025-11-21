# Script de Teste da API de Concierge
# Execute: .\test-api.ps1

Write-Host "🧪 Testando API de Concierge..." -ForegroundColor Green

# Teste 1: Health Check
Write-Host "`n1. Testando Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET
    Write-Host "✅ Health Check: $($health.ok)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health Check falhou: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 2: Histórico de Relatórios
Write-Host "`n2. Testando Histórico de Relatórios..." -ForegroundColor Yellow
try {
    $history = Invoke-RestMethod -Uri "http://localhost:3001/api/concierge/history?limit=5" -Method GET
    Write-Host "✅ Histórico: $($history.reports.Count) relatórios encontrados" -ForegroundColor Green
} catch {
    Write-Host "❌ Histórico falhou: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 3: Geração de Relatório
Write-Host "`n3. Testando Geração de Relatório..." -ForegroundColor Yellow
$testData = @{
    clientName = "Teste Automatizado"
    destination = "São Paulo, Brasil"
    checkin = "2025-01-15"
    checkout = "2025-01-20"
    travelType = "familia"
    budget = "confortavel"
    adults = 2
    children = 1
    interests = @("historia", "gastronomia")
    observations = "Teste automatizado do sistema"
} | ConvertTo-Json

try {
    $report = Invoke-RestMethod -Uri "http://localhost:3001/api/concierge/generate" -Method POST -ContentType "application/json" -Body $testData
    Write-Host "✅ Relatório gerado: ID $($report.report.id)" -ForegroundColor Green
    $reportId = $report.report.id
} catch {
    Write-Host "❌ Geração de relatório falhou: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Teste 4: Busca de Relatório Específico
Write-Host "`n4. Testando Busca de Relatório..." -ForegroundColor Yellow
try {
    $specificReport = Invoke-RestMethod -Uri "http://localhost:3001/api/concierge/report/$reportId" -Method GET
    Write-Host "✅ Relatório encontrado: $($specificReport.report.client_name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Busca de relatório falhou: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 5: Geração de PDF
Write-Host "`n5. Testando Geração de PDF..." -ForegroundColor Yellow
$pdfData = @{
    htmlContent = "<html><body><h1>Teste de PDF</h1><p>Este é um teste automatizado de geração de PDF.</p></body></html>"
    filename = "teste-automatizado.pdf"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:3001/api/generate-pdf" -Method POST -ContentType "application/json" -Body $pdfData -OutFile "teste-automatizado.pdf"
    if (Test-Path "teste-automatizado.pdf") {
        Write-Host "✅ PDF gerado: teste-automatizado.pdf" -ForegroundColor Green
    } else {
        Write-Host "❌ PDF não foi criado" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Geração de PDF falhou: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 6: Regeneração Parcial
Write-Host "`n6. Testando Regeneração Parcial..." -ForegroundColor Yellow
$regenBody = @{ reportId = $reportId; type = "all" } | ConvertTo-Json
try {
    $regen = Invoke-RestMethod -Uri "http://localhost:3001/api/concierge/regenerate" -Method POST -ContentType "application/json" -Body $regenBody
    Write-Host "✅ Regeneração executada: ID $($regen.report.id)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Regeneração falhou (pode faltar contexto ou migração): $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n🎉 Testes concluídos!" -ForegroundColor Green
Write-Host "Para testar a interface web, acesse: http://localhost:5173" -ForegroundColor Cyan
