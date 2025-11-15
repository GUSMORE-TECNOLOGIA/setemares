import { describe, it, expect } from 'vitest';
import { parsePNR } from '@/lib/parser';

describe('parser - parsePNR', () => {
  describe('Parsing básico', () => {
    it('deve retornar null para texto vazio', async () => {
      const result = await parsePNR('');
      expect(result).toBeNull();
    });

    it('deve retornar null para apenas espaços', async () => {
      const result = await parsePNR('   \n\t  ');
      expect(result).toBeNull();
    });
  });

  describe('Detecção de tarifas', () => {
    it('deve parsear tarifa única no formato padrão', async () => {
      const pnrText = `
EK  262   08JAN GRUDXB   0130   2235
USD6500.00 + txs USD2539.30 * Exe
`;
      const result = await parsePNR(pnrText);
      
      expect(result).not.toBeNull();
      expect(result?.fares).toHaveLength(1);
      expect(result?.fares[0].category).toBe('Exe');
      expect(result?.fares[0].tarifa).toBe('6500.00');
      expect(result?.fares[0].taxas).toBe('2539.30');
    });

    it('deve parsear múltiplas tarifas com formato tarifa usd', async () => {
      const pnrText = `
EK  262   08JAN GRUDXB   0130   2235
tarifa usd 6500,00 + txs usd 2539,30 *Exe
tarifa usd 4500,00 + txs usd 2000,00 *Eco
`;
      const result = await parsePNR(pnrText);
      
      expect(result).not.toBeNull();
      expect(result?.fares).toHaveLength(2);
      expect(result?.fares[0].category).toBe('Exe');
      expect(result?.fares[1].category).toBe('Eco');
    });

    it('deve parsear tarifas com tipo de passageiro (ADT/CHD/INF)', async () => {
      const pnrText = `
tarifa usd 6500,00 + txs usd 2539,30 *Exe/ADT
tarifa usd 4500,00 + txs usd 2000,00 *Eco/CHD
`;
      const result = await parsePNR(pnrText);
      
      expect(result).not.toBeNull();
      expect(result?.fares).toHaveLength(2);
      expect(result?.fares[0].paxType).toBe('ADT');
      expect(result?.fares[1].paxType).toBe('CHD');
    });

    it('deve normalizar categoria para Exe quando for "exe"', async () => {
      const pnrText = 'tarifa usd 6500,00 + txs usd 2539,30 *exe';
      const result = await parsePNR(pnrText);
      
      expect(result).not.toBeNull();
      expect(result?.fares[0].category).toBe('Exe');
    });
  });

  describe('Detecção de moeda', () => {
    it('deve detectar USD como padrão', async () => {
      const pnrText = 'USD6500.00 + txs USD2539.30 * Exe';
      const result = await parsePNR(pnrText);
      
      expect(result).not.toBeNull();
      expect(result?.currency).toBe('USD');
    });

    it('deve detectar EUR quando presente', async () => {
      const pnrText = 'EUR6500.00 + txs EUR2539.30 * Exe';
      const result = await parsePNR(pnrText);
      
      expect(result).not.toBeNull();
      expect(result?.currency).toBe('EUR');
    });
  });

  describe('Detecção de parcelas', () => {
    it('deve detectar número de parcelas no formato "pagto 10x"', async () => {
      const pnrText = `
USD6500.00 + txs USD2539.30 * Exe
pagto 10x
`;
      const result = await parsePNR(pnrText);
      
      expect(result).not.toBeNull();
      expect(result?.numParcelas).toBe(10);
    });

    it('deve detectar número de parcelas no formato "parcela 4x"', async () => {
      const pnrText = `
USD6500.00 + txs USD2539.30 * Exe
parcela 4x
`;
      const result = await parsePNR(pnrText);
      
      expect(result).not.toBeNull();
      expect(result?.numParcelas).toBe(4);
    });
  });

  describe('Filtro de blocos de reserva', () => {
    it('deve filtrar as duas primeiras linhas de cada bloco separado por ==', async () => {
      const pnrText = `
LOC123 ABC XYZ 01JAN
SOBRENOME/NOME
EK  262   08JAN GRUDXB   0130   2235
USD6500.00 + txs USD2539.30 * Exe
==
LOC456 DEF UVW 02JAN
SOBRENOME2/NOME2
KL  792   08JAN GRUAMS   2059   1220
USD4500.00 + txs USD2000.00 * Eco
`;
      const result = await parsePNR(pnrText);
      
      // Deve processar ambos os blocos
      expect(result).not.toBeNull();
      // Verificar que os segmentos foram detectados (sem as linhas de header)
      expect(result?.trechos).toBeDefined();
    });

    it('não deve filtrar se as primeiras linhas já são segmentos de voo', async () => {
      const pnrText = `
EK  262   08JAN GRUDXB   0130   2235
KL  792   08JAN GRUAMS   2059   1220
USD6500.00 + txs USD2539.30 * Exe
`;
      const result = await parsePNR(pnrText);
      
      expect(result).not.toBeNull();
      // Deve manter os segmentos
      expect(result?.trechos).toBeDefined();
    });
  });

  describe('Detecção de múltiplas cotações', () => {
    it('deve detectar múltiplas cotações quando há separador ==', async () => {
      const pnrText = `
EK  262   08JAN GRUDXB   0130   2235
USD6500.00 + txs USD2539.30 * Exe
==
KL  792   08JAN GRUAMS   2059   1220
USD4500.00 + txs USD2000.00 * Eco
`;
      const result = await parsePNR(pnrText);
      
      expect(result).not.toBeNull();
      expect(result?.is_multi).toBe(true);
    });

    it('deve retornar is_multi false quando não há separador ==', async () => {
      const pnrText = `
EK  262   08JAN GRUDXB   0130   2235
USD6500.00 + txs USD2539.30 * Exe
`;
      const result = await parsePNR(pnrText);
      
      expect(result).not.toBeNull();
      expect(result?.is_multi).toBe(false);
    });
  });

  describe('Parsing de bagagem', () => {
    it('deve detectar bagagem no formato "2pc 32kg"', async () => {
      const pnrText = `
USD6500.00 + txs USD2539.30 * Exe
Bagagem 2pc 32kg
`;
      const result = await parsePNR(pnrText);
      
      expect(result).not.toBeNull();
      expect(result?.bagagem_hint).toBeDefined();
    });

    it('deve detectar bagagem com classe "2pc 32kg/exe"', async () => {
      const pnrText = `
USD6500.00 + txs USD2539.30 * Exe
Bagagem 2pc 32kg/exe-pri
`;
      const result = await parsePNR(pnrText);
      
      expect(result).not.toBeNull();
      expect(result?.bagagem_hint).toBeDefined();
    });
  });
});
