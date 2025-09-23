from __future__ import annotations

from typing import Dict

_AIRLINES: Dict[str, str] = {
	"AF": "Air France",
	"TP": "TAP Air Portugal",
	"UX": "Air Europa",
	"IB": "Iberia",
	"LA": "LATAM Airlines",
	"AA": "American Airlines",
	"AZ": "ITA Airways",
	"KL": "KLM Royal Dutch Airlines",
	"LH": "Lufthansa",
	"TK": "Turkish Airlines",
}


def get_airline_name(iata_code: str) -> str:
	code = (iata_code or "").upper().strip()
	return _AIRLINES.get(code, code)
