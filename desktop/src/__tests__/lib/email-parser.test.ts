import { describe, it, expect } from 'vitest';
import { parseEmailToOptions } from '@/lib/email-parser';
import type { ParsedEmail } from '@/lib/types/email-parser';

describe('email-parser', () => {
  describe('parseEmailToOptions - Múltiplas Opções', () => {
    it('deve parsear PNR com múltiplas opções separadas por ==', () => {
      const pnrText = `EK  262   08JAN GRUDXB   0130   2235
EK  382   09JAN DXBHKG   0330   1445
EK  303   23JAN PVGDXB   2300  #0510
EK  261   27JAN DXBGRU   0905   1735

Executiva

Tarifa USD 6500,00 + taxas USD 2539,30 

Bagagem 2 peça de 32kgs

Net/Net

pagto 9x

Multa de alteração USD 200,00

Reembolso usd 400.00

==

KL  792   08JAN GRUAMS HS1  2059  #1220 
KL  887   11JAN AMSHKG HS1  2125  #1620 
AF  111   27JAN PVGCDG HS1  2215  #0600 
AF  460   28JAN CDGGRU HS1  1030   1825 

Executiva

Tarifa USD 7729,00 + taxas USD 266,30 + Fee USD 50,00

Bagagem 2 peça de 32kgs

Net/Net

pagto 4x

Multa de alteração USD 200,00

Reembolso usd 400.00

Assentos pagos

==

QR  780   08JAN GRUDOH HS2  2025  #1555
QR  816   11JAN DOHHKG HS2  0855   2140
QR  871   27JAN PVGDOH HS2  2335  #0510
QR  773   28JAN DOHGRU HS2  0745   1655

Executiva

Tarifa USD 5875,00 + taxas USD 1320,30

Bagagem 2 peça de 32kgs

in 3%

pagto 5x

Multa de alteração USD 200,00

Reembolso usd 400.00

Assentos pagos na ida`;

      const result: ParsedEmail = parseEmailToOptions(pnrText);

      expect(result.options).toHaveLength(3);
      
      // Opção 1 - EK
      expect(result.options[0].label).toBe('Opção 1');
      expect(result.options[0].segments).toHaveLength(4);
      expect(result.options[0].fares).toHaveLength(1);
      expect(result.options[0].fares[0].baseFare).toBe(6500);
      expect(result.options[0].fares[0].baseTaxes).toBe(2539.30);
      expect(result.options[0].numParcelas).toBe(9);
      expect(result.options[0].changePenalty).toBe('USD 200.00');
      expect(result.options[0].refundable).toBe('USD 400.00');
      
      // Opção 2 - KL/AF com Fee
      expect(result.options[1].label).toBe('Opção 2');
      expect(result.options[1].fares[0].baseFare).toBe(7729);
      expect(result.options[1].fares[0].baseTaxes).toBe(266.30);
      expect(result.options[1].feeUSD).toBe(50);
      expect(result.options[1].numParcelas).toBe(4);
      
      // Opção 3 - QR com incentivo
      expect(result.options[2].label).toBe('Opção 3');
      expect(result.options[2].fares[0].baseFare).toBe(5875);
      expect(result.options[2].fares[0].baseTaxes).toBe(1320.30);
      expect(result.options[2].incentivoPercent).toBe(3);
      expect(result.options[2].numParcelas).toBe(5);
    });

    it('deve detectar incentivo percentual "in X%"', () => {
      const pnrText = `AF 459 14APR GRUCDG HS2 1915 #1115

Tarifa USD 8916.00 + TXS USD 564.00 *Exe

in 7%

pagto 4x`;

      const result = parseEmailToOptions(pnrText);
      
      expect(result.options[0].incentivoPercent).toBe(7);
    });

    it('deve detectar Fee USD', () => {
      const pnrText = `AF 459 14APR GRUCDG HS2 1915 #1115

Tarifa USD 8916.00 + TXS USD 564.00 *Exe

+ Fee USD 50,00

pagto 4x`;

      const result = parseEmailToOptions(pnrText);
      
      expect(result.options[0].feeUSD).toBe(50);
    });

    it('deve detectar multa de alteração', () => {
      const pnrText = `AF 459 14APR GRUCDG HS2 1915 #1115

Tarifa USD 8916.00 + TXS USD 564.00 *Exe

Multa de alteração USD 200,00`;

      const result = parseEmailToOptions(pnrText);
      
      expect(result.options[0].changePenalty).toBe('USD 200.00');
    });

    it('deve detectar número de parcelas', () => {
      const pnrText = `AF 459 14APR GRUCDG HS2 1915 #1115

Tarifa USD 8916.00 + TXS USD 564.00 *Exe

pagto 6x`;

      const result = parseEmailToOptions(pnrText);
      
      expect(result.options[0].numParcelas).toBe(6);
    });
  });
});

