// Indicadores Municipais de Inovação (Sebrae) a partir da API do Observatório:
//   cube=Sebrae_Ind_Mun_Inovacao · drilldowns=Municipality,Year · 26 medidas (todas)
//
// O cubo traz cada componente já normalizado de 0 a 1 entre os municípios (mín.–máx.) e o
// "Indicador Geral Inovação", calculado pelo Sebrae. Aqui:
//  • índice geral × 100 (0–100);
//  • cinco temas, para leitura e comparação: média dos componentes de cada tema × 100;
//  • percentil de cada município no índice e em cada tema (0–100: à frente de X% dos municípios).
// Estado e Brasil: média simples dos municípios (o cubo não pondera por população).
//
// Uso: node scripts/retrato-inovacao.mjs <arquivo-da-api.json> [data AAAA-MM-DD]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const UF_IBGE = {
  11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO',
  21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA',
  31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP', 41: 'PR', 42: 'SC', 43: 'RS',
  50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF',
};
export const TEMAS = [
  { id: 'ambiente', nome: 'Ambiente de negócios', medidas: ['Qualidade Gestão Fiscal', 'Taxa Sobrevivência 3 Anos', 'Taxa Empreendedorismo', 'Crescimento PIB per Capita'] },
  { id: 'capital', nome: 'Educação e talentos', medidas: ['IDEB Ensino Fundamental', 'IDEB Ensino Médio', 'Matrículas STEM por 1k', 'Conclusões STEM por 1k', 'Matrículas Técnico por 10k', 'Força Trabalho Superior'] },
  { id: 'infra', nome: 'Conectividade e energia', medidas: ['Cobertura Banda Larga Fixa', 'Velocidade Banda Larga Fixa', 'Cobertura Banda Larga Móvel', 'Participação Renováveis'] },
  { id: 'conhecimento', nome: 'Conhecimento e tecnologia', medidas: ['Depósitos Patentes por 100k', 'Marcas Registradas por 10k', 'Desenhos Industriais por 100k', 'Emprego Alta Média-Alta Tech', 'Variação Emprego Conhecimento', 'Massa Salarial Inovadores', 'Renda Média TI Inovação', 'Exportações Criativas per Capita', 'Importações Alta Tech per Capita'] },
  { id: 'startups', nome: 'Startups e base tecnológica', medidas: ['Startups Ativas por 10k', 'Densidade EBTs por 10k'] },
];
// ordem dos valores por município: [geral, temas…, startups, ebts] e depois os percentis na mesma ordem
const CAMPOS = ['geral', ...TEMAS.map((t) => t.id), 'startups_ativas', 'ebts'];

const [arquivo, data = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);
const j = JSON.parse(readFileSync(arquivo, 'utf8'));
const linhas = Array.isArray(j.data[0]) ? j.data.map((r) => Object.fromEntries(j.columns.map((c, i) => [c, r[i]]))) : j.data;
const ano = Math.max(...linhas.map((r) => r.Year));
const media = (a) => a.reduce((s, x) => s + x, 0) / a.length;

const mun = new Map();
for (const r of linhas) {
  if (r.Year !== ano) continue;
  const cod = r['Municipality ID'];
  if (!UF_IBGE[Math.floor(cod / 1e5)]) continue; // "Não informado"
  const v = [r['Indicador Geral Inovação'] * 100, ...TEMAS.map((t) => media(t.medidas.map((m) => r[m] ?? 0)) * 100), r['Startups Ativas por 10k'] * 100, r['Densidade EBTs por 10k'] * 100];
  mun.set(cod, v);
}
// percentis (fração de municípios com valor estritamente menor, + metade dos empates)
const pct = CAMPOS.map((_, k) => {
  const ord = [...mun.values()].map((v) => v[k]).sort((a, b) => a - b);
  const n = ord.length;
  const abaixo = (x) => {
    let lo = 0, hi = n;
    while (lo < hi) { const m = (lo + hi) >> 1; if (ord[m] < x) lo = m + 1; else hi = m; }
    const menor = lo;
    lo = menor; hi = n;
    while (lo < hi) { const m = (lo + hi) >> 1; if (ord[m] <= x) lo = m + 1; else hi = m; }
    return ((menor + (lo - menor) / 2) / n) * 100;
  };
  return abaixo;
});
// posição no ranking do índice geral
const ranking = [...mun.entries()].sort((a, b) => b[1][0] - a[1][0]).map(([c]) => c);
const posicao = new Map(ranking.map((c, i) => [c, i + 1]));

const r1 = (x) => Math.round(x * 10) / 10;
const saidaMun = {};
const porUF = {};
for (const [cod, v] of mun) {
  const p = v.map((x, k) => pct[k](x));
  saidaMun[cod] = [...v.map(r1), ...p.map(Math.round), posicao.get(cod)];
  const s = UF_IBGE[Math.floor(cod / 1e5)];
  (porUF[s] ??= []).push([v, p]);
}
const agrega = (lista) => ({
  valor: CAMPOS.map((_, k) => r1(media(lista.map(([v]) => v[k])))),
  pct: CAMPOS.map((_, k) => Math.round(media(lista.map(([, p]) => p[k])))),
  n: lista.length,
});
const uf = Object.fromEntries(Object.entries(porUF).map(([s, l]) => [s, agrega(l)]));
const posUF = Object.entries(uf).sort((a, b) => b[1].valor[0] - a[1].valor[0]).map(([s]) => s);
for (const [i, s] of posUF.entries()) uf[s].posicao = i + 1;
const br = agrega([...Object.values(porUF)].flat());

const meta = { consulta: 'Sebrae_Ind_Mun_Inovacao · Municipality × Year · 26 medidas', ano, atualizadoEm: data, campos: CAMPOS, temas: TEMAS.map(({ id, nome, medidas }) => ({ id, nome, medidas })) };
mkdirSync('lib/dados/retratos', { recursive: true });
mkdirSync('public/dados/sebrae', { recursive: true });
writeFileSync('lib/dados/retratos/inovacao.json', JSON.stringify({ ...meta, municipios: mun.size, br, uf }, null, 1));
writeFileSync('public/dados/sebrae/inovacao-municipio.json', JSON.stringify({ ...meta, ordem: '[valores (campos), percentis (campos), posição no índice geral]', mun: saidaMun }));
console.log(`${mun.size} municípios · ano ${ano}`);
console.log('Brasil', br.valor);
console.log('UFs (top 5)', posUF.slice(0, 5).map((s) => `${s} ${uf[s].valor[0]}`).join(' · '), '… último', posUF.at(-1), uf[posUF.at(-1)].valor[0]);
console.log('Tiradentes', saidaMun[3169307]);
