// Converte a resposta da API do Observatório
//   cube=RAIS_workers · drilldowns=Municipality,Aggregated Company Size,Active worker indicator
//   measures=Workers,Salary Mass,Remuneration Avg Nominal · include=Year:2025
// em:
//   lib/dados/retratos/rais-2025.json              → Brasil e UF: vínculos e massa salarial (MPE e total)
//   public/dados/rais/vinculos-municipio.json      → { cod: [vinculosMPE, massaMPE, vinculosTotal, massaTotal] }
//
// Usa só os vínculos ATIVOS em 31/12 (Active worker indicator = Sim), o estoque oficial da RAIS.
// "Massa salarial" é a soma das remunerações médias mensais dos vínculos (R$ por mês).
// Uso: node scripts/retrato-rais-municipio.mjs <arquivo-da-api.json> [ano] [data AAAA-MM-DD]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const UF_IBGE = {
  11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO',
  21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA',
  31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP', 41: 'PR', 42: 'SC', 43: 'RS',
  50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF',
};

const [arquivo, ano = '2025', data = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);
const j = JSON.parse(readFileSync(arquivo, 'utf8'));
const cols = j.columns;
for (const c of ['Municipality ID', 'Aggregated Company Size ID', 'Active worker indicator ID', 'Workers', 'Salary Mass']) if (!cols.includes(c)) throw new Error(`Falta a coluna ${c}`);
const linhas = Array.isArray(j.data[0]) ? j.data.map((r) => Object.fromEntries(cols.map((c, i) => [c, r[i]]))) : j.data;

const zero = () => ({ vinculosMPE: 0, massaMPE: 0, vinculos: 0, massa: 0 });
const br = zero();
const uf = {};
const mun = {};
for (const r of linhas) {
  if (r['Active worker indicator ID'] !== 1) continue; // só ativos em 31/12
  const mpe = r['Aggregated Company Size ID'] === 1;
  const w = Math.round(r.Workers || 0);
  const s = r['Salary Mass'] || 0;
  const soma = (o) => {
    o.vinculos += w;
    o.massa += s;
    if (mpe) {
      o.vinculosMPE += w;
      o.massaMPE += s;
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
const meta = { consulta: 'RAIS_workers · Municipality × Aggregated Company Size × Active worker indicator · Workers, Salary Mass', ano: +ano, atualizadoEm: data, ordemMunicipio: ['vinculosMPE', 'massaMPE', 'vinculos', 'massa'] };
mkdirSync('lib/dados/retratos', { recursive: true });
mkdirSync('public/dados/rais', { recursive: true });
writeFileSync('lib/dados/retratos/rais-2025.json', JSON.stringify({ ...meta, br: arred(br), uf: Object.fromEntries(Object.entries(uf).map(([k, v]) => [k, arred(v)])) }, null, 1));
writeFileSync('public/dados/rais/vinculos-municipio.json', JSON.stringify({ ...meta, mun: Object.fromEntries(Object.entries(mun).map(([k, v]) => [k, [v.vinculosMPE, Math.round(v.massaMPE), v.vinculos, Math.round(v.massa)]])) }));
console.log('Brasil', arred(br), `MPE: ${((br.massaMPE / br.massa) * 100).toFixed(1)}% da massa, ${((br.vinculosMPE / br.vinculos) * 100).toFixed(1)}% dos vínculos`);
console.log(`${Object.keys(mun).length} municípios`);
