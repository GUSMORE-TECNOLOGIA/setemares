from decimal import Decimal, ROUND_HALF_UP
import json
import sys
import re
from typing import Dict, Any, List


def money(value: Decimal | str | float) -> Decimal:
	val = Decimal(str(value).replace(",", "."))
	return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


GLOSSARY = {
	"fee": ["fee", "service charge", "taxa de serviço", "du"],
	"inc": ["incentivo", "in", "bonus", "inc"],
}


def _extract_amount(pattern: str, text: str) -> Decimal:
	match = re.search(pattern, text, flags=re.I)
	if match:
		return money(match.group(1))
	return Decimal("0")


def parse(text: str) -> Dict[str, Any]:
	# Capturas tolerantes em USD; números com ponto ou vírgula
	tarifa = _extract_amount(r"tarifa\s*usd\s*([\d.,]+)", text)
	taxas_base = _extract_amount(r"(?:txs?|taxas?)\s*usd\s*([\d.,]+)", text)
	fee = _extract_amount(r"(?:fee|du|taxa de serviço)\s*usd\s*([\d.,]+)", text)

	inc_val = _extract_amount(r"(?:in|incentivo|bonus|inc)\s*usd\s*([\d.,]+)", text)
	inc_pct_match = re.search(r"(?:in|incentivo|bonus|inc)\s*([\d.,]+)\s*%", text, flags=re.I)
	inc_pct = Decimal(str(inc_pct_match.group(1)).replace(",", ".")) if inc_pct_match else Decimal("0")

	# Incentivo: valor fixo tem prioridade
	incentivo = inc_val if inc_val > 0 else (tarifa * inc_pct / Decimal(100))

	# Trechos brutos (linhas que parecem voo: Cia + número + resto)
	trechos: List[str] = re.findall(r"^[A-Z0-9]{2}\s*\d{2,4}.*$", text, flags=re.I | re.M)

	return {
		"tarifa": str(money(tarifa)),
		"taxas_base": str(money(taxas_base)),
		"fee": str(money(fee)),
		"incentivo": str(money(incentivo)),
		"trechos": trechos,
	}


if __name__ == "__main__":
	source = sys.stdin.read()
	print(json.dumps(parse(source), ensure_ascii=False, indent=2))
