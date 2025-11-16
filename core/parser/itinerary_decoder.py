from __future__ import annotations

import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

# Ex.: "AF 459 14APR GRUCDG HS2 1915 #1115"
#      "AF 293 05MAY HNDCDG HS2 0005 0800"
_SEGMENT_RE = re.compile(
    r"^\s*(?P<carrier>[A-Z0-9]{2})\s+(?P<flight>\d{2,4})\s+"
    r"(?P<dep_day>\d{2})(?P<dep_mon>[A-Z]{3})\s+"
    r"(?P<orig>[A-Z]{3})(?P<dest>[A-Z]{3})\s+"
    r"(?P<class>[A-Z]{1,2}\d?)\s+"
    r"(?P<dep_time>\d{3,4})\s+(?P<arr_time>#?\d{3,4})\s*$",
    flags=re.I,
)

_MONTHS = {
    "JAN": 1, "FEB": 2, "MAR": 3, "APR": 4, "MAY": 5, "JUN": 6,
    "JUL": 7, "AUG": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12,
}


def _fmt_time(day: str, mon: str, hm: str) -> str:
    """Retorna representação textual estável: YYYY-MM-DD HH:MM sem ano real (usa ano corrente)."""
    now = datetime.now()
    hour = hm[-4:-2]
    minute = hm[-2:]
    month = _MONTHS.get(mon.upper(), now.month)
    try:
        dt = datetime(now.year, month, int(day), int(hour), int(minute))
        return dt.strftime("%Y-%m-%d %H:%M")
    except Exception:
        return f"{day}{mon} {hour}:{minute}"


def _make_dt(day: str, mon: str, hm: str) -> datetime:
    """Cria um datetime no ano corrente com base em dia, mês (MMM) e hora/minuto (HHMM)."""                                                                    
    now = datetime.now()
    # Garantir que hm tem 4 dígitos (preencher com zeros à esquerda se necessário)                                                                           
    hm_padded = hm.strip().rjust(4, "0")
    # Para "2040": [0:2] = "20" (hora), [2:4] = "40" (minuto)
    # Para "040": após rjust(4) = "0040": [0:2] = "00", [2:4] = "40"
    hour = int(hm_padded[0:2]) if len(hm_padded) >= 2 else 0
    minute = int(hm_padded[2:4]) if len(hm_padded) >= 4 else 0
    month = _MONTHS.get(mon.upper(), now.month)
    try:
        return datetime(now.year, month, int(day), hour, minute)
    except Exception:
        # fallback conservador
        return datetime(now.year, month, 1, 0, 0)


def decode_lines(lines: List[str]) -> Optional[Dict[str, Any]]:
    flights: List[Dict[str, Any]] = []
    overnight_count = 0
    for raw in lines:
        m = _SEGMENT_RE.match(raw)
        if not m:
            continue
        d = m.groupdict()
        dep_time = d["dep_time"].rjust(4, "0")
        arr_raw = d["arr_time"]
        is_overnight = arr_raw.startswith("#")
        if is_overnight:
            overnight_count += 1
            arr_time = arr_raw[1:]
        else:
            arr_time = arr_raw
        arr_time = arr_time.rjust(4, "0")

        from core.data.airports import get_airport_description
        dep_dt = _make_dt(d["dep_day"], d["dep_mon"], dep_time)
        arr_dt = _make_dt(d["dep_day"], d["dep_mon"], arr_time)
        
        # Se tem #, chegada é no dia seguinte
        if is_overnight:
            arr_dt = arr_dt + timedelta(days=1)
        # Se não tem #, mas horário de chegada é menor que o de partida e diferença > 12h, 
        # provavelmente chegou no dia seguinte (ex: partida 22:20, chegada 06:25)
        elif arr_dt < dep_dt or (arr_dt - dep_dt).total_seconds() < -12 * 3600:
            arr_dt = arr_dt + timedelta(days=1)
        flights.append({
            "company": {"iataCode": d["carrier"], "description": d["carrier"]},
            "flight": d["flight"],
            "departureTime": dep_dt.strftime("%Y-%m-%d %H:%M"),
            "landingTime": arr_dt.strftime("%Y-%m-%d %H:%M"),
            "departureAirport": {"iataCode": d["orig"], "description": get_airport_description(d["orig"])},
            "landingAirport": {"iataCode": d["dest"], "description": get_airport_description(d["dest"])},
            "overnight": is_overnight,
        })

    if not flights:
        return None

    return {
        "source": "internal-parser",
        "overnights": overnight_count,
        "flightInfo": {"flights": flights},
    }
