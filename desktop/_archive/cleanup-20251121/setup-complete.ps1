# ============================================
# Script de Setup Completo - 7Mares Cotador
# ============================================
# Este script automatiza a configuração do ambiente
# Execute: .\setup-complete.ps1

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  7Mares Cotador - Setup Completo" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. Verificar Pré-requisitos
# ============================================
Write-Host "[1/8] Verificando pré-requisitos..." -ForegroundColor Yellow

# Node.js
try {
    $nodeVersion = node --version
    Write-Host "  [OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js não encontrado. Instale Node.js 18+ primeiro." -ForegroundColor Red
    exit 1
}

# Python
try {
    $pythonVersion = python --version
    Write-Host "  [OK] Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Python não encontrado. Instale Python 3.11+ primeiro." -ForegroundColor Red
    exit 1
}

# Git
try {
    $gitVersion = git --version
    Write-Host "  [OK] Git: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Git não encontrado. Instale Git primeiro." -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# 2. Configurar Ambiente Python
# ============================================
Write-Host "[2/8] Configurando ambiente Python..." -ForegroundColor Yellow

# Voltar para raiz se estiver em desktop
if (Test-Path "requirements.txt") {
    $rootDir = Get-Location
} else {
    $rootDir = Split-Path -Parent (Get-Location)
    Set-Location $rootDir
}

# Criar venv se não existir
if (-not (Test-Path ".\.venv")) {
    Write-Host "  Criando ambiente virtual Python..." -ForegroundColor Cyan
    python -m venv .venv
}

# Ativar venv
Write-Host "  Ativando ambiente virtual..." -ForegroundColor Cyan
. .\.venv\Scripts\Activate.ps1

# Instalar dependências Python
Write-Host "  Instalando dependências Python..." -ForegroundColor Cyan
pip install -r requirements.txt

# Instalar Playwright
Write-Host "  Instalando Playwright..." -ForegroundColor Cyan
python -m playwright install chromium

Write-Host "  [OK] Ambiente Python configurado" -ForegroundColor Green
Write-Host ""

# ============================================
# 3. Configurar Ambiente Node.js
# ============================================
Write-Host "[3/8] Configurando ambiente Node.js..." -ForegroundColor Yellow

# Navegar para desktop
$desktopDir = Join-Path $rootDir "desktop"
if (-not (Test-Path $desktopDir)) {
    Write-Host "  ✗ Diretório desktop não encontrado!" -ForegroundColor Red
    exit 1
}

Set-Location $desktopDir

# Instalar dependências Node.js
Write-Host "  Instalando dependências Node.js..." -ForegroundColor Cyan
npm install

Write-Host "  [OK] Ambiente Node.js configurado" -ForegroundColor Green
Write-Host ""

# ============================================
# 4. Configurar Variáveis de Ambiente
# ============================================
Write-Host "[4/8] Configurando variáveis de ambiente..." -ForegroundColor Yellow

$envExample = ".env.example"
$envFile = ".env"

if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Write-Host "  Criando arquivo .env a partir de .env.example..." -ForegroundColor Cyan
        Copy-Item $envExample $envFile
        Write-Host '  [AVISO] IMPORTANTE: Edite o arquivo .env com suas credenciais!' -ForegroundColor Yellow
        Write-Host "     - VITE_SUPABASE_URL" -ForegroundColor Yellow
        Write-Host "     - VITE_SUPABASE_ANON_KEY" -ForegroundColor Yellow
        Write-Host "     - OPENAI_API_KEY (opcional)" -ForegroundColor Yellow
    } else {
        Write-Host '  [AVISO] Arquivo .env.example não encontrado. Criando .env básico...' -ForegroundColor Yellow
        @"
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
OPENAI_API_KEY=sk-your-openai-api-key
USE_AI_CONCIERGE=true
CACHE_TTL_MIN=360
"@ | Out-File -FilePath $envFile -Encoding UTF8
        Write-Host '  [AVISO] IMPORTANTE: Edite o arquivo .env com suas credenciais!' -ForegroundColor Yellow
    }
} else {
    Write-Host "  [OK] Arquivo .env ja existe" -ForegroundColor Green
}

Write-Host ""

# ============================================
# 5. Verificar Banco de Dados
# ============================================
Write-Host "[5/8] Verificando configuração do banco de dados..." -ForegroundColor Yellow

# Carregar .env para verificar
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$supabaseUrl = $env:VITE_SUPABASE_URL
if ($supabaseUrl -and $supabaseUrl -notmatch "seu-projeto-id") {
    Write-Host "  [OK] Supabase configurado" -ForegroundColor Green
    Write-Host '  [AVISO] Lembre-se de executar as migrações:' -ForegroundColor Yellow
    Write-Host "     node scripts/database-migration.js apply enable_rls_and_add_indexes" -ForegroundColor Cyan
} else {
    Write-Host '  [AVISO] Supabase não configurado. Configure no arquivo .env' -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# 6. Validar Instalação
# ============================================
Write-Host "[6/8] Validando instalação..." -ForegroundColor Yellow

# Verificar Python packages
Write-Host "  Verificando pacotes Python..." -ForegroundColor Cyan
$pythonPackages = pip list | Select-String "pyside6|playwright|jinja2"
if ($pythonPackages) {
    Write-Host "  [OK] Pacotes Python instalados" -ForegroundColor Green
} else {
    Write-Host '  [AVISO] Alguns pacotes Python podem estar faltando' -ForegroundColor Yellow
}

# Verificar Node modules
Write-Host "  Verificando módulos Node.js..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Write-Host "  [OK] Modulos Node.js instalados" -ForegroundColor Green
} else {
    Write-Host "  ✗ Módulos Node.js não encontrados!" -ForegroundColor Red
}

Write-Host ""

# ============================================
# 7. Executar Testes (Opcional)
# ============================================
Write-Host "[7/8] Executando testes básicos..." -ForegroundColor Yellow

# Testes Python
Write-Host "  Executando testes Python..." -ForegroundColor Cyan
Set-Location $rootDir
. .\.venv\Scripts\Activate.ps1
try {
    python -m pytest -q --tb=short 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Testes Python passaram" -ForegroundColor Green
    } else {
        Write-Host '  [AVISO] Alguns testes Python falharam (pode ser normal)' -ForegroundColor Yellow
    }
} catch {
    Write-Host '  [AVISO] Não foi possível executar testes Python' -ForegroundColor Yellow
}

# TypeScript check
Write-Host "  Verificando TypeScript..." -ForegroundColor Cyan
Set-Location $desktopDir
try {
    npm run typecheck 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] TypeScript sem erros" -ForegroundColor Green
    } else {
        Write-Host '  [AVISO] Alguns erros de TypeScript encontrados' -ForegroundColor Yellow
    }
} catch {
    Write-Host '  [AVISO] Não foi possível verificar TypeScript' -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# 8. Resumo Final
# ============================================
Write-Host "[8/8] Resumo da instalação" -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Setup Concluído!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Configure o arquivo .env com suas credenciais:" -ForegroundColor White
Write-Host "   cd desktop" -ForegroundColor Cyan
Write-Host "   code .env  # ou notepad .env" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Execute as migrações do banco:" -ForegroundColor White
Write-Host "   node scripts/database-migration.js apply enable_rls_and_add_indexes" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Inicie o servidor backend:" -ForegroundColor White
Write-Host "   npm run server" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Em outro terminal, inicie o frontend:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Acesse a aplicação:" -ForegroundColor White
Write-Host "   http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Documentação completa: SETUP_COMPLETO.md" -ForegroundColor Yellow
Write-Host ""

