from PySide6 import QtWidgets, QtCore, QtGui
from decimal import Decimal
import asyncio
from datetime import datetime
from typing import List
import sys
from pathlib import Path
from string import Template

# Garantir que a raiz do projeto esteja no sys.path quando executado como script
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
	sys.path.insert(0, str(ROOT))

from cli.main import parse as parse_pnr
from core.rules.pricing import compute_totals
from pdf.generator import render_pdf
from ui.bootstrap_playwright import ensure_playwright_chromium
from core.data.airlines import get_airline_name


class MainWindow(QtWidgets.QMainWindow):
	def __init__(self):
		super().__init__()
		self.setWindowTitle("7Mares Cotador — MVP")
		self.resize(900, 700)

		# Preparação Playwright/Chromium (v0.5)
		if len(sys.argv) > 1 and sys.argv[1] == "--prepare":
			ensure_playwright_chromium(allow_install=True)
			QtWidgets.QApplication.quit()
			return
		# Em executável (sys.frozen), só verifica; não instala para evitar loops
		ensure_playwright_chromium(allow_install=not bool(getattr(sys, "frozen", False)))

		# Header moderno com logo, título e botão de tema
		header_widget = QtWidgets.QWidget()
		header_layout = QtWidgets.QHBoxLayout(header_widget)
		header_layout.setContentsMargins(0, 0, 0, 0)
		self.logo_app = QtWidgets.QLabel()
		_app_logo_path = Path("Arquivos/Modelos/Logo.png").resolve()
		if _app_logo_path.exists():
			pix = QtGui.QPixmap(str(_app_logo_path))
			self.logo_app.setPixmap(pix.scaledToHeight(40, QtCore.Qt.SmoothTransformation))
		title_label = QtWidgets.QLabel("7Mares Cotador")
		title_label.setObjectName("appTitle")
		_spacer = QtWidgets.QWidget(); _spacer.setSizePolicy(QtWidgets.QSizePolicy.Expanding, QtWidgets.QSizePolicy.Preferred)
		self.theme_btn = QtWidgets.QPushButton()
		self.theme_btn.setObjectName("themeButton")
		self.theme_btn.setCursor(QtCore.Qt.PointingHandCursor)
		self.theme_btn.setFixedSize(32, 32)
		self.theme_btn.clicked.connect(self.toggle_theme)
		header_layout.addWidget(self.logo_app)
		header_layout.addSpacing(8)
		header_layout.addWidget(title_label)
		header_layout.addWidget(_spacer)
		header_layout.addWidget(self.theme_btn)

		# Widgets principais
		self.input_pnr = QtWidgets.QPlainTextEdit()
		self.input_pnr.setPlaceholderText("Cole aqui o PNR em texto...")
		self.input_pnr.setMinimumHeight(140)

		form = QtWidgets.QFormLayout()
		form.setFormAlignment(QtCore.Qt.AlignTop)
		form.setLabelAlignment(QtCore.Qt.AlignVCenter | QtCore.Qt.AlignRight)
		form.setFieldGrowthPolicy(QtWidgets.QFormLayout.AllNonFixedFieldsGrow)
		self.rav_pct = QtWidgets.QDoubleSpinBox(); self.rav_pct.setSuffix(" %")
		self.rav_pct.setRange(0, 100)
		self.rav_pct.setDecimals(2)
		self.rav_pct.setValue(10.0)
		self.rav_pct.setButtonSymbols(QtWidgets.QAbstractSpinBox.UpDownArrows)

		self.fee = QtWidgets.QDoubleSpinBox(); self.fee.setButtonSymbols(QtWidgets.QAbstractSpinBox.UpDownArrows)
		self.fee.setRange(0, 1_000_000)
		self.fee.setDecimals(2)

		self.incentivo_val = QtWidgets.QDoubleSpinBox(); self.incentivo_val.setButtonSymbols(QtWidgets.QAbstractSpinBox.UpDownArrows)
		self.incentivo_val.setRange(0, 1_000_000)
		self.incentivo_val.setDecimals(2)

		self.incentivo_pct = QtWidgets.QDoubleSpinBox(); self.incentivo_pct.setSuffix(" %"); self.incentivo_pct.setButtonSymbols(QtWidgets.QAbstractSpinBox.UpDownArrows)
		self.incentivo_pct.setRange(0, 100)
		self.incentivo_pct.setDecimals(2)

		# v0.5 — Qtd Cotação
		self.qtd_cotacao = QtWidgets.QSpinBox(); self.qtd_cotacao.setRange(1,9); self.qtd_cotacao.setValue(int(QtCore.QSettings("SeteMares","Cotador").value("ui/qtd_cotacao", 1)))
		self.qtd_cotacao.setButtonSymbols(QtWidgets.QAbstractSpinBox.UpDownArrows)

		form.addRow("RAV %:", self.rav_pct)
		form.addRow("Fee (USD):", self.fee)
		form.addRow("Incentivo (USD):", self.incentivo_val)
		form.addRow("Incentivo %:", self.incentivo_pct)
		form.addRow("Qtd Cotação:", self.qtd_cotacao)

		# Campos adicionais para layout
		self.classe = QtWidgets.QComboBox(); self.classe.addItems(["Econômica","Premium Economy","Executiva","Primeira Classe"]); self.classe.setCurrentIndex(2); self.classe.setEditable(False)
		self.bagagem = QtWidgets.QComboBox(); self.bagagem.addItems(["2 peças de até 23kg por bilhete","1 peça de até 23kg por bilhete","2 peças de até 32kg por bilhete","A confirmar"]); self.bagagem.setCurrentIndex(0); self.bagagem.setEditable(False)
		self.pagamento = QtWidgets.QComboBox(); self.pagamento.addItems(["Em até Xx no cartão de crédito, taxas à vista","À vista no cartão de crédito","PIX à vista"]); self.pagamento.setCurrentIndex(0); self.pagamento.setEditable(False)
		self.parcelas = QtWidgets.QSpinBox(); self.parcelas.setRange(1,36); self.parcelas.setValue(4); self.parcelas.setButtonSymbols(QtWidgets.QAbstractSpinBox.UpDownArrows)
		self.multa_base = QtWidgets.QDoubleSpinBox(); self.multa_base.setRange(0,100000); self.multa_base.setDecimals(2); self.multa_base.setValue(100.00); self.multa_base.setButtonSymbols(QtWidgets.QAbstractSpinBox.UpDownArrows)
		self.reembolsavel = QtWidgets.QCheckBox("Bilhete reembolsável")
		self.reembolsavel.setChecked(False)

		form.addRow("Classe:", self.classe)
		form.addRow("Bagagem:", self.bagagem)
		form.addRow("Pagamento:", self.pagamento)
		form.addRow("Parcelas máx:", self.parcelas)
		form.addRow("Multa base (USD):", self.multa_base)
		form.addRow("", self.reembolsavel)

		self.family_name = QtWidgets.QLineEdit()
		self.family_name.setPlaceholderText("Nome da família (para cabeçalho)")
		form.addRow("Família:", self.family_name)

		# Card para form
		form_card = QtWidgets.QFrame(); form_card.setObjectName("card")
		card_layout = QtWidgets.QVBoxLayout(form_card)
		card_layout.setContentsMargins(12,12,12,12)
		params_title = QtWidgets.QLabel("Parâmetros da Cotação"); params_title.setObjectName("sectionTitle")
		card_layout.addWidget(params_title)
		card_layout.addLayout(form)

		self.btn_generate = QtWidgets.QPushButton("Gerar PDF")
		self.btn_generate.setObjectName("primaryBtn")
		self.btn_generate.clicked.connect(self.on_generate)
		QtGui.QShortcut(QtGui.QKeySequence("Ctrl+G"), self, activated=self.on_generate)
		self.btn_generate.setMaximumWidth(360)

		# v0.5 — botão Adicionar Cotação e lista
		self.btn_add_quote = QtWidgets.QPushButton("Adicionar Cotação")
		self.btn_add_quote.clicked.connect(self.on_add_quote)
		self.btn_add_quote.setVisible(self.qtd_cotacao.value() > 1)
		self.lista_cotacoes = QtWidgets.QListWidget()
		self.lista_cotacoes.setMaximumHeight(140)
		self.lista_cotacoes.itemDoubleClicked.connect(self.on_edit_quote)
		# remover via tecla Delete
		QtGui.QShortcut(QtGui.QKeySequence.Delete, self.lista_cotacoes, activated=self.on_remove_selected_quote)

		self.preview = QtWidgets.QTextEdit(); self.preview.setObjectName("console")
		self.preview.setReadOnly(True)

		central = QtWidgets.QWidget()
		layout = QtWidgets.QVBoxLayout(central)
		layout.addWidget(header_widget)
		layout.addWidget(self.input_pnr)
		layout.addWidget(form_card)
		row_actions = QtWidgets.QHBoxLayout()
		row_actions.addStretch(1)
		row_actions.addWidget(self.btn_add_quote)
		row_actions.addWidget(self.btn_generate)
		layout.addLayout(row_actions)
		layout.addWidget(self.lista_cotacoes)
		layout.addWidget(self.preview)
		self.setCentralWidget(central)

		# aplica tema inicial (escuro)
		self.settings = QtCore.QSettings("SeteMares", "Cotador")
		self.current_theme = self.settings.value("theme", "Escuro")
		self.apply_theme(self.current_theme)

		# v0.5 — estado de sessão
		self.sessao = {
			"qtdSolicitada": int(self.qtd_cotacao.value()),
			"cotacoes": [],
			"tema": ("dark" if self.current_theme == "Escuro" else "light"),
			"arquivoSaida": ""
		}
		# sinais para habilitar/visibilidade do botão
		self.qtd_cotacao.valueChanged.connect(self.on_qtd_changed)
		self.input_pnr.textChanged.connect(self.update_add_button_state)
		self.update_add_button_state()

	def theme_icons(self, is_dark: bool) -> dict:
		base = Path("assets/icons")
		def as_url(p: Path) -> str:
			try:
				return p.resolve().as_uri()
			except Exception:
				# fallback com barras normalizadas
				return str(p.resolve()).replace("\\","/")
		return {
			"spin_up": as_url(base / "arrow_up_black.svg"),
			"spin_down": as_url(base / "arrow_down_black.svg"),
			"combo": as_url(base / "chevron_down_black.svg"),
			"theme": as_url(base / ("sun.svg" if is_dark else "moon.svg"))
		}

	def get_qss(self, theme_name: str) -> str:
		is_dark = theme_name == "Escuro"
		ic = self.theme_icons(is_dark)
		bg = "#0b1220" if is_dark else "#f8fafc"
		surface = "#0f172a" if is_dark else "#ffffff"
		border = "#1f2937" if is_dark else "#e2e8f0"
		text = "#ffffff" if is_dark else "#0f172a"
		muted = "#cbd5e1"
		console_bg = "#111827"
		btn_bg = "#2563eb" if is_dark else "#0f172a"
		btn_fg = "#ffffff"
		btn_hover = "#1d4ed8" if is_dark else "#111827"
		focus = "#3b82f6"
		select_bg = "#1f2937" if is_dark else "#e0e7ff"
		select_text = "#ffffff" if is_dark else "#0f172a"
		css_tpl = Template(r"""
			#appTitle { font-size: 18px; font-weight: 700; color: $text; }
			QMainWindow { background: $bg; }
			QLabel { color: $text; }
			QLabel#sectionTitle { font-size: 14px; font-weight: 700; margin-bottom: 6px; color: $text; }
			QFrame#card { background: $surface; border: 1px solid $border; border-radius: 12px; }
			QPlainTextEdit { background: $surface; color: $text; border: 1px solid $border; border-radius: 6px; padding: 8px; font-family: Consolas, 'Courier New', monospace; }
			QTextEdit#console { background: $console_bg; color: $muted; border: 1px solid $border; border-radius: 6px; padding: 8px; }
			QLineEdit, QComboBox, QDoubleSpinBox, QSpinBox { background: $surface; color: $text; border: 1px solid $border; border-radius: 6px; padding: 6px 8px; }
			QLineEdit:focus, QComboBox:focus, QDoubleSpinBox:focus, QSpinBox:focus, QPlainTextEdit:focus { border: 2px solid $focus; }
			QComboBox QAbstractItemView { background: $surface; color: $text; border: 1px solid $border; selection-background-color: $select_bg; selection-color: $select_text; }
			QComboBox::drop-down { subcontrol-origin: padding; subcontrol-position: top right; width: 28px; border-left: 1px solid $border; background: $surface; border-top-right-radius: 6px; border-bottom-right-radius: 6px; }
			QComboBox { padding-right: 36px; }
			QComboBox::down-arrow { image: url('$combo'); width: 12px; height: 12px; margin-right: 10px; }
			QAbstractSpinBox { padding-right: 36px; }
			QAbstractSpinBox::up-button { subcontrol-origin: border; subcontrol-position: top right; width: 16px; border-left: 1px solid $border; background: $surface; border-top-right-radius: 6px; }
			QAbstractSpinBox::down-button { subcontrol-origin: border; subcontrol-position: bottom right; width: 16px; border-left: 1px solid $border; background: $surface; border-bottom-right-radius: 6px; }
			QAbstractSpinBox::up-arrow { image: url('$spin_up'); width: 10px; height: 10px; }
			QAbstractSpinBox::down-arrow { image: url('$spin_down'); width: 10px; height: 10px; }
			QPushButton#primaryBtn { background: $btn_bg; color: $btn_fg; border-radius: 10px; padding: 10px 16px; font-weight: 700; min-height: 40px; }
			QPushButton#primaryBtn:hover { background: $btn_hover; }
			QPushButton#primaryBtn:disabled { opacity: 0.55; }
			QPushButton#themeButton { background: $surface; border: 1px solid $border; border-radius: 16px; }
		""")
		return css_tpl.substitute(
			text=text, bg=bg, surface=surface, border=border, console_bg=console_bg, muted=muted,
			focus=focus, select_bg=select_bg, select_text=select_text,
			combo=ic["combo"], spin_up=ic["spin_up"], spin_down=ic["spin_down"],
			btn_bg=btn_bg, btn_fg=btn_fg, btn_hover=btn_hover,
		)

	def apply_theme(self, theme_name: str) -> None:
		# Paleta base para diálogos nativos
		pal = QtGui.QPalette()
		if theme_name == "Escuro":
			pal.setColor(QtGui.QPalette.Window, QtGui.QColor("#0b1220"))
			pal.setColor(QtGui.QPalette.WindowText, QtCore.Qt.white)
			pal.setColor(QtGui.QPalette.Base, QtGui.QColor("#0f172a"))
			pal.setColor(QtGui.QPalette.AlternateBase, QtGui.QColor("#0b1220"))
			pal.setColor(QtGui.QPalette.Text, QtCore.Qt.white)
			pal.setColor(QtGui.QPalette.Button, QtGui.QColor("#1f2937"))
			pal.setColor(QtGui.QPalette.ButtonText, QtCore.Qt.white)
			pal.setColor(QtGui.QPalette.Highlight, QtGui.QColor("#2563eb"))
			pal.setColor(QtGui.QPalette.HighlightedText, QtCore.Qt.white)
			icon = QtGui.QIcon(str(Path("assets/icons/sun.svg").resolve()))
		else:
			pal.setColor(QtGui.QPalette.Window, QtCore.Qt.white)
			pal.setColor(QtGui.QPalette.WindowText, QtCore.Qt.black)
			pal.setColor(QtGui.QPalette.Base, QtGui.QColor("#ffffff"))
			pal.setColor(QtGui.QPalette.AlternateBase, QtGui.QColor("#f8fafc"))
			pal.setColor(QtGui.QPalette.Text, QtCore.Qt.black)
			pal.setColor(QtGui.QPalette.Button, QtGui.QColor("#0f172a"))
			pal.setColor(QtGui.QPalette.ButtonText, QtCore.Qt.white)
			pal.setColor(QtGui.QPalette.Highlight, QtGui.QColor("#3b82f6"))
			pal.setColor(QtGui.QPalette.HighlightedText, QtCore.Qt.white)
			icon = QtGui.QIcon(str(Path("assets/icons/moon.svg").resolve()))
		QtWidgets.QApplication.setPalette(pal)
		self.setStyleSheet(self.get_qss(theme_name))
		self.theme_btn.setIcon(icon)
		self.theme_btn.setIconSize(QtCore.QSize(18,18))
		# Fallback se SVGs não existirem
		try:
			if self.theme_btn.icon().isNull():
				self.theme_btn.setText("☀️" if theme_name == "Escuro" else "🌙")
			else:
				self.theme_btn.setText("")
		except Exception:
			pass
		# manter tema coerente na sessão (se já inicializada)
		try:
			self.sessao["tema"] = ("dark" if self.current_theme == "Escuro" else "light")
		except Exception:
			pass

	def toggle_theme(self) -> None:
		self.current_theme = "Claro" if self.current_theme == "Escuro" else "Escuro"
		self.apply_theme(self.current_theme)
		try:
			self.settings.setValue("theme", self.current_theme)
		except Exception:
			pass

	def _cia_principal(self, trechos: List[str]) -> str:
		if not trechos:
			return "CIA"
		first = trechos[0].strip().split()
		return ''.join([ch for ch in first[0] if ch.isalpha()]).upper() if first else "CIA"

	# v0.5 — helpers de sessão
	def on_qtd_changed(self, val: int) -> None:
		self.settings.setValue("ui/qtd_cotacao", val)
		self.sessao["qtdSolicitada"] = int(val)
		self.btn_add_quote.setVisible(val > 1)
		self.update_add_button_state()

	def update_add_button_state(self) -> None:
		needs = int(self.qtd_cotacao.value()) > 1
		has_pnr = bool(self.input_pnr.toPlainText().strip())
		self.btn_add_quote.setEnabled(needs and has_pnr)
		# progresso no título do botão
		total = int(self.qtd_cotacao.value())
		atual = len(self.sessao.get("cotacoes", []))
		self.btn_add_quote.setText(f"Adicionar Cotação ({atual}/{total})")

	def snapshot_parametros(self) -> dict:
		return {
			"classe": self.classe.currentText(),
			"bagagem": self.bagagem.currentText(),
			"pagamento": self.pagamento.currentText(),
			"parcelasMax": int(self.parcelas.value()),
			"multaBaseUSD": float(self.multa_base.value()),
			"reembolsavel": bool(self.reembolsavel.isChecked()),
			"feeUSD": float(self.fee.value()),
			"incentivoUSD": float(self.incentivo_val.value()),
			"incentivoPct": float(self.incentivo_pct.value()),
			"ravPct": float(self.rav_pct.value()),
		}

	def _rota_from_decoded(self, decoded: dict) -> str:
		try:
			flights = (decoded or {}).get("flightInfo", {}).get("flights", [])
			codes = []
			for f in flights:
				codes.append(f.get("departureAirport", {}).get("iataCode", ""))
				if f is flights[-1]:
					codes.append(f.get("landingAirport", {}).get("iataCode", ""))
			return "–".join([c for c in codes if c])
		except Exception:
			return ""

	def on_add_quote(self) -> None:
		text = self.input_pnr.toPlainText()
		if int(self.qtd_cotacao.value()) <= 1 or not text.strip():
			return
		parsed = parse_pnr(text)
		# calcula totais no snapshot (congelar)
		from decimal import Decimal as _D
		calcs = compute_totals(parsed.get("tarifa","0"), parsed.get("taxas_base","0"), float(self.rav_pct.value()), str(self.fee.value()), str(self.incentivo_val.value() if self.incentivo_val.value()>0 else parsed.get("incentivo","0")))
		# decode rota/saida
		decoded = None
		try:
			from core.parser.itinerary_decoder import decode_lines as decode_itin
			decoded = decode_itin(parsed.get("trechos", []))
		except Exception:
			decoded = None
		# fallback para pnrsh quando o parser interno não retornar voos
		if not decoded or not (decoded.get("flightInfo", {}).get("flights") if isinstance(decoded, dict) else False):
			try:
				from core.parser.pnrsh_adapter import decode_segments as decode_pnrsh
				decoded_alt = decode_pnrsh(parsed.get("trechos", []))
				if decoded_alt and decoded_alt.get("flightInfo", {}).get("flights"):
					decoded = decoded_alt
			except Exception:
				pass
		rota = self._rota_from_decoded(decoded)
		saida_short = ""
		try:
			fl = (decoded or {}).get("flightInfo", {}).get("flights", [])[0]
			from datetime import datetime as _dt
			saida_short = _dt.strptime(fl.get("departureTime",""), "%Y-%m-%d %H:%M").strftime("%d/%m")
		except Exception:
			pass
		idx = len(self.sessao["cotacoes"]) + 1
		from datetime import datetime as _dt2
		key = _dt2.now().strftime("%Y%m%d-%H%M%S-") + f"{idx:02d}"
		cot = {
			"id": f"COT-{idx:02d}",
			"key": key,
			"pnrRaw": text,
			"trechos": parsed.get("trechos", []),
			"parametros": self.snapshot_parametros(),
			"totais": {
				"tarifaUSD": float(parsed.get("tarifa","0")),
				"taxasUSD": float(parsed.get("taxas_base","0")),
				"totalPorBilheteUSD": float(calcs.get("total","0")),
				"ravUSD": float(calcs.get("rav","0")),
				"taxasExibidasUSD": float(calcs.get("taxas_exibidas","0")),
			},
			"meta": {
				"titulo": "",
				"rota": rota,
				"saida": saida_short
			}
		}
		self.sessao["cotacoes"].append(cot)
		self.input_pnr.clear()
		self.lista_cotacoes.addItem(f"{cot['id']} | {rota} | Saída {saida_short}")
		self.update_add_button_state()

	def on_edit_quote(self, item: QtWidgets.QListWidgetItem) -> None:
		row = self.lista_cotacoes.row(item)
		if row < 0 or row >= len(self.sessao["cotacoes"]):
			return
		cot = self.sessao["cotacoes"][row]
		# recarrega PNR e campos (mantém demais como estão)
		self.input_pnr.setPlainText(cot.get("pnrRaw",""))
		p = cot.get("parametros", {})
		self.classe.setCurrentText(p.get("classe", self.classe.currentText()))
		self.bagagem.setCurrentText(p.get("bagagem", self.bagagem.currentText()))
		self.pagamento.setCurrentText(p.get("pagamento", self.pagamento.currentText()))
		self.parcelas.setValue(int(p.get("parcelasMax", self.parcelas.value())))
		self.multa_base.setValue(float(p.get("multaBaseUSD", self.multa_base.value())))
		self.reembolsavel.setChecked(bool(p.get("reembolsavel", self.reembolsavel.isChecked())))
		self.fee.setValue(float(p.get("feeUSD", self.fee.value())))
		self.incentivo_val.setValue(float(p.get("incentivoUSD", self.incentivo_val.value())))
		self.incentivo_pct.setValue(float(p.get("incentivoPct", self.incentivo_pct.value())))
		self.rav_pct.setValue(float(p.get("ravPct", self.rav_pct.value())))
		self.update_add_button_state()

	def on_remove_selected_quote(self) -> None:
		row = self.lista_cotacoes.currentRow()
		if row < 0:
			return
		self.lista_cotacoes.takeItem(row)
		if 0 <= row < len(self.sessao["cotacoes"]):
			self.sessao["cotacoes"].pop(row)
		# renumera IDs
		for i,c in enumerate(self.sessao["cotacoes"], start=1):
			c["id"] = f"COT-{i:02d}"
		# re-render nomes na lista
		self.lista_cotacoes.clear()
		for c in self.sessao["cotacoes"]:
			self.lista_cotacoes.addItem(f"{c['id']} | {c['meta'].get('rota','')} | Saída {c['meta'].get('saida','')}")
		self.update_add_button_state()

	def on_generate(self):
		text = self.input_pnr.toPlainText()
		if not text.strip():
			# v0.5: permitir gerar quando já houver cotações capturadas
			if int(self.qtd_cotacao.value()) <= 1 and not self.sessao.get("cotacoes"):
				QtWidgets.QMessageBox.warning(self, "PNR vazio", "Cole o PNR em texto para continuar.")
				return
		try:
			# v0.5 — verificar contagem necessária
			total_qtd = int(self.qtd_cotacao.value())
			faltam = total_qtd - (len(self.sessao["cotacoes"]) + (1 if text.strip() else 0))
			if total_qtd > 1 and faltam > 0:
				QtWidgets.QMessageBox.information(self, "Faltam cotações", f"Adicione mais {faltam} cotação(ões) ou ajuste a Qtd Cotação.")
				return
			# se há PNR atual e cabe mais 1, confirmar uso como última cotação
			if total_qtd > 1 and text.strip():
				resp_auto = QtWidgets.QMessageBox.question(self, "Incluir última?", "Usar a cotação atual como última e finalizar?", QtWidgets.QMessageBox.Yes | QtWidgets.QMessageBox.No)
				if resp_auto == QtWidgets.QMessageBox.Yes:
					self.on_add_quote()
					text = ""
			
			parsed = parse_pnr(text)
			
			# Se o parser detectar múltiplas cotações (email completo), gerar automaticamente multi-página
			if parsed.get("is_multi") and parsed.get("quotations"):
				quotes_payload = []
				for q in parsed["quotations"]:
					# Montar fare_details por cotação
					fares = q.get("fares", [])
					fare_details = []
					grand_total = Decimal("0")
					fee = Decimal(q.get("fee", "0")) if self.fee.value() == 0 else Decimal(f"{self.fee.value():.2f}")
					incentivo_manual = Decimal(f"{self.incentivo_val.value():.2f}")
					incentivo = incentivo_manual if incentivo_manual > 0 else Decimal(q.get("incentivo", "0"))
					for f in fares:
						cat_tarifa = Decimal(f.get("tarifa","0"))
						cat_taxas = Decimal(f.get("taxas","0"))
						cat_incentivo = incentivo
						if incentivo_manual == 0 and self.incentivo_pct.value() > 0:
							cat_incentivo = cat_tarifa * Decimal(self.incentivo_pct.value()) / Decimal(100)
						calcs = compute_totals(str(cat_tarifa), str(cat_taxas), float(self.rav_pct.value()), str(fee), str(cat_incentivo))
						total_cat = Decimal(calcs["total"])
						fare_details.append({"label": f.get("category",""), "total": f"{total_cat:.2f}"})
						grand_total += total_cat
					# Decodificar trechos de cada bloco
					decoded = None
					try:
						from core.parser.itinerary_decoder import decode_lines as decode_itin
						decoded = decode_itin(q.get("trechos", []))
					except Exception:
						decoded = None
					if not decoded or not (decoded.get("flightInfo", {}).get("flights") if isinstance(decoded, dict) else False):
						try:
							from core.parser.pnrsh_adapter import decode_segments as decode_pnrsh
							decoded_alt = decode_pnrsh(q.get("trechos", []))
							if decoded_alt and decoded_alt.get("flightInfo", {}).get("flights"):
								decoded = decoded_alt
						except Exception:
							pass
					# labels de saída/destino e rota
					destino_label = ""
					saida_label = ""
					saida_label_full = ""
					rota_label = self._rota_from_decoded(decoded)
					try:
						flights = (decoded or {}).get("flightInfo", {}).get("flights", [])
						first_f = flights[0] if flights else None
						if first_f:
							desc = first_f.get("landingAirport", {}).get("description", "")
							if "), " in desc:
								parts = desc.split("), ", 1)[-1]
								_normalized = ", ".join([p.strip().title() for p in parts.split(",")])
								destino_label = _normalized
							dep = first_f.get("departureTime", "")
							from datetime import datetime as _dt
							dt = _dt.strptime(dep, "%Y-%m-%d %H:%M")
							from babel.dates import format_date as _format_date
							_saida = _format_date(dt.date(), format="d 'de' MMMM", locale="pt_BR")
							if " de " in _saida:
								_dia, _mes = _saida.split(" de ", 1)
								saida_label_full = f"{_dia} de {_mes.capitalize()}"
							else:
								saida_label_full = _saida
							saida_label = dt.strftime("%d/%m")
					except Exception:
						pass
					quotes_payload.append({
						"cia": get_airline_name(self._cia_principal(q.get("trechos", []))),
						"decoded": decoded,
						"classe": self.classe.currentText(),
						"currency": q.get("currency","USD"),
						"bagagem": (q.get("bagagem_hint") or self.bagagem.currentText()),
						"pagamento": (q.get("pagamento_hint") or (f"Em até {self.parcelas.value()}x no cartão de crédito, taxas à vista" if self.pagamento.currentIndex()==0 else self.pagamento.currentText())),
						"multa_text": f"USD {self.multa_base.value():.2f} + diferença tarifária, caso houver.",
						"reembolso_text": ("Bilhete reembolsável." if self.reembolsavel.isChecked() else "Bilhete não reembolsável."),
						"classe_label": self.classe.currentText(),
						"family_name": self.family_name.text().strip(),
						"logo_src": str(Path("Arquivos/Modelos/Logo.png").resolve().as_uri()),
						"fare_details": fare_details,
						"grand_total": f"{grand_total:.2f}",
						"total": f"{grand_total:.2f}",
						"destino": destino_label,
						"rota_label": rota_label,
						"saida_label": saida_label,
						"saida_label_full": saida_label_full,
					})
				# salvar
				now = datetime.now()
				default_name = f"cotacoes_{now.strftime('%Y%m%d')}_{now.strftime('%H%M')}.pdf"
				out_path, _ = QtWidgets.QFileDialog.getSaveFileName(self, "Salvar PDF", default_name, "PDF (*.pdf)")
				if not out_path:
					return
				self.sessao["arquivoSaida"] = out_path
				# Render multi
				self.btn_generate.setDisabled(True)
				self.btn_generate.setText("Gerando PDF…")
				QtWidgets.QApplication.setOverrideCursor(QtCore.Qt.WaitCursor)
				try:
					from pdf.generator import render_multi_pdf as _render_multi
					# montar summary simples
					summary_rows = []
					for i, qp in enumerate(quotes_payload, start=1):
						summary_rows.append({
							"id": f"Q{i:02d}",
							"rota": qp.get("rota_label",""),
							"saida": qp.get("saida_label",""),
							"classe": qp.get("classe_label",""),
							"total": qp.get("total","0.00"),
						})
					summary_payload = {
						"rows": summary_rows,
						"soma": f"{sum([Decimal(x.get('total','0') or '0') for x in quotes_payload]):.2f}",
						"currency": parsed.get("currency","USD"),
					}
					asyncio.run(_render_multi(quotes_payload, summary_payload, template_dir="templates", out_pdf=out_path))
					self.preview.setPlainText(f"PDF gerado em: {out_path}\n")
					resp = QtWidgets.QMessageBox.question(self, "Abrir PDF", "Abrir o PDF gerado agora?", QtWidgets.QMessageBox.Yes | QtWidgets.QMessageBox.No)
					if resp == QtWidgets.QMessageBox.Yes:
						QtGui.QDesktopServices.openUrl(QtCore.QUrl.fromLocalFile(out_path))
				finally:
					QtWidgets.QApplication.restoreOverrideCursor()
					self.btn_generate.setDisabled(False)
					self.btn_generate.setText("Gerar PDF")
				return

			# v1.1: Múltiplas tarifas (cotação única)
			fares = parsed.get("fares", [])
			fare_details = []
			grand_total = Decimal("0")

			# Usar a primeira tarifa como base para retrocompatibilidade
			tarifa = Decimal(parsed.get("tarifa", "0"))
			taxas_base = Decimal(parsed.get("taxas_base", "0"))
			
			fee = Decimal(parsed.get("fee", "0")) if self.fee.value() == 0 else Decimal(f"{self.fee.value():.2f}")
			# Incentivo: preferir valor manual; caso contrário usar do parse (valor fixo tem prioridade)
			incentivo_manual = Decimal(f"{self.incentivo_val.value():.2f}")
			if incentivo_manual > 0:
				incentivo = incentivo_manual
			else:
				incentivo = Decimal(parsed.get("incentivo", "0"))
			# Incentivo % manual (aplicado se valor ainda zero)
			if incentivo == 0 and self.incentivo_pct.value() > 0:
				incentivo = tarifa * Decimal(self.incentivo_pct.value()) / Decimal(100)

			# Se houver múltiplas tarifas, calcula cada uma
			if fares:
				labels = {"ADT": "Adulto", "CHD": "Infantil", "INF": "Bebê"}
				for f in fares:
					cat_tarifa = Decimal(f["tarifa"])
					cat_taxas = Decimal(f["taxas"])
					# Recalcula incentivo % por tarifa, se aplicável
					cat_incentivo = incentivo
					if incentivo_manual == 0 and self.incentivo_pct.value() > 0:
						cat_incentivo = cat_tarifa * Decimal(self.incentivo_pct.value()) / Decimal(100)
					
					calcs = compute_totals(str(cat_tarifa), str(cat_taxas), float(self.rav_pct.value()), str(fee), str(cat_incentivo))
					total_cat = Decimal(calcs["total"])
					fare_details.append({
						"label": labels.get(f["category"], f["category"]),
						"total": f"{total_cat:.2f}",
					})
					grand_total += total_cat
			
			# payload para o template
			data = {
				"cia": get_airline_name(self._cia_principal(parsed.get("trechos", []))),
				"trechos": parsed.get("trechos", []),
				"currency": parsed.get("currency", "USD"),
				"bagagem": self.bagagem.currentText(),
				"pagamento": (f"Em até {self.parcelas.value()}x no cartão de crédito, taxas à vista" if self.pagamento.currentIndex()==0 else self.pagamento.currentText()),
				"multa_text": f"USD {self.multa_base.value():.2f} + diferença tarifária, caso houver.",
				"reembolso_text": ("Bilhete reembolsável." if self.reembolsavel.isChecked() else "Bilhete não reembolsável."),
				"classe": self.classe.currentText(),
				"family_name": self.family_name.text().strip(),
				"logo_src": str(Path("Arquivos/Modelos/Logo.png").resolve().as_uri()),
				"fare_details": fare_details,
				"grand_total": f"{grand_total:.2f}",
				# Dados legados para template de cotação única
				"total": f"{grand_total:.2f}" if fare_details else compute_totals(str(tarifa), str(taxas_base), float(self.rav_pct.value()), str(fee), str(incentivo))["total"],
			}

			# Ajuste de multa baseado no parser
			try:
				multa_parsed = Decimal(parsed.get("multa", "0"))
				if multa_parsed > 0:
					self.multa_base.setValue(float(multa_parsed))
			except Exception:
				pass

			# Validação básica dos críticos
			if not fares and (tarifa <= 0 or taxas_base < 0):
				QtWidgets.QMessageBox.critical(self, "Dados insuficientes", "Não foi possível identificar 'tarifa' e/ou 'taxas'. Revise o texto do PNR.")
				return
			if fares and not all(Decimal(f.get("tarifa", 0)) > 0 for f in fares):
				QtWidgets.QMessageBox.critical(self, "Dados insuficientes", "Uma ou mais tarifas não foram identificadas corretamente.")
				return

			cia = self._cia_principal(parsed.get("trechos", []))
			
			# Decodificação (continua como antes)
			decoded = None
			try:
				from core.parser.itinerary_decoder import decode_lines as decode_itin
				decoded = decode_itin(parsed.get("trechos", []))
			except Exception:
				decoded = None
			# fallback pnrsh
			if not decoded or not (decoded.get("flightInfo", {}).get("flights") if isinstance(decoded, dict) else False):
				try:
					from core.parser.pnrsh_adapter import decode_segments as decode_pnrsh
					decoded_alt = decode_pnrsh(parsed.get("trechos", []))
					if decoded_alt and decoded_alt.get("flightInfo", {}).get("flights"):
						decoded = decoded_alt
				except Exception:
					pass
			now = datetime.now()
			default_name = f"cotacao_{cia}_{now.strftime('%Y%m%d')}_{now.strftime('%H%M%S')}.pdf"
			out_path, _ = QtWidgets.QFileDialog.getSaveFileName(self, "Salvar PDF", default_name, "PDF (*.pdf)")
			if not out_path:
				return
			self.sessao["arquivoSaida"] = out_path

			pagto_text = (f"Em até {self.parcelas.value()}x no cartão de crédito, taxas à vista" if self.pagamento.currentIndex()==0 else self.pagamento.currentText())
			multa_text = f"USD {self.multa_base.value():.2f} + diferença tarifária, caso houver."
			reembolso_text = ("Bilhete reembolsável." if self.reembolsavel.isChecked() else "Bilhete não reembolsável.")
			# destino cidade/país a partir do PRIMEIRO trecho (destino inicial da jornada)
			destino_label = ""
			try:
				flights = (decoded or {}).get("flightInfo", {}).get("flights", [])
				first_f = flights[0] if flights else None
				if first_f:
					desc = first_f.get("landingAirport", {}).get("description", "")
					if "), " in desc:
						parts = desc.split("), ", 1)[-1]
						# normaliza capitalização e espaço após vírgula
						_normalized = ", ".join([p.strip().title() for p in parts.split(",")])
						destino_label = _normalized
			except Exception:
				pass

			# saída label (DDMMM) do primeiro trecho + versão extensa
			saida_label = ""
			saida_label_full = ""
			try:
				first = (decoded or {}).get("flightInfo", {}).get("flights", [])[0]
				dep = first.get("departureTime", "")  # 'YYYY-MM-DD HH:MM'
				from datetime import datetime as _dt
				dt = _dt.strptime(dep, "%Y-%m-%d %H:%M")
				from babel.dates import format_date as _format_date
				_saida = _format_date(dt.date(), format="d 'de' MMMM", locale="pt_BR")
				if " de " in _saida:
					_dia, _mes = _saida.split(" de ", 1)
					saida_label_full = f"{_dia} de {_mes.capitalize()}"
				else:
					saida_label_full = _saida
				# curto dd/mm (fallback se for necessário em templates futuros)
				saida_label = dt.strftime("%d/%m")
			except Exception:
				pass

			# Atualiza payload com dados decodificados
			try:
				data.update({
					"decoded": decoded,
					"destino": destino_label,
					"saida_label": saida_label,
					"saida_label_full": saida_label_full,
				})
			except Exception:
				pass

			# v0.5 — construir lista de páginas quando qtd>1
			quotes_payload = []
			if int(self.qtd_cotacao.value()) > 1:
				# montar a partir dos snapshots
				for c in self.sessao["cotacoes"]:
					# reparse PNR para decoded e cia
					c_parsed = parse_pnr(c.get("pnrRaw",""))
					c_decoded = None
					try:
						from core.parser.itinerary_decoder import decode_lines as decode_itin
						c_decoded = decode_itin(c_parsed.get("trechos", []))
					except Exception:
						c_decoded = None
					# fallback pnrsh
					if not c_decoded or not (c_decoded.get("flightInfo", {}).get("flights") if isinstance(c_decoded, dict) else False):
						try:
							from core.parser.pnrsh_adapter import decode_segments as decode_pnrsh
							c_alt = decode_pnrsh(c_parsed.get("trechos", []))
							if c_alt and c_alt.get("flightInfo", {}).get("flights"):
								c_decoded = c_alt
						except Exception:
							pass
					cia_code = self._cia_principal(c_parsed.get("trechos", []))
					cia_name = get_airline_name(cia_code)
					# labels
					_saida_label_full = ""
					try:
						first = (c_decoded or {}).get("flightInfo", {}).get("flights", [])[0]
						from datetime import datetime as _dt
						dt = _dt.strptime(first.get("departureTime",""), "%Y-%m-%d %H:%M")
						from babel.dates import format_date as _format_date
						_saida_label_full = _format_date(dt.date(), format="d 'de' MMMM", locale="pt_BR")
					except Exception:
						pass
					quotes_payload.append({
						"cia": cia_name,
						"decoded": c_decoded,
						"classe": c.get("parametros",{}).get("classe",""),
						"currency": c_parsed.get("currency","USD"),
						"total": f"{c.get('totais',{}).get('totalPorBilheteUSD',0):.2f}",
						"bagagem": c.get("parametros",{}).get("bagagem",""),
						"pagamento": c.get("parametros",{}).get("pagamento",""),
						"multa_text": f"USD {c.get('parametros',{}).get('multaBaseUSD',0):.2f} + diferença tarifária, caso houver.",
						"reembolso_text": ("Bilhete reembolsável." if c.get("parametros",{}).get("reembolsavel",False) else "Bilhete não reembolsável."),
						"multa_base": f"{c.get('parametros',{}).get('multaBaseUSD',0):.2f}",
						"family_name": self.family_name.text().strip(),
						"destino": destino_label,
						"saida_label_full": _saida_label_full,
						"logo_src": str(Path("Arquivos/Modelos/Logo.png").resolve().as_uri()),
					})
				# summary rows
				summary_rows = []
				for c in self.sessao["cotacoes"]:
					summary_rows.append({
						"id": c.get("id",""),
						"rota": c.get("meta",{}).get("rota",""),
						"saida": c.get("meta",{}).get("saida",""),
						"classe": c.get("parametros",{}).get("classe",""),
						"total": f"{c.get('totais',{}).get('totalPorBilheteUSD',0):.2f}",
					})
				summary_payload = {
					"rows": summary_rows,
					"soma": f"{sum([c.get('totais',{}).get('totalPorBilheteUSD',0) for c in self.sessao['cotacoes']]):.2f}",
					"currency": parsed.get("currency","USD"),
				}

			# Renderizar PDF (estado de loading)
			self.btn_generate.setDisabled(True)
			self.btn_generate.setText("Gerando PDF…")
			QtWidgets.QApplication.setOverrideCursor(QtCore.Qt.WaitCursor)
			try:
				if int(self.qtd_cotacao.value()) > 1:
					from pdf.generator import render_multi_pdf as _render_multi
					asyncio.run(_render_multi(quotes_payload, summary_payload, template_dir="templates", out_pdf=out_path))
				else:
					asyncio.run(render_pdf(data, template_dir="templates", out_pdf=out_path))
				self.preview.setPlainText(f"PDF gerado em: {out_path}\n")
				# PDF gerado com sucesso - não abre automaticamente
				QtWidgets.QMessageBox.information(self, "PDF Gerado", f"PDF salvo com sucesso em:\n{out_path}")
			finally:
				QtWidgets.QApplication.restoreOverrideCursor()
				self.btn_generate.setDisabled(False)
				self.btn_generate.setText("Gerar PDF")

			# v0.5 — salvar log da sessão
			try:
				from datetime import datetime as _ts
				stamp = _ts.now()
				log_dir = Path("logs")/"cotacoes"/stamp.strftime("%Y")/stamp.strftime("%m")/stamp.strftime("%d")
				log_dir.mkdir(parents=True, exist_ok=True)
				out_json = log_dir/(stamp.strftime("%Y%m%d_%H%M%S")+f"_qtd{self.sessao['qtdSolicitada']}.json")
				import json
				json.dump(self.sessao, open(out_json, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
			except Exception:
				pass
		except Exception as e:
			QtWidgets.QMessageBox.critical(self, "Erro", f"Falha ao gerar PDF: {e}")

	def on_generate_docx(self):
		# Removido da v1.0
		QtWidgets.QMessageBox.information(self, "Indisponível", "Geração via DOCX foi descontinuada nesta versão. Use 'Gerar PDF'.")


def main():
	app = QtWidgets.QApplication([])
	try:
		QtWidgets.QApplication.setStyle("Fusion")
	except Exception:
		pass
	w = MainWindow()
	w.show()
	app.exec()


if __name__ == "__main__":
	main()
