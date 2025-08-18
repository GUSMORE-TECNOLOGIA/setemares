from decimal import Decimal, ROUND_HALF_UP
from typing import Dict


def q2(value: Decimal | str | float) -> Decimal:
	return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def compute_totals(tarifa: str | float | Decimal, taxas_base: str | float | Decimal, rav_percent: int | float, fee: str | float | Decimal, incentivo: str | float | Decimal) -> Dict[str, str]:
	"""Calcula RAV, taxas exibidas e total por bilhete (MVP).

	Regras (confirmadas):
	- RAV = tarifa_base * (rav_percent/100)
	- Taxas exibidas = taxas_base + RAV + fee + incentivo
	- Total = tarifa_base + taxas_exibidas
	- Arredondamento: 2 casas, ROUND_HALF_UP
	"""
	tarifa_d = Decimal(str(tarifa))
	taxas_base_d = Decimal(str(taxas_base))
	fee_d = Decimal(str(fee))
	incentivo_d = Decimal(str(incentivo))

	rav = q2(tarifa_d * Decimal(rav_percent) / Decimal(100))
	taxas_exibidas = q2(taxas_base_d + rav + fee_d + incentivo_d)
	total = q2(tarifa_d + taxas_exibidas)

	return {
		"rav": str(rav),
		"taxas_exibidas": str(taxas_exibidas),
		"total": str(total),
	}
