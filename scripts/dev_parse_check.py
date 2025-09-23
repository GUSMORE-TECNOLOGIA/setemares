from cli.main import parse
from core.parser.itinerary_decoder import decode_lines


SAMPLE = """
AF  459   14APR GRUCDG HK2  1915  #1115
AF  274   18APR CDGHND HK2  2200  #1830
AF  187   05MAY HNDCDG HK2  0905   1640
AF  454   07MAY CDGGRU HK2  2330  #0615

tarifa usd 8916.00 + txs usd 564.00 *Exe

pagto 4x - in 3%

Troca usd 400.00
Reembolso não permite
2pc 32kg/exe
"""


def main() -> None:
    parsed = parse(SAMPLE)
    print("trechos:")
    for t in parsed["trechos"]:
        print("  ", t)
    decoded = decode_lines(parsed["trechos"]) if parsed["trechos"] else None
    if not decoded:
        print("decoded: none")
        return
    flights = decoded.get("flightInfo", {}).get("flights", [])
    print(f"decoded flights: {len(flights)}")
    for f in flights:
        print(f"  {f['company']['iataCode']} {f['flight']} {f['departureAirport']['iataCode']}->{f['landingAirport']['iataCode']} {f['departureTime']} -> {f['landingTime']} overnight={f.get('overnight')}")


if __name__ == "__main__":
    main()


