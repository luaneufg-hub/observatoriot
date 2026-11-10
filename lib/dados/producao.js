// Cadeias produtivas (IBGE 2024: PAM, PPM e PEVS, via API do Observatório).
// Gerado por scripts/retrato-producao.mjs. Cadeia de referência = produto de maior valor de produção.
import PRODUCAO from './retratos/producao-2024.json';

export { PRODUCAO };
export const AMAZONIA_LEGAL = ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO', 'MT', 'MA'];
export const FONTE_PRODUCAO = 'IBGE · PAM, PPM e PEVS 2024 (API do Observatório)';

export const cadeiaUF = (sigla) => PRODUCAO.uf[sigla]?.top?.[0]?.[0] ?? null;
export const cadeiaBioma = (id) => PRODUCAO.bioma[id]?.top?.[0]?.[0] ?? null;

/** Cadeias extrativistas somadas nos 9 estados da Amazônia Legal: [[produto, valor], ...] */
export function extrativasAmazoniaLegal(n = 6) {
  const soma = new Map();
  for (const s of AMAZONIA_LEGAL) for (const [p, v] of PRODUCAO.uf[s]?.extrativas || []) soma.set(p, (soma.get(p) || 0) + v);
  return [...soma].sort((a, b) => b[1] - a[1]).slice(0, n);
}

/** R$ em texto curto: "R$ 260,2 bi", "R$ 7,7 mi", "R$ 850 mil" */
export function reais(v) {
  if (v >= 1e9) return `R$ ${(v / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} bi`;
  if (v >= 1e6) return `R$ ${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
  if (v >= 1e3) return `R$ ${Math.round(v / 1e3).toLocaleString('pt-BR')} mil`;
  return `R$ ${Math.round(v).toLocaleString('pt-BR')}`;
}
