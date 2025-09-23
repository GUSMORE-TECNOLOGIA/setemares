from core.parser.itinerary_decoder import decode_lines

def test_airport_descriptions_full_names():
	lines = [
		"TP 088 22SEP GRULIS HK1 2315 #1230",
		"TP 1903 23SEP LISFCO HK1 1405 1800",
	]
	decoded = decode_lines(lines)
	assert decoded and decoded.get("flightInfo", {}).get("flights")
	f0 = decoded["flightInfo"]["flights"][0]
	assert f0["departureAirport"]["iataCode"] == "GRU"
	assert "Guarulhos" in f0["departureAirport"]["description"]
	f1 = decoded["flightInfo"]["flights"][1]
	assert f1["landingAirport"]["iataCode"] == "FCO"
	assert "Fiumicino" in f1["landingAirport"]["description"]
