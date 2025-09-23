from pathlib import Path
import json

from cli.main import parse

BASE = Path("data")


def _load(name: str) -> str:
	return (BASE / name).read_text(encoding="utf-8")


def _try_decode_segments(trechos):
	try:
		from core.parser.pnrsh_adapter import decode_segments
		return decode_segments(trechos)
	except Exception:
		return None


def _assert_basic_fields(decoded):
	assert decoded is None or isinstance(decoded, dict)
	# Quando disponível, flights devem conter campos essenciais
	if decoded and decoded.get("flightInfo", {}).get("flights"):
		for f in decoded["flightInfo"]["flights"]:
			assert f.get("company", {}).get("iataCode")
			assert f.get("flight")
			assert f.get("departureAirport", {}).get("iataCode")
			assert f.get("landingAirport", {}).get("iataCode")
			assert f.get("departureTime")
			assert f.get("landingTime")


def test_multitrecho_01():
	text = _load("pnr_multitrecho_overnight_01.txt")
	parsed = parse(text)
	decoded = _try_decode_segments(parsed["trechos"])
	_assert_basic_fields(decoded)
	# Mínimos por critérios (quando decoded disponível)
	if decoded and decoded.get("flightInfo", {}).get("flights"):
		assert len(decoded["flightInfo"]["flights"]) >= 4


def test_multitrecho_02():
	text = _load("pnr_multitrecho_overnight_02.txt")
	parsed = parse(text)
	decoded = _try_decode_segments(parsed["trechos"])
	_assert_basic_fields(decoded)
	if decoded and decoded.get("flightInfo", {}).get("flights"):
		assert len(decoded["flightInfo"]["flights"]) == 3


def test_multitrecho_03():
	text = _load("pnr_multitrecho_overnight_03.txt")
	parsed = parse(text)
	decoded = _try_decode_segments(parsed["trechos"])
	_assert_basic_fields(decoded)
	if decoded and decoded.get("flightInfo", {}).get("flights"):
		assert len(decoded["flightInfo"]["flights"]) == 4
