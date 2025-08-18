import asyncio
import os
from jinja2 import Environment, FileSystemLoader
from playwright.async_api import async_playwright


async def render_pdf(data: dict, template_dir: str, out_pdf: str) -> None:
	env = Environment(loader=FileSystemLoader(template_dir), autoescape=True)
	html = env.get_template("quote.html").render(**data)
	html_path = os.path.join(template_dir, "_tmp_quote.html")
	with open(html_path, "w", encoding="utf-8") as f:
		f.write(html)
	async with async_playwright() as p:
		browser = await p.chromium.launch()
		page = await browser.new_page()
		await page.goto(f"file:///{html_path}")
		await page.pdf(
			path=out_pdf,
			format="A4",
			margin={"top": "18mm", "right": "18mm", "bottom": "18mm", "left": "18mm"},
		)
		await browser.close()


if __name__ == "__main__":
	# Uso mínimo: passar JSON no stdin com os campos esperados pelo template
	import json, sys
	_payload = json.loads(sys.stdin.read() or "{}")
	asyncio.run(render_pdf(_payload, template_dir="templates", out_pdf="out.pdf"))
