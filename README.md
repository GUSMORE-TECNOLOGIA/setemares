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

## pnrsh (decoder de PNR)
- Repositório: https://github.com/iangcarroll/pnrsh
- Build: `scripts/build_pnrsh.ps1` (parametrizável por env var `PNRSH_REPO_URL` e `PNRSH_OUT_DIR`)
- Binário esperado: `bin/pnrsh.exe`. O app procura primeiro em `bin/`; se ausente, usa fallback de regex de trechos.
- Version pin: commit atual registrado em `licenses/pnrsh_VERSION` (gerado pelo script de build)
- Troubleshooting:
  - "binário ausente": execute o script de build e verifique permissões no Windows SmartScreen.
  - "Go não encontrado": instale o Go e mantenha `go.exe` no PATH.
  - "Permissão negada": execute o PowerShell como Administrador.

## Terceiros
- pnrsh (MIT) — ver `licenses/pnrsh_LICENSE` e `licenses/pnrsh_VERSION`.

## Licença
Privado — uso interno Sete Mares.

## Municipal App — MVP à Escala (scaffold)
- Documentação: `docs/BRIEFING_Municipal_App_MVP_a_Escala.md`
- Veja também `municipal/README.md` para instruções de execução local (Docker) e roadmap.
