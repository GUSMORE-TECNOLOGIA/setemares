from decimal import Decimal, ROUND_HALF_UP
from typing import Dict


def q2(value: Decimal | str | float) -> Decimal:
	return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def compute_totals(tarifa: str | float | Decimal, taxas_base: str | float | Decimal, rav_percent: int | float, fee: str | float | Decimal, incentivo: str | float | Decimal) -> Dict[str, str]:
	"""Calcula RAV, taxas exibidas, comissão (lucro) e total por bilhete.

	Regras:
	- RAV = tarifa_base * (rav_percent/100)
	- Comissão (lucro) = RAV + fee + incentivo
	- Taxas exibidas = taxas_base + Comissão
	- Total = tarifa_base + taxas_exibidas
	- Arredondamento: 2 casas, ROUND_HALF_UP
	"""
	tarifa_d = Decimal(str(tarifa))
	taxas_base_d = Decimal(str(taxas_base))
	fee_d = Decimal(str(fee))
	incentivo_d = Decimal(str(incentivo))

	rav = q2(tarifa_d * Decimal(rav_percent) / Decimal(100))
	comissao = q2(rav + fee_d + incentivo_d)
	taxas_exibidas = q2(taxas_base_d + comissao)
	total = q2(tarifa_d + taxas_exibidas)

	return {
		"rav": str(rav),
		"comissao": str(comissao),
		"taxas_exibidas": str(taxas_exibidas),
		"total": str(total),
	}
