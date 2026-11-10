// Converte a resposta da API do Observatório
//   cube=RF · drilldowns=Municipality,Company Size Sebrae · measures=Establishments
//   include=Registration Status:2 ; Company Size Sebrae:3,4,5
// (pequenos negócios ATIVOS por município e porte) em dois retratos:
//   lib/dados/retratos/rf-mpe-ativas-uf.json   → totais por UF (entra no código, pequeno)
//   public/dados/rf/mpe-ativas-municipio.json  → { cod: [epp, me, mei] } (carregado sob demanda)
//
// Uso: node scripts/retrato-ativas-municipio.mjs <arquivo-da-api.json> [data AAAA-MM-DD]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const UF_IBGE = {
  11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO',
  21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA',
  31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP', 41: 'PR', 42: 'SC', 43: 'RS',
  50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF',
};
const PORTE = { 3: 0, 4: 1, 5: 2 }; // EPP, ME, MEI → posição no vetor

const [arquivo, data = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);
const j = JSON.parse(readFileSync(arquivo, 'utf8'));
const cols = j.columns;
const linhas = Array.isArray(j.data[0]) ? j.data.map((r) => Object.fromEntries(cols.map((c, i) => [c, r[i]]))) : j.data;

// conferência: só ativos de pequeno porte
const portes = new Set(linhas.map((r) => r['Company Size Sebrae ID']));
for (const p of portes) if (!(p in PORTE)) throw new Error(`Porte inesperado (${p}): a consulta precisa do filtro Company Size Sebrae:3,4,5`);

const capitais = new Map(
  JSON.parse(readFileSync('public/geo/municipios-index.json', 'utf8'))
    .filter((m) => m[3])
    .map((m) => [m[2], m[0]]),
);

const mun = {};
const uf = {};
const fora = { exterior: 0, naoInformado: 0 };
for (const r of linhas) {
  const cod = r['Municipality ID'];
  const v = Math.round(r.Establishments);
  const sigla = UF_IBGE[Math.floor(cod / 1e5)];
  if (!sigla) {
    fora[cod === 9300000 ? 'exterior' : 'naoInformado'] += v;
    continue;
  }
  (mun[cod] ??= [0, 0, 0])[PORTE[r['Company Size Sebrae ID']]] += v;
  const u = (uf[sigla] ??= { epp: 0, me: 0, mei: 0, capital: 0 });
  u[['epp', 'me', 'mei'][PORTE[r['Company Size Sebrae ID']]]] += v;
  if (capitais.get(sigla) === cod) u.capital += v;
}
for (const u of Object.values(uf)) u.total = u.epp + u.me + u.mei;

const br = Object.values(uf).reduce((a, u) => a + u.total, 0);
const meta = {
  consulta: 'RF · Establishments · Municipality × Company Size Sebrae · Registration Status = Ativa · porte EPP/ME/MEI',
  atualizadoEm: data,
  municipios: Object.keys(mun).length,
  totalBrasil: br,
  foraDasUFs: fora,
};

mkdirSync('lib/dados/retratos', { recursive: true });
mkdirSync('public/dados/rf', { recursive: true });
writeFileSync('lib/dados/retratos/rf-mpe-ativas-uf.json', JSON.stringify({ ...meta, uf }, null, 1));
writeFileSync('public/dados/rf/mpe-ativas-municipio.json', JSON.stringify({ ...meta, mun }));
console.log(`${meta.municipios} municípios · ${Object.keys(uf).length} UFs · Brasil ${br.toLocaleString('pt-BR')} (fora das UFs: ${JSON.stringify(fora)})`);
