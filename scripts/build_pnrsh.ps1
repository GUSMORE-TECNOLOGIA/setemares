param(
    [string]$RepoUrl = $env:PNRSH_REPO_URL,
    [string]$OutDir = $env:PNRSH_OUT_DIR
)

$ErrorActionPreference = "Stop"

if (-not $RepoUrl -or $RepoUrl -eq "") { $RepoUrl = "https://github.com/iangcarroll/pnrsh.git" }
if (-not $OutDir -or $OutDir -eq "") { $OutDir = "bin" }

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Write-Error "git não encontrado no PATH." }

# Garante diretórios
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$outPath = Join-Path $projectRoot $OutDir
if (-not (Test-Path $outPath)) { New-Item -ItemType Directory -Path $outPath | Out-Null }
if (-not (Test-Path (Join-Path $projectRoot "licenses"))) { New-Item -ItemType Directory -Path (Join-Path $projectRoot "licenses") | Out-Null }

# Clone superficial
$tmp = Join-Path $env:TEMP ("pnrsh-src-" + (Get-Date -Format yyyyMMddHHmmss))

git clone --depth=1 $RepoUrl $tmp | Out-Null
Push-Location $tmp

$commit = (git rev-parse HEAD).Trim()

$binOut = Join-Path $outPath "pnrsh.exe"

# Build com Go (estrutura do repo usa ./cmd)
if (-not (Get-Command go -ErrorAction SilentlyContinue)) { Pop-Location; Remove-Item -Recurse -Force $tmp; Write-Error "Go não encontrado no PATH. Instale o Go (https://go.dev/dl/)." }

# Compila o pacote principal em ./cmd e escreve o executável em $binOut
& go build -o $binOut ./cmd
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $binOut)) { Pop-Location; Remove-Item -Recurse -Force $tmp; Write-Error "Falha no build via Go (./cmd)." }

Pop-Location

# Salvar versão
Set-Content -Path (Join-Path $projectRoot "licenses\pnrsh_VERSION") -Value $commit -Encoding UTF8

# Copiar LICENSE se existir (o repo usa LICENSE.md)
$licMd = Join-Path $tmp "LICENSE.md"
if (Test-Path $licMd) { Copy-Item $licMd (Join-Path $projectRoot "licenses\pnrsh_LICENSE") -Force }

# Limpeza
Remove-Item -Recurse -Force $tmp

Write-Host "pnrsh.exe compilado em $OutDir (commit $commit)"