from __future__ import annotations

import subprocess
import sys
import os
from pathlib import Path
from typing import Optional


def _run(cmd: list[str]) -> int:
	try:
		return subprocess.call(cmd, shell=False)
	except Exception:
		return 1


def _configure_playwright_browsers_path() -> None:
	"""Define PLAYWRIGHT_BROWSERS_PATH para a pasta local se disponível.

	- Em build empacotado (PyInstaller), usa a pasta ".pw-browsers" ao lado do executável.
	- Em ambiente de desenvolvimento, se existir a pasta ".pw-browsers" na raiz do projeto, também usa.
	"""
	try:
		frozen = bool(getattr(sys, "frozen", False))
		if frozen:
			base_dir = Path(getattr(sys, "_MEIPASS", Path(sys.executable).parent)).resolve()
		else:
			# raiz do projeto (ui/..)
			base_dir = Path(__file__).resolve().parents[1]
		candidate = (base_dir / ".pw-browsers").resolve()
		if candidate.exists():
			os.environ["PLAYWRIGHT_BROWSERS_PATH"] = str(candidate)
	except Exception:
		pass


def ensure_playwright_chromium(verbose: bool = True, allow_install: bool = True) -> bool:
	"""Garante que o Chromium do Playwright está disponível.

	- Se estiver empacotado (sys.frozen), não tenta instalar (evita loop de processos).
	- Tenta lançar um navegador headless; se falhar e for ambiente dev (não frozen), instala.
	"""
	frozen = bool(getattr(sys, "frozen", False))
	if frozen:
		allow_install = False
	# configura diretório de browsers local, se existir
	_configure_playwright_browsers_path()
	try:
		from playwright.sync_api import sync_playwright  # type: ignore
		with sync_playwright() as p:
			try:
				browser = p.chromium.launch(headless=True)
				browser.close()
				return True
			except Exception:
				if allow_install:
					if verbose:
						print("Instalando Chromium para Playwright…")
					code = _run([sys.executable, "-m", "playwright", "install", "chromium"])
					return code == 0
				return False
	except Exception:
		return False


if __name__ == "__main__":
	ok = ensure_playwright_chromium()
	print("ok" if ok else "fail")
