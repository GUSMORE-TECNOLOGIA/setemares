from PySide6 import QtWidgets, QtCore
from decimal import Decimal
import asyncio
from datetime import datetime
from typing import List

from cli.main import parse as parse_pnr
from core.rules.pricing import compute_totals
from pdf.generator import render_pdf


class MainWindow(QtWidgets.QMainWindow):
	def __init__(self):
		super().__init__()
		self.setWindowTitle("7Mares Cotador — MVP")
		self.resize(900, 700)

		# Widgets principais
		self.input_pnr = QtWidgets.QPlainTextEdit()
		self.input_pnr.setPlaceholderText("Cole aqui o PNR em texto...")

		form = QtWidgets.QFormLayout()
		self.rav_pct = QtWidgets.QDoubleSpinBox()
		self.rav_pct.setRange(0, 100)
		self.rav_pct.setDecimals(2)
		self.rav_pct.setValue(10.0)  # default confirmado

		self.fee = QtWidgets.QDoubleSpinBox()
		self.fee.setRange(0, 1_000_000)
		self.fee.setDecimals(2)

		self.incentivo_val = QtWidgets.QDoubleSpinBox()
		self.incentivo_val.setRange(0, 1_000_000)
		self.incentivo_val.setDecimals(2)

		self.incentivo_pct = QtWidgets.QDoubleSpinBox()
		self.incentivo_pct.setRange(0, 100)
		self.incentivo_pct.setDecimals(2)

		form.addRow("RAV %:", self.rav_pct)
		form.addRow("Fee (USD):", self.fee)
		form.addRow("Incentivo (USD):", self.incentivo_val)
		form.addRow("Incentivo %:", self.incentivo_pct)

		self.btn_generate = QtWidgets.QPushButton("Gerar PDF")
		self.btn_generate.clicked.connect(self.on_generate)

		self.preview = QtWidgets.QTextEdit()
		self.preview.setReadOnly(True)

		central = QtWidgets.QWidget()
		layout = QtWidgets.QVBoxLayout(central)
		layout.addWidget(self.input_pnr)
		layout.addLayout(form)
		layout.addWidget(self.btn_generate)
		layout.addWidget(self.preview)
		self.setCentralWidget(central)

	def _cia_principal(self, trechos: List[str]) -> str:
		if not trechos:
			return "CIA"
		first = trechos[0].strip().split()
		return ''.join([ch for ch in first[0] if ch.isalpha()]).upper() if first else "CIA"

	def on_generate(self):
		text = self.input_pnr.toPlainText()
		if not text.strip():
			QtWidgets.QMessageBox.warning(self, "PNR vazio", "Cole o PNR em texto para continuar.")
			return
		try:
			parsed = parse_pnr(text)
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

			# Validação básica dos críticos
			if tarifa <= 0 or taxas_base < 0:
				QtWidgets.QMessageBox.critical(self, "Dados insuficientes", "Não foi possível identificar 'tarifa' e/ou 'taxas'. Revise o texto do PNR.")
				return

			calcs = compute_totals(str(tarifa), str(taxas_base), float(self.rav_pct.value()), str(fee), str(incentivo))
			cia = self._cia_principal(parsed.get("trechos", []))
			now = datetime.now()
			default_name = f"cotacao_{cia}_{now.strftime('%Y%m%d')}_{now.strftime('%H%M')}.pdf"
			out_path, _ = QtWidgets.QFileDialog.getSaveFileName(self, "Salvar PDF", default_name, "PDF (*.pdf)")
			if not out_path:
				return

			data = {
				"cia": cia,
				"trechos": parsed.get("trechos", []),
				"tarifa": parsed.get("tarifa", "0.00"),
				"fee": str(fee),
				"incentivo": str(incentivo),
				"rav": calcs["rav"],
				"taxas_exibidas": calcs["taxas_exibidas"],
				"total": calcs["total"],
				"bagagem": "",
				"pagamento": "",
				"condicoes": "",
			}

			# Renderizar PDF (bloqueante simples no MVP)
			asyncio.run(render_pdf(data, template_dir="templates", out_pdf=out_path))
			self.preview.setPlainText(
				f"PDF gerado com sucesso em: {out_path}\n\n" \
				f"CIA: {cia}\nTarifa: USD {data['tarifa']}\nRAV: USD {data['rav']}\nFee: USD {data['fee']}\n" \
				f"Incentivo: USD {data['incentivo']}\nTaxas exibidas: USD {data['taxas_exibidas']}\nTotal: USD {data['total']}\n"
			)
		except Exception as e:
			QtWidgets.QMessageBox.critical(self, "Erro", f"Falha ao gerar PDF: {e}")


def main():
	app = QtWidgets.QApplication([])
	w = MainWindow()
	w.show()
	app.exec()


if __name__ == "__main__":
	main()
