// Converte a resposta da API do Observatório
//   cube=Sebrae_Atendimento · drilldowns=Municipality,Year
//   measures=Attendances,Total Clientes Atendidos,Clients PJ Atendidos · include=Year:2024,2025
// em:
//   lib/dados/retratos/sebrae-atendimentos.json         → Brasil e UF por ano
//   public/dados/sebrae/atendimentos-municipio.json     → { cod: [atend, clientes, clientesPJ] } do ano mais recente
//
// Observação: clientes são contados por município; quem foi atendido em mais de um município
// conta mais de uma vez na soma do estado e do Brasil.
// Uso: node scripts/retrato-atendimentos-municipio.mjs <arquivo-da-api.json> [data AAAA-MM-DD]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const UF_IBGE = {
  11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO',
  21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA',
  31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP', 41: 'PR', 42: 'SC', 43: 'RS',
  50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF',
};

const [arquivo, data = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);
const j = JSON.parse(readFileSync(arquivo, 'utf8'));
const cols = j.columns;
for (const c of ['Municipality ID', 'Year', 'Attendances']) if (!cols.includes(c)) throw new Error(`Falta a coluna ${c}`);
const linhas = Array.isArray(j.data[0]) ? j.data.map((r) => Object.fromEntries(cols.map((c, i) => [c, r[i]]))) : j.data;

const ANOS = [...new Set(linhas.map((r) => r.Year))].sort();
const ULTIMO = ANOS[ANOS.length - 1];
const zero = () => ({ atendimentos: 0, clientes: 0, clientesPJ: 0 });
const br = Object.fromEntries(ANOS.map((a) => [a, zero()]));
const uf = {};
const mun = {};
for (const r of linhas) {
  const v = { atendimentos: Math.round(r.Attendances || 0), clientes: Math.round(r['Total Clientes Atendidos'] || 0), clientesPJ: Math.round(r['Clients PJ Atendidos'] || 0) };
  const a = r.Year;
  for (const k in v) br[a][k] += v[k];
  const cod = r['Municipality ID'];
  const sigla = UF_IBGE[Math.floor(cod / 1e5)];
  if (!sigla) continue;
  const u = ((uf[sigla] ??= {})[a] ??= zero());
  for (const k in v) u[k] += v[k];
  if (a === ULTIMO) mun[cod] = [v.atendimentos, v.clientes, v.clientesPJ];
}

const meta = { consulta: 'Sebrae_Atendimento · Municipality × Year · Attendances, Total Clientes Atendidos, Clients PJ Atendidos', atualizadoEm: data, anos: ANOS, anoMunicipio: ULTIMO, ordemMunicipio: ['atendimentos', 'clientes', 'clientesPJ'] };
mkdirSync('lib/dados/retratos', { recursive: true });
mkdirSync('public/dados/sebrae', { recursive: true });
writeFileSync('lib/dados/retratos/sebrae-atendimentos.json', JSON.stringify({ ...meta, br, uf }, null, 1));
writeFileSync('public/dados/sebrae/atendimentos-municipio.json', JSON.stringify({ ...meta, mun }));
for (const a of ANOS) console.log(a, br[a]);
console.log(`${Object.keys(mun).length} municípios (${ULTIMO})`);
