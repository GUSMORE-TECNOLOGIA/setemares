# 7Mares Cotador (MVP)

Projeto desktop (Windows) para gerar cotações de aéreo a partir de PNR em texto, com cálculo automático (RAV, taxas, fee e incentivo) e geração de PDF espelhando o Teste.pdf.

## Stack
- Python 3.11
- PySide6 (UI)
- Jinja2 (templates HTML)
- Playwright (Chromium headless → PDF)
- pytest (testes)

## Estrutura
- ui/ — aplicação PySide6
- core/parser/ — parser de PNR (regex, heurísticas)
- core/rules/ — regras de cálculo
- templates/ — HTML/CSS do PDF
- pdf/ — gerador de PDF (Playwright)
- cli/ — CLI para Fase 1
- tests/ — testes unitários
- docs/ — especificação e amostras
- scripts/ — automações auxiliares
- data/ — PNRs de teste
- assets/ — logo, fontes, CSS compartilhado

## Setup rápido (Windows PowerShell)
```
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m playwright install chromium
pytest
```

## Build do .exe (MVP)
- Empacotamento com PyInstaller (onefile, sem console). Instruções serão adicionadas após a UI básica.

## Licença
Privado — uso interno Sete Mares.
