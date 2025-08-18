from core.rules.pricing import compute_totals


def test_compute_totals_basic():
	out = compute_totals("22286.00", "594.00", 10, "50.00", "0")
	assert out["rav"] == "2228.60"
	assert out["taxas_exibidas"] == "2872.60"
	assert out["total"] == "25158.60"
