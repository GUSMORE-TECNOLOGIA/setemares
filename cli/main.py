from decimal import Decimal, ROUND_HALF_UP
import json
import sys
import re
from typing import Dict, Any, List


def money(value: Decimal | str | float) -> Decimal:
	raw = str(value).strip()
	# Normalização de separadores de milhar/decimal
	if "," in raw and "." in raw:
		# Decide pelo último separador como decimal
		if raw.rfind(",") > raw.rfind("."):
			# Formato BR: 22.286,00 -> 22286.00
			norm = raw.replace(".", "").replace(",", ".")
		else:
			# Formato US: 22,286.00 -> 22286.00
			norm = raw.replace(",", "")
	elif "," in raw:
		# Provável decimal com vírgula
		norm = raw.replace(".", "").replace(",", ".")
	else:
		# Apenas ponto como decimal ou inteiro
		norm = raw
	val = Decimal(norm)
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


def _parse_single(text: str) -> Dict[str, Any]:
	# Detectar moeda no texto
	currency = "USD"
	if re.search(r"\bEUR\b|€", text, flags=re.I):
		currency = "EUR"
	elif re.search(r"\bBRL\b|R\$", text, flags=re.I):
		currency = "BRL"

	ccy_opt = r"(?:usd|eur|brl|US\$|R\$|€)?"
	ccy_req = r"(?:usd|eur|brl|US\$|R\$|€)"
	
	# v1.1: Capturar múltiplas tarifas (categorias diversas)
	fares = []
	fare_pattern = re.compile(
		rf"tarifa\s*{ccy_opt}\s*([\d.,]+)\s*\+\s*(?:txs?|taxas?)\s*{ccy_opt}\s*([\d.,]+)\s*(\*.*)?$",
		flags=re.I | re.M
	)
	for match in fare_pattern.finditer(text):
		tarifa, taxas, suffix = match.groups()
		suffix = (suffix or "").strip().lstrip("*")
		category = suffix or "ADT"
		# Normalizações simples
		low = category.lower()
		if "chd" in low or "child" in low:
			category = "CHD"
		elif "inf" in low:
			category = "INF"
		fares.append({
			"category": category,
			"tarifa": str(money(tarifa)),
			"taxas": str(money(taxas)),
		})

	# Compat: usa primeira tarifa
	tarifa = money(fares[0]["tarifa"] if fares else "0")
	taxas_base = money(fares[0]["taxas"] if fares else "0")

	fee = _extract_amount(rf"(?:fee|du|taxa de serviço)\s*{ccy_opt}\s*([\d.,]+)", text)

	# Percentual tem prioridade quando presente
	inc_pct_match = re.search(r"(?:in|incentivo|bonus|inc)\s*([\d.,]+)\s*%", text, flags=re.I)
	inc_pct = Decimal(str(inc_pct_match.group(1)).replace(",", ".")) if inc_pct_match else Decimal("0")
	# Valor fixo exige moeda explícita
	inc_val = _extract_amount(rf"(?:in|incentivo|bonus|inc)\s*{ccy_req}\s*([\d.,]+)", text)

	# Multa
	multa_match = re.search(rf"troca\s*{ccy_opt}\s*([\d.,]+)", text, flags=re.I)
	multa = money(multa_match.group(1)) if multa_match else Decimal("0")

	# Incentivo: valor fixo tem prioridade
	incentivo = inc_val if inc_val > 0 else (tarifa * inc_pct / Decimal(100))

	# Trechos
	trechos: List[str] = re.findall(r"^\s*[A-Z0-9]{2}\s*\d{2,4}.*$", text, flags=re.I | re.M)

	# Hints adicionais
	pagto_match = re.search(r"pagto\s*([^\n\r]+)", text, flags=re.I)
	pagamento_hint = pagto_match.group(1).strip() if pagto_match else ""
	bag_lines = re.findall(r"^\s*\d+pc\s*[^\r\n]*$", text, flags=re.I | re.M)
	bagagem_hint = " / ".join([b.strip() for b in bag_lines]) if bag_lines else ""

	return {
		"tarifa": str(tarifa),
		"taxas_base": str(taxas_base),
		"fares": fares,
		"fee": str(money(fee)),
		"incentivo": str(money(incentivo)),
		"trechos": trechos,
		"multa": str(money(multa)),
		"currency": currency,
		"pagamento_hint": pagamento_hint,
		"bagagem_hint": bagagem_hint,
	}


def parse(text: str) -> Dict[str, Any]:
	# Detecta múltiplas cotações separadas por linhas '=='
	blocks = [b.strip() for b in re.split(r"^\s*==+\s*$", text, flags=re.M) if b.strip()]
	if len(blocks) > 1:
		quotations = []
		for b in blocks:
			q = _parse_single(b)
			# Ignorar blocos vazios (sem trechos e sem tarifas)
			if q.get("trechos") or q.get("fares"):
				quotations.append(q)
		# Compat: expõe dados do primeiro bloco (se existir)
		if quotations:
			first = quotations[0]
			result = dict(first)
			result["quotations"] = quotations
			result["is_multi"] = True
			return result
		# Se por algum motivo não classificou, cai no parse simples
	return _parse_single(text)


if __name__ == "__main__":
	source = sys.stdin.read()
	print(json.dumps(parse(source), ensure_ascii=False, indent=2))
