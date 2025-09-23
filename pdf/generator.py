import asyncio
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
import sys
import os


def _ensure_pw_env() -> None:
	"""Ensure PLAYWRIGHT_BROWSERS_PATH points to our bundled .pw-browsers.
	No-ops if already set. Checks common locations for dev and PyInstaller.
	"""
	if os.environ.get("PLAYWRIGHT_BROWSERS_PATH"):
		return
	candidates: list[Path] = []
	# repo root .pw-browsers
	candidates.append(Path(__file__).resolve().parents[1] / ".pw-browsers")
	# exe dir .pw-browsers (one-folder)
	try:
		exe_dir = Path(sys.executable).resolve().parent
		candidates.append(exe_dir / ".pw-browsers")
	except Exception:
		pass
	# _MEIPASS/.pw-browsers (one-file)
	try:
		base_meipass = Path(getattr(sys, "_MEIPASS", ""))
		if str(base_meipass):
			candidates.append(base_meipass / ".pw-browsers")
	except Exception:
		pass
	for c in candidates:
		try:
			if (c).exists() and any((c / d).exists() for d in ["chromium-1134", "chromium-1169", "chromium"]):
				os.environ["PLAYWRIGHT_BROWSERS_PATH"] = str(c.resolve())
				break
		except Exception:
			continue


def _find_template_root(template_dir: str) -> Path:
	"""Resolve a reliable templates directory for dev and PyInstaller builds.
	Search order:
	1) Provided path relative to current working directory
	2) Sibling 'templates' next to this file's parent (project root layout)
	3) PyInstaller one-folder: directory next to executable
	4) PyInstaller one-file: _MEIPASS temporary folder
	Falls back to resolved provided path.
	"""
	candidates = []
	p = Path(template_dir)
	# provided path (relative to CWD if not absolute)
	candidates.append(p if p.is_absolute() else Path.cwd() / template_dir)
	# project layout: repo_root/templates (this file lives in repo_root/pdf/)
	candidates.append(Path(__file__).resolve().parents[1] / "templates")
	# pyinstaller one-folder: executable_dir/templates
	try:
		exe_dir = Path(sys.executable).resolve().parent
		candidates.append(exe_dir / "templates")
	except Exception:
		pass
	# pyinstaller one-file: _MEIPASS/templates
	try:
		base_meipass = Path(getattr(sys, "_MEIPASS", ""))
		if str(base_meipass):
			candidates.append(base_meipass / "templates")
	except Exception:
		pass
	for c in candidates:
		try:
			if (c / "quote.html").exists():
				return c
		except Exception:
			continue
	# fallback final
	return p.resolve()


async def render_pdf(data: dict, template_dir: str, out_pdf: str) -> None:
	# Ensure Playwright sees the browsers path before import
	_ensure_pw_env()
	# Import here to ensure PLAYWRIGHT_BROWSERS_PATH is already configured by the app bootstrap
	from playwright.async_api import async_playwright
	template_root = _find_template_root(template_dir)
	env = Environment(loader=FileSystemLoader(str(template_root)), autoescape=True)
	# filtro para resolver nome completo do aeroporto (sempre registra; fallback identidade)
	def _airport_name(value: str) -> str:
		try:
			from core.data.airports import get_airport_description
			return get_airport_description(value)
		except Exception:
			return value
	env.filters["airport_name"] = _airport_name

	html = env.get_template("quote.html").render(**data)
	html_path = template_root / "_tmp_quote.html"
	html_path.write_text(html, encoding="utf-8")
	async with async_playwright() as p:
		browser = await p.chromium.launch(headless=True)
		page = await browser.new_page()
		# permitir acesso a file:// para carregar logo local
		await page.goto(html_path.as_uri(), wait_until="load")
		await page.wait_for_load_state("load")
		await page.pdf(
			path=str(Path(out_pdf).resolve()),
			format="A4",
			margin={"top": "18mm", "right": "18mm", "bottom": "18mm", "left": "18mm"},
			print_background=True,
		)
		await browser.close()


async def render_multi_pdf(quotes: list[dict], summary: dict, template_dir: str, out_pdf: str) -> None:
	_ensure_pw_env()
	from playwright.async_api import async_playwright
	template_root = _find_template_root(template_dir)
	env = Environment(loader=FileSystemLoader(str(template_root)), autoescape=True)
	def _airport_name(value: str) -> str:
		try:
			from core.data.airports import get_airport_description
			return get_airport_description(value)
		except Exception:
			return value
	env.filters["airport_name"] = _airport_name
	html = env.get_template("multi_quote.html").render(quotes=quotes, summary=summary)
	html_path = template_root / "_tmp_quote.html"
	html_path.write_text(html, encoding="utf-8")
	async with async_playwright() as p:
		browser = await p.chromium.launch(headless=True)
		page = await browser.new_page()
		await page.goto(html_path.as_uri(), wait_until="load")
		await page.wait_for_load_state("load")
		await page.pdf(
			path=str(Path(out_pdf).resolve()),
			format="A4",
			margin={"top": "18mm", "right": "18mm", "bottom": "18mm", "left": "18mm"},
			print_background=True,
		)
		await browser.close()


if __name__ == "__main__":
	# Uso mínimo: passar JSON no stdin com os campos esperados pelo template
	import json, sys
	_payload = json.loads(sys.stdin.read() or "{}")
	asyncio.run(render_pdf(_payload, template_dir="templates", out_pdf="out.pdf"))
