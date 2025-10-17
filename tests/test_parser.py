from cli.main import parse


def test_parse_basic():
	text = "tarifa usd 22286.00 + txs usd 594.00\nFee usd 50.00\nin 3%\nAF 459 14APR GRUCDG HS2 1915 #1115"
	data = parse(text)
	assert data["tarifa"] == "22286.00"
	assert data["taxas_base"] == "594.00"
	assert data["fee"] == "50.00"
	assert any(t.startswith("AF 459") for t in data["trechos"])