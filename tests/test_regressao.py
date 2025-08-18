import json
from pathlib import Path
from cli.main import parse
from core.rules.pricing import compute_totals

BASE = Path("data")


def _calc_from_pnr(text: str, rav_percent: float = 10.0):
	parsed = parse(text)
	tarifa = parsed["tarifa"]
	taxas_base = parsed["taxas_base"]
	fee = parsed["fee"]
	incentivo = parsed["incentivo"]
	return parsed, compute_totals(tarifa, taxas_base, rav_percent, fee, incentivo)


def test_A_fee():
	text = (BASE / "pnr_A_fee.txt").read_text(encoding="utf-8")
	parsed, calc = _calc_from_pnr(text)
	assert parsed["fee"] != "0.00"
	assert float(calc["total"]) > 0


def test_B_sem_fee():
	text = (BASE / "pnr_B_sem_fee.txt").read_text(encoding="utf-8")
	parsed, calc = _calc_from_pnr(text)
	assert parsed["fee"] == "0.00"
	assert float(calc["total"]) > 0


def test_C_incentivo_pct():
	text = (BASE / "pnr_C_incentivo_pct.txt").read_text(encoding="utf-8")
	parsed, calc = _calc_from_pnr(text)
	assert float(parsed["incentivo"]) > 0


def test_D_incentivo_usd():
	text = (BASE / "pnr_D_incentivo_usd.txt").read_text(encoding="utf-8")
	parsed, calc = _calc_from_pnr(text)
	assert parsed["incentivo"] == "40.00"


def test_E_multitrechos():
	text = (BASE / "pnr_E_multitrechos.txt").read_text(encoding="utf-8")
	parsed, calc = _calc_from_pnr(text)
	assert len(parsed["trechos"]) >= 2


def test_F_sem_blocos():
	text = (BASE / "pnr_F_sem_blocos.txt").read_text(encoding="utf-8")
	parsed, calc = _calc_from_pnr(text)
	assert float(calc["total"]) > 0
