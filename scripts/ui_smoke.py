from PySide6 import QtWidgets
from typing import List

from ui.app import MainWindow


def main() -> None:
	app = QtWidgets.QApplication([])
	w = MainWindow()
	central = w.centralWidget()
	if central is None:
		print("centralWidget: None")
		return
	layout = central.layout()
	print(f"centralWidget: {type(central).__name__}")
	print(f"layout: {type(layout).__name__ if layout else 'None'}")
	children: List[QtWidgets.QWidget] = central.findChildren(QtWidgets.QWidget)
	print(f"children_count: {len(children)}")
	for i, ch in enumerate(children[:20], start=1):
		print(f" - {i}: {type(ch).__name__} objectName={ch.objectName()!r}")
	# não entra no loop principal; apenas valida estrutura


if __name__ == "__main__":
	main()
