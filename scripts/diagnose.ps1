Param(
	[switch]$Install
)

$ErrorActionPreference = "Stop"

function Step([string]$name, [scriptblock]$block) {
	Write-Host "[ ] $name"
	try {
		& $block
		Write-Host "[OK] $name" -ForegroundColor Green
	} catch {
		Write-Host "[!!] $name -> $($_.Exception.Message)" -ForegroundColor Red
		$global:DIAG_FAILED = $true
	}
}

Write-Host "== 7Mares Diagnose ==" -ForegroundColor Cyan
Write-Host ("- WD: " + (Get-Location))
Write-Host ("- PowerShell: " + $PSVersionTable.PSVersion.ToString())
Write-Host ("- ExecutionPolicy(CurrentUser): " + (Get-ExecutionPolicy -Scope CurrentUser))
$pythonCmd = (Get-Command python -ErrorAction SilentlyContinue)
$pythonPath = if ($pythonCmd) { $pythonCmd.Source } else { "not found" }
$httpProxy = if ($env:HTTP_PROXY) { $env:HTTP_PROXY } else { "(none)" }
$httpsProxy = if ($env:HTTPS_PROXY) { $env:HTTPS_PROXY } else { "(none)" }
$pwPath = if ($env:PLAYWRIGHT_BROWSERS_PATH) { $env:PLAYWRIGHT_BROWSERS_PATH } else { "(default)" }
Write-Host ("- python.exe: " + $pythonPath)
Write-Host ("- HTTP_PROXY: " + $httpProxy)
Write-Host ("- HTTPS_PROXY: " + $httpsProxy)
Write-Host ("- PLAYWRIGHT_BROWSERS_PATH: " + $pwPath)

Step "Python available" { & python --version | Out-Host }

if (!(Test-Path ".\.venv\Scripts\python.exe")) {
	if ($Install) {
		Write-Host "Creating venv .venv ..."
		& python -m venv .venv | Out-Null
	} else {
		Write-Host "[warn] .venv not found. Run with -Install to create." -ForegroundColor Yellow
	}
}

$venvPy = ".\.venv\Scripts\python.exe"
if (Test-Path $venvPy) {
	Step "pip available" { & $venvPy -m pip --version | Out-Host }
	if ($Install) {
		Step "pip install -r requirements.txt" { & $venvPy -m pip install -r requirements.txt --disable-pip-version-check | Out-Host }
	}
	Step "Import core libs" { & $venvPy -c "import importlib; [importlib.import_module(m) for m in ['PySide6','jinja2','playwright','dateutil','babel']]; print('imports ok')" | Out-Host }
	Step "playwright --version" { & $venvPy -m playwright --version | Out-Host }
	Step "Chromium available (no install)" { & $venvPy -c "from ui.bootstrap_playwright import ensure_playwright_chromium as f; import sys; sys.exit(0 if f(verbose=True, allow_install=False) else 1)" }
	if ($Install) {
		if (-not $env:PLAYWRIGHT_BROWSERS_PATH) {
			$env:PLAYWRIGHT_BROWSERS_PATH = ".\.pw-browsers"
			Write-Host "Set PLAYWRIGHT_BROWSERS_PATH=$env:PLAYWRIGHT_BROWSERS_PATH"
		}
		Step "Prepare Chromium (may download)" { & $venvPy ui\bootstrap_playwright.py | Out-Host }
	}
} else {
	Write-Host "[warn] Skipping venv checks." -ForegroundColor Yellow
}

Step "pnrsh.exe present" { if (-not (Test-Path ".\bin\pnrsh.exe")) { throw "bin\pnrsh.exe not found (fallback regex will be used)" } }

Write-Host "Done."
if ($global:DIAG_FAILED) { exit 1 } else { exit 0 }
