// Converte a resposta da API do Observatório
//   cube=RF · drilldowns=Municipality,Sector · measures=Establishments
//   include=Registration Status:2 ; Company Size Sebrae:3,4,5
// (pequenos negócios ATIVOS por município e Setor SEBRAE) em dois retratos:
//   lib/dados/retratos/rf-mpe-setor-uf.json      → por UF e Brasil (entra no código)
//   public/dados/rf/mpe-setor-municipio.json     → { cod: [agro, comercio, industria, construcao, servicos, admpub, outros] }
//
// Setor SEBRAE → setores do site: 41 agro · 21 comércio · 11/12/13 indústria (transformação,
// extrativa, utilidade pública) · 61 construção · 31 serviços · 32 adm. pública · 0/33 outros.
//
// Uso: node scripts/retrato-setor-municipio.mjs <arquivo-da-api.json> [data AAAA-MM-DD]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const UF_IBGE = {
  11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO',
  21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA',
  31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP', 41: 'PR', 42: 'SC', 43: 'RS',
  50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF',
};
export const ORDEM = ['agro', 'comercio', 'industria', 'construcao', 'servicos', 'admpub', 'outros'];
const SETOR = { 41: 'agro', 21: 'comercio', 11: 'industria', 12: 'industria', 13: 'industria', 61: 'construcao', 31: 'servicos', 32: 'admpub', 33: 'outros', 0: 'outros' };

const [arquivo, data = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);
const j = JSON.parse(readFileSync(arquivo, 'utf8'));
const cols = j.columns;
if (!cols.includes('Sector ID') || !cols.includes('Municipality ID')) throw new Error('Esperado drilldown Municipality × Sector');
const linhas = Array.isArray(j.data[0]) ? j.data.map((r) => Object.fromEntries(cols.map((c, i) => [c, r[i]]))) : j.data;

const vazio = () => Object.fromEntries(ORDEM.map((k) => [k, 0]));
const mun = {};
const uf = {};
const br = vazio();
for (const r of linhas) {
  const s = SETOR[r['Sector ID']];
  if (!s) throw new Error(`Setor inesperado: ${r['Sector ID']} ${r.Sector}`);
  const v = Math.round(r.Establishments);
  br[s] += v;
  const cod = r['Municipality ID'];
  const sigla = UF_IBGE[Math.floor(cod / 1e5)];
  if (!sigla) continue; // exterior / não informado: só no Brasil
  (mun[cod] ??= ORDEM.map(() => 0))[ORDEM.indexOf(s)] += v;
  (uf[sigla] ??= vazio())[s] += v;
}

const meta = {
  consulta: 'RF · Establishments · Municipality × Sector (Setor SEBRAE) · Registration Status = Ativa · porte EPP/ME/MEI',
  atualizadoEm: data,
  ordem: ORDEM,
  municipios: Object.keys(mun).length,
};
mkdirSync('lib/dados/retratos', { recursive: true });
mkdirSync('public/dados/rf', { recursive: true });
writeFileSync('lib/dados/retratos/rf-mpe-setor-uf.json', JSON.stringify({ ...meta, br, uf }, null, 1));
writeFileSync('public/dados/rf/mpe-setor-municipio.json', JSON.stringify({ ...meta, mun }));
console.log(`${meta.municipios} municípios · Brasil`, br);
