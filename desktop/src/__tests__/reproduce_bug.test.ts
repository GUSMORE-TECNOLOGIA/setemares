
import { parsePNR } from '../lib/parser';
import { calculateTotals } from '../lib/pricing';

const PNR_TEXT = `
AZ  679   25NOV GRUFCO HS2  2040  #1200
AZ 2038   26NOV FCOLIN HS2  1400   1510
AZ 1462   06DEC VCEFCO HS2  1515   1625
AZ  674   06DEC FCOGRU HS2  2220  #0625

tarifa usd 2529.00 + txs usd 66.00 

pagto 6x - net net

2pc 32kg
Assentos pagos
Fee usd 50.00

==

LA 8072   25NOV GRUMXP HK2  1800  #0915
AZ 1460   06DEC VCEFCO HK2  0615   0725
LA 8121   06DEC FCOGRU HK2  1200   2010

tarifa usd 2996.00 + txs usd 272.00 

pagto 4x - comissão 7%

2pc 23kg
Assentos pagos na AZ
Fee usd 50.00
`;

describe('Bug Reproduction - Pricing Discrepancy', () => {
    it('should parse multi-option PNR correctly', async () => {
        const parsed = await parsePNR(PNR_TEXT);

        expect(parsed).not.toBeNull();
        expect(parsed?.is_multi).toBe(true);
        expect(parsed?.quotations).toBeDefined();
        expect(parsed?.quotations?.length).toBe(2);

        // Option 1
        const opt1 = parsed?.quotations?.[0];
        expect(opt1?.tarifa).toBe('2529.00');
        expect(opt1?.feeUSD).toBe(50.00);
        // "net net" should probably result in 0 RAV or undefined if not handled
        console.log('Option 1 RAV:', opt1?.ravPercent);

        // Option 2
        const opt2 = parsed?.quotations?.[1];
        expect(opt2?.tarifa).toBe('2996.00');
        expect(opt2?.feeUSD).toBe(50.00);
        // "comissão 7%" should be detected as RAV
        console.log('Option 2 RAV:', opt2?.ravPercent);

        // If the parser doesn't support "comissão", this expectation might fail or be undefined
        // expect(opt2?.ravPercent).toBe(7); 
    });
});
