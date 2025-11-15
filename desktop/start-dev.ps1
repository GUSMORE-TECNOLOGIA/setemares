# Script para iniciar o ambiente de desenvolvimento
# Inicia backend e frontend em terminais separados

Write-Host "🚀 Iniciando ambiente de desenvolvimento 7Mares..." -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script a partir do diretório desktop/" -ForegroundColor Red
    exit 1
}

# Verificar se .env existe
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Arquivo .env não encontrado!" -ForegroundColor Yellow
    Write-Host "   Criando .env com valores padrão..." -ForegroundColor Gray
    
    $envContent = @"
# Supabase Configuration
VITE_SUPABASE_URL=https://dgverpbhxtslmfrrcwwj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs

# OpenAI Configuration (opcional)
OPENAI_API_KEY=your-openai-api-key-here

# Concierge Configuration
USE_AI_CONCIERGE=true
CACHE_TTL_MIN=360
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "   ✅ .env criado. Configure suas credenciais se necessário." -ForegroundColor Green
    Write-Host ""
}

# Verificar dependências
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Verificar portas
function Test-Port {
    param([int]$Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
    return $connection
}

$port3001 = Test-Port 3001
$port5173 = Test-Port 5173

if ($port3001) {
    Write-Host "⚠️  Porta 3001 já está em uso!" -ForegroundColor Yellow
    Write-Host "   Encerre o processo ou use outra porta." -ForegroundColor Gray
}

if ($port5173) {
    Write-Host "⚠️  Porta 5173 já está em uso!" -ForegroundColor Yellow
    Write-Host "   Encerre o processo ou use outra porta." -ForegroundColor Gray
}

Write-Host ""
Write-Host "📋 Iniciando servidores..." -ForegroundColor Cyan
Write-Host ""
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor Gray
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "   Pressione Ctrl+C para encerrar ambos os servidores" -ForegroundColor Yellow
Write-Host ""

# Iniciar backend em background
Write-Host "🔧 Iniciando backend..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run server
}

# Aguardar um pouco para o backend iniciar
Start-Sleep -Seconds 2

# Iniciar frontend (foreground para ver logs)
Write-Host "🎨 Iniciando frontend..." -ForegroundColor Yellow
Write-Host ""

try {
    npm run dev
} finally {
    # Limpar job do backend ao sair
    if ($backendJob) {
        Stop-Job $backendJob
        Remove-Job $backendJob
    }
}

