# Script de Setup Completo - 7Mares Cotador
# Configura todo o ambiente de desenvolvimento

$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando setup completo do projeto 7Mares Cotador..." -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. Verificação de Pré-requisitos
# ============================================
Write-Host "📋 Verificando pré-requisitos..." -ForegroundColor Yellow

function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

$prereqs = @{
    "Node.js" = Test-Command "node"
    "Python" = Test-Command "python"
    "npm" = Test-Command "npm"
}

$allOk = $true
foreach ($prereq in $prereqs.GetEnumerator()) {
    if ($prereq.Value) {
        $version = switch ($prereq.Key) {
            "Node.js" { node --version }
            "Python" { python --version }
            "npm" { npm --version }
        }
        Write-Host "  ✅ $($prereq.Key): $version" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($prereq.Key): Não encontrado" -ForegroundColor Red
        $allOk = $false
    }
}

if (-not $allOk) {
    Write-Host ""
    Write-Host "❌ Alguns pré-requisitos estão faltando. Instale-os antes de continuar." -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# 2. Setup Python (venv e dependências)
# ============================================
Write-Host "🐍 Configurando ambiente Python..." -ForegroundColor Yellow

if (-not (Test-Path ".\.venv")) {
    Write-Host "  Criando venv..." -ForegroundColor Gray
    python -m venv .venv
}

Write-Host "  Ativando venv..." -ForegroundColor Gray
& .\.venv\Scripts\Activate.ps1

Write-Host "  Instalando dependências Python..." -ForegroundColor Gray
pip install --upgrade pip
pip install -r requirements.txt

Write-Host "  ✅ Python configurado" -ForegroundColor Green
Write-Host ""

# ============================================
# 3. Setup Node.js (dependências)
# ============================================
Write-Host "📦 Configurando ambiente Node.js..." -ForegroundColor Yellow

# Instalar dependências raiz
if (Test-Path "package.json") {
    Write-Host "  Instalando dependências raiz..." -ForegroundColor Gray
    npm install
}

# Instalar dependências desktop
if (Test-Path "desktop\package.json") {
    Write-Host "  Instalando dependências desktop..." -ForegroundColor Gray
    Push-Location desktop
    npm install
    Pop-Location
}

Write-Host "  ✅ Node.js configurado" -ForegroundColor Green
Write-Host ""

# ============================================
# 4. Configurar Variáveis de Ambiente
# ============================================
Write-Host "⚙️  Configurando variáveis de ambiente..." -ForegroundColor Yellow

$envFiles = @(
    @{ Path = ".env"; Example = ".env.example" }
    @{ Path = "desktop\.env"; Example = "desktop\.env.example" }
)

foreach ($envFile in $envFiles) {
    if (-not (Test-Path $envFile.Path)) {
        Write-Host "  Criando $($envFile.Path)..." -ForegroundColor Gray
        
        # Valores padrão do código
        $defaultContent = @"
# Supabase Configuration
VITE_SUPABASE_URL=https://dgverpbhxtslmfrrcwwj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndmVycGJoeHRzbG1mcnJjd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDY0OTEsImV4cCI6MjA3Mzg4MjQ5MX0.q1OogIBKY4GIzc0wwLnFfzq3lZt3JMHAj0f832kqtbs

# OpenAI Configuration (opcional - para Concierge IA)
OPENAI_API_KEY=your-openai-api-key-here

# Concierge Configuration
USE_AI_CONCIERGE=true
CACHE_TTL_MIN=360

# Google Maps API (opcional)
GOOGLE_MAPS_API_KEY=your-google-maps-key-here

# Eventbrite Token (opcional)
EVENTBRITE_TOKEN=your-eventbrite-token-here
"@
        
        $defaultContent | Out-File -FilePath $envFile.Path -Encoding UTF8
        Write-Host "    ✅ $($envFile.Path) criado com valores padrão" -ForegroundColor Green
        Write-Host "    ⚠️  ATENÇÃO: Configure suas credenciais reais no arquivo!" -ForegroundColor Yellow
    } else {
        Write-Host "  ✅ $($envFile.Path) já existe" -ForegroundColor Green
    }
}

Write-Host ""

# ============================================
# 5. Instalar Playwright
# ============================================
Write-Host "🎭 Instalando Playwright..." -ForegroundColor Yellow

Push-Location desktop
try {
    npx playwright install chromium
    Write-Host "  ✅ Playwright instalado" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Erro ao instalar Playwright: $_" -ForegroundColor Yellow
    Write-Host "  Você pode instalar manualmente depois com: npx playwright install chromium" -ForegroundColor Gray
}
Pop-Location

Write-Host ""

# ============================================
# 6. Verificar pnrsh (binário)
# ============================================
Write-Host "🔧 Verificando pnrsh..." -ForegroundColor Yellow

if (Test-Path "bin\pnrsh.exe") {
    Write-Host "  ✅ pnrsh.exe encontrado" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  pnrsh.exe não encontrado" -ForegroundColor Yellow
    Write-Host "  Você pode compilar depois com: scripts\build_pnrsh.ps1" -ForegroundColor Gray
}

Write-Host ""

# ============================================
# 7. Resumo e Próximos Passos
# ============================================
Write-Host "✅ Setup concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configure as variáveis de ambiente:" -ForegroundColor White
Write-Host "   - Edite desktop\.env com suas credenciais Supabase" -ForegroundColor Gray
Write-Host "   - Configure OPENAI_API_KEY se for usar Concierge IA" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configure o banco de dados (se necessário):" -ForegroundColor White
Write-Host "   cd desktop" -ForegroundColor Gray
Write-Host "   node scripts\database-migration.js apply enable_rls_and_add_indexes" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Execute o projeto:" -ForegroundColor White
Write-Host "   # Terminal 1 - Backend" -ForegroundColor Gray
Write-Host "   cd desktop" -ForegroundColor Gray
Write-Host "   npm run server" -ForegroundColor Gray
Write-Host ""
Write-Host "   # Terminal 2 - Frontend" -ForegroundColor Gray
Write-Host "   cd desktop" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Acesse:" -ForegroundColor White
Write-Host "   - Frontend: http://localhost:5173" -ForegroundColor Gray
Write-Host "   - Backend:  http://localhost:3001" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 Pronto para desenvolver!" -ForegroundColor Green

