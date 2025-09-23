from __future__ import annotations

from typing import Dict

_AIRPORTS: Dict[str, str] = {
	"GRU": "Guarulhos International Airport (GRU), São Paulo, Brazil",
	"CDG": "Charles de Gaulle Airport (CDG), Paris, France",
	"HND": "Haneda Airport (HND), Tokyo, Japan",
	"LIS": "Humberto Delgado Airport (LIS), Lisbon, Portugal",
	"FCO": "Leonardo da Vinci–Fiumicino Airport (FCO), Rome, Italy",
	"MIA": "Miami International Airport (MIA), Miami, USA",
	"MAD": "Adolfo Suárez Madrid–Barajas Airport (MAD), Madrid, Spain",
	"BCN": "Barcelona–El Prat Airport (BCN), Barcelona, Spain",
	"SCL": "Arturo Merino Benítez Intl (SCL), Santiago, Chile",
	"GVA": "Geneva Airport (GVA), Geneva, Switzerland",
	"ATL": "Hartsfield–Jackson Atlanta International Airport (ATL), Atlanta, USA",
	"BOS": "Logan International Airport (BOS), Boston, USA",
}


def get_airport_description(iata_code: str) -> str:
	code = (iata_code or "").upper().strip()
	return _AIRPORTS.get(code, f"{code}")
