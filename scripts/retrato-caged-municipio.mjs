// Converte a resposta da API do Observatório
//   cube=CAGED_movements · drilldowns=Municipality,Year,Aggregated Company Size
//   measures=Movement Balance,Admissions,Resignations · include=Year:2025,2026
// (saldo de empregos com carteira por município, ano e porte agregado) em:
//   lib/dados/retratos/caged-saldo.json             → Brasil por porte e UF (MPE e total) por ano
//   public/dados/caged/saldo-municipio.json         → { cod: [mpe2025, total2025, mpe2026, total2026] }
//
// Total = soma de todos os portes (MPE, MGE, pessoa física, adm. pública, sem fins lucrativos,
// não informado).
// Uso: node scripts/retrato-caged-municipio.mjs <arquivo-da-api.json> [data AAAA-MM-DD]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const UF_IBGE = {
  11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO',
  21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA',
  31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP', 41: 'PR', 42: 'SC', 43: 'RS',
  50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF',
};
const PORTE = { 0: 'naoInformado', 1: 'mpe', 2: 'mge', 3: 'pessoaFisica', 4: 'admPublica', 5: 'semFins' };

const [arquivo, data = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);
const j = JSON.parse(readFileSync(arquivo, 'utf8'));
const cols = j.columns;
for (const c of ['Municipality ID', 'Year', 'Aggregated Company Size ID', 'Movement Balance']) if (!cols.includes(c)) throw new Error(`Falta a coluna ${c}`);
const linhas = Array.isArray(j.data[0]) ? j.data.map((r) => Object.fromEntries(cols.map((c, i) => [c, r[i]]))) : j.data;

const ANOS = [...new Set(linhas.map((r) => r.Year))].sort();
const br = Object.fromEntries(ANOS.map((a) => [a, Object.fromEntries(Object.values(PORTE).map((p) => [p, { saldo: 0, admissoes: 0, desligamentos: 0 }]))]));
const uf = {};
const mun = {};
for (const r of linhas) {
  const p = PORTE[r['Aggregated Company Size ID']];
  if (!p) throw new Error(`Porte inesperado: ${r['Aggregated Company Size ID']}`);
  const a = r.Year;
  const s = Math.round(r['Movement Balance'] || 0);
  const b = br[a][p];
  b.saldo += s;
  b.admissoes += Math.round(r.Admissions || 0);
  b.desligamentos += Math.round(r.Resignations || 0);
  const cod = r['Municipality ID'];
  const sigla = UF_IBGE[Math.floor(cod / 1e5)];
  if (!sigla) continue;
  const i = ANOS.indexOf(a) * 2;
  const m = (mun[cod] ??= ANOS.flatMap(() => [0, 0]));
  const u = (uf[sigla] ??= Object.fromEntries(ANOS.map((x) => [x, { mpe: 0, total: 0 }])));
  if (p === 'mpe') {
    m[i] += s;
    u[a].mpe += s;
  }
  m[i + 1] += s;
  u[a].total += s;
}

const meta = {
  consulta: 'CAGED_movements · Movement Balance · Municipality × Year × Aggregated Company Size',
  atualizadoEm: data,
  anos: ANOS,
  ordemMunicipio: ANOS.flatMap((a) => [`mpe${a}`, `total${a}`]),
};
mkdirSync('lib/dados/retratos', { recursive: true });
mkdirSync('public/dados/caged', { recursive: true });
writeFileSync('lib/dados/retratos/caged-saldo.json', JSON.stringify({ ...meta, br, uf }, null, 1));
writeFileSync('public/dados/caged/saldo-municipio.json', JSON.stringify({ ...meta, mun }));
for (const a of ANOS) {
  const tot = Object.values(br[a]).reduce((x, y) => x + y.saldo, 0);
  console.log(a, 'MPE', br[a].mpe.saldo.toLocaleString('pt-BR'), 'total', tot.toLocaleString('pt-BR'), `${((br[a].mpe.saldo / tot) * 100).toFixed(1)}%`);
}
