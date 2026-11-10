// Converte a resposta da API do Observatório
//   cube=RF · drilldowns=Municipality,Sector,Open Activity Year · measures=Establishments
//   include=Company Size Sebrae:3,4,5 ; Open Activity Year:2024,2025,2026
// (pequenos negócios ABERTOS por município, Setor SEBRAE e ano — sem filtro de situação) em:
//   lib/dados/retratos/rf-mpe-aberturas.json          → Brasil por setor e ano; UF por ano
//   public/dados/rf/mpe-aberturas-municipio.json      → { cod: [2024, 2025, 2026] }
//
// Uso: node scripts/retrato-aberturas-municipio.mjs <arquivo-da-api.json> [data AAAA-MM-DD]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const UF_IBGE = {
  11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO',
  21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA',
  31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP', 41: 'PR', 42: 'SC', 43: 'RS',
  50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF',
};
const SETOR = { 41: 'agro', 21: 'comercio', 11: 'industria', 12: 'industria', 13: 'industria', 61: 'construcao', 31: 'servicos', 32: 'admpub', 33: 'outros', 0: 'outros' };
const SETORES = ['agro', 'comercio', 'industria', 'construcao', 'servicos', 'admpub', 'outros'];

const [arquivo, data = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);
const j = JSON.parse(readFileSync(arquivo, 'utf8'));
const cols = j.columns;
for (const c of ['Municipality ID', 'Sector ID', 'Open Activity Year']) if (!cols.includes(c)) throw new Error(`Falta a coluna ${c}`);
const linhas = Array.isArray(j.data[0]) ? j.data.map((r) => Object.fromEntries(cols.map((c, i) => [c, r[i]]))) : j.data;

const ANOS = [...new Set(linhas.map((r) => r['Open Activity Year']))].sort();
const br = Object.fromEntries(ANOS.map((a) => [a, Object.fromEntries(SETORES.map((s) => [s, 0]))]));
const uf = {};
const mun = {};
for (const r of linhas) {
  const s = SETOR[r['Sector ID']];
  if (!s) throw new Error(`Setor inesperado: ${r['Sector ID']} ${r.Sector}`);
  const a = r['Open Activity Year'];
  const v = Math.round(r.Establishments);
  br[a][s] += v;
  const cod = r['Municipality ID'];
  const sigla = UF_IBGE[Math.floor(cod / 1e5)];
  if (!sigla) continue;
  const i = ANOS.indexOf(a);
  (mun[cod] ??= ANOS.map(() => 0))[i] += v;
  (uf[sigla] ??= Object.fromEntries(ANOS.map((x) => [x, 0])))[a] += v;
}

const meta = {
  consulta: 'RF · Establishments · Municipality × Sector × Open Activity Year · porte EPP/ME/MEI · todas as situações',
  atualizadoEm: data,
  anos: ANOS,
};
mkdirSync('lib/dados/retratos', { recursive: true });
mkdirSync('public/dados/rf', { recursive: true });
writeFileSync('lib/dados/retratos/rf-mpe-aberturas.json', JSON.stringify({ ...meta, br, uf }, null, 1));
writeFileSync('public/dados/rf/mpe-aberturas-municipio.json', JSON.stringify({ ...meta, mun }));
for (const a of ANOS) console.log(a, Object.values(br[a]).reduce((x, y) => x + y, 0).toLocaleString('pt-BR'), br[a]);
