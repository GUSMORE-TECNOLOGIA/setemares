from PySide6 import QtWidgets, QtCore
from decimal import Decimal
import json


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

	def on_generate(self):
		# Placeholder: somente demonstração de coleta de dados
		payload = {
			"rav_percent": float(self.rav_pct.value()),
			"fee": f"{self.fee.value():.2f}",
			"incentivo_val": f"{self.incentivo_val.value():.2f}",
			"incentivo_pct": float(self.incentivo_pct.value()),
			"pnr_text": self.input_pnr.toPlainText(),
		}
		self.preview.setPlainText(json.dumps(payload, ensure_ascii=False, indent=2))


def main():
	app = QtWidgets.QApplication([])
	w = MainWindow()
	w.show()
	app.exec()


if __name__ == "__main__":
	main()
