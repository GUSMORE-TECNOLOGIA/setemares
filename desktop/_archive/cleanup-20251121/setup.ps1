Param(
  [switch]$PrepareOnly
)

$ErrorActionPreference = "Stop"

# 1) venv
if (-not (Test-Path .\.venv)) { python -m venv .venv }
. .\.venv\Scripts\Activate.ps1

# 2) deps
pip install -r requirements.txt

# 3) playwright chromium (prepare)
if (-not $env:PLAYWRIGHT_BROWSERS_PATH) { $env:PLAYWRIGHT_BROWSERS_PATH = ".\.pw-browsers" }
Write-Host ("PLAYWRIGHT_BROWSERS_PATH=" + $env:PLAYWRIGHT_BROWSERS_PATH)
python ui\bootstrap_playwright.py
if ($PrepareOnly) { exit 0 }

# 4) testes
python -m pytest -q

# 5) pyinstaller
pip install pyinstaller
pyinstaller build\7mares.spec --noconfirm
try {
  $distDir = Join-Path -Path "dist" -ChildPath "7mares-cotador"
  if (Test-Path ".\.pw-browsers") {
    Write-Host "Copiando .pw-browsers para o pacote..."
    Copy-Item -Recurse -Force ".\.pw-browsers" (Join-Path $distDir ".pw-browsers")
  } else {
    Write-Host "Aviso: .pw-browsers não encontrado; o pacote pode exigir download na primeira execução." -ForegroundColor Yellow
  }
} catch {
  Write-Host ("Falha ao copiar .pw-browsers: " + $_.Exception.Message) -ForegroundColor Yellow
}

# 6) inno setup (se ISCC no PATH)
if (Get-Command iscc -ErrorAction SilentlyContinue) {
  iscc installer\7mares.iss
} else {
  Write-Host "ISCC (Inno Setup) não encontrado no PATH. Pulei etapa de instalador." -ForegroundColor Yellow
}
