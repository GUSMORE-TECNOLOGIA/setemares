from core.parser.itinerary_decoder import decode_lines


def test_decode_overnights_count():
	lines = [
		"AF 459 14APR GRUCDG HS2 1915 #1115",
		"AF 274 18APR CDGHND HS2 2200 #1830",
		"AF 293 05MAY HNDCDG HS2 0005 0800",
		"AF 454 07MAY CDGGRU HS2 2330 #0615",
	]
	decoded = decode_lines(lines)
	assert decoded is not None
	assert decoded["overnights"] >= 2
	assert len(decoded["flightInfo"]["flights"]) == 4
	f0 = decoded["flightInfo"]["flights"][0]
	assert f0["company"]["iataCode"] == "AF"
	assert f0["departureAirport"]["iataCode"] == "GRU"
	assert f0["landingAirport"]["iataCode"] == "CDG"
