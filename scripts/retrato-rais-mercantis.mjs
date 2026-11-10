// RAIS 2025 com o critério do Sebrae (DataSebrae): só EMPRESAS MERCANTIS, sem administração
// pública, associações e organismos internacionais. Também separa os empregados por sexo.
//
//   cube=RAIS_workers · drilldowns=Municipality,Aggregated Company Size,Commercial Companies Indicator,Sex
//   measures=Workers,Salary Mass · include=Year:2025;Active worker indicator:1 (vínculos ativos em 31/12)
//
// Saída:
//   lib/dados/retratos/rais-mercantis-2025.json   → Brasil e UF
//   public/dados/rais/mercantis-municipio.json    → { cod: [vinculosMPE, massaMPE, vinculos, massa, mulheresMPE] }
// (vinculos e massa = total das empresas mercantis, de todos os portes)
//
// Uso: node scripts/retrato-rais-mercantis.mjs <arquivo-da-api.json> [ano] [data AAAA-MM-DD]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const UF_IBGE = {
  11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO',
  21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA',
  31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP', 41: 'PR', 42: 'SC', 43: 'RS',
  50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF',
};
const [arquivo, ano = '2025', data = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);
const j = JSON.parse(readFileSync(arquivo, 'utf8'));
const linhas = Array.isArray(j.data[0]) ? j.data.map((r) => Object.fromEntries(j.columns.map((c, i) => [c, r[i]]))) : j.data;
if (j.columns.includes('Active worker indicator ID')) console.log('(com coluna de ativos: filtrando ativos)');

const zero = () => ({ vinculosMPE: 0, massaMPE: 0, vinculos: 0, massa: 0, mulheresMPE: 0 });
const br = zero();
const uf = {};
const mun = {};
for (const r of linhas) {
  if ('Active worker indicator ID' in r && r['Active worker indicator ID'] !== 1) continue;
  if (r['Commercial Companies Indicator ID'] !== 1) continue; // só empresas mercantis
  const mpe = r['Aggregated Company Size ID'] === 1;
  const w = r.Workers || 0;
  const s = r['Salary Mass'] || 0;
  const mulher = r['Sex ID'] === 2;
  const soma = (o) => {
    o.vinculos += w;
    o.massa += s;
    if (mpe) {
      o.vinculosMPE += w;
      o.massaMPE += s;
      if (mulher) o.mulheresMPE += w;
    }
  };
  soma(br);
  const cod = r['Municipality ID'];
  const sigla = UF_IBGE[Math.floor(cod / 1e5)];
  if (!sigla) continue;
  soma((uf[sigla] ??= zero()));
  soma((mun[cod] ??= zero()));
}
const arred = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v)]));
const meta = { consulta: 'RAIS_workers · Municipality × Aggregated Company Size × Commercial Companies Indicator × Sex · vínculos ativos', criterio: 'empresas mercantis (critério DataSebrae)', ano: +ano, atualizadoEm: data };
mkdirSync('lib/dados/retratos', { recursive: true });
mkdirSync('public/dados/rais', { recursive: true });
writeFileSync('lib/dados/retratos/rais-mercantis-2025.json', JSON.stringify({ ...meta, br: arred(br), uf: Object.fromEntries(Object.entries(uf).map(([k, v]) => [k, arred(v)])) }, null, 1));
writeFileSync(
  'public/dados/rais/mercantis-municipio.json',
  JSON.stringify({ ...meta, ordem: ['vinculosMPE', 'massaMPE', 'vinculos', 'massa', 'mulheresMPE'], mun: Object.fromEntries(Object.entries(mun).map(([c, o]) => [c, Object.values(arred(o))])) }),
);
const p = (a, b) => ((a / b) * 100).toFixed(1);
console.log(`Brasil: MPE ${p(br.massaMPE, br.massa)}% da massa salarial das mercantis · ${p(br.vinculosMPE, br.vinculos)}% dos vínculos · mulheres ${p(br.mulheresMPE, br.vinculosMPE)}% dos empregados das MPE`);
console.log(`${Object.keys(mun).length} municípios`);
for (const s of ['SP', 'MG', 'AM', 'DF']) console.log(s, p(uf[s].massaMPE, uf[s].massa), p(uf[s].mulheresMPE, uf[s].vinculosMPE));
