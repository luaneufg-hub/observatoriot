// Cadeias produtivas a partir das bases de produção do IBGE no Observatório (ano 2024):
//   PAM Culturas (lavouras) · PPM Produtos (produtos de origem animal e aquicultura) ·
//   PEVS_Plant_Extraction (extração vegetal)
//
// • Cadeia de referência de um lugar = produto de maior valor de produção somando as três bases
//   (o mesmo produto em bases diferentes soma: açaí cultivado + açaí extrativo).
// • Cadeias extrativistas = produtos da extração vegetal não madeireira (sem madeira, lenha,
//   carvão e pinheiro), por valor — usadas na Amazônia Legal.
//
// ⚠️ PEVS: a tabela de produtos do cubo tem códigos com dois nomes (versões antigas da lista do
// IBGE), e cada linha vem duplicada. Aqui cada código recebe o nome da lista OFICIAL de 2024
// (SIDRA, tabela 289) e as duplicatas são descartadas. Produtos novos da lista (pequi fruto,
// pinhão, umbu, mangaba, palmito, cupuaçu…) não aparecem no cubo.
//
// Uso: node scripts/retrato-producao.mjs <pam.json> <ppm.json> <pevs.json> [ano] [data]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const UF_IBGE = {
  11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO',
  21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA',
  31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP', 41: 'PR', 42: 'SC', 43: 'RS',
  50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF',
};
export const AMAZONIA_LEGAL = ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO', 'MT', 'MA'];

// PEVS: código → nome oficial (SIDRA, tabela 289, 2024); null = fora (madeireiros, "outros")
const PEVS_OFICIAL = {
  '1.1': 'Açaí', '1.5': 'Castanha-de-caju', '1.6': 'Castanha-do-pará', '1.8': 'Erva-mate',
  '2.1': 'Ipecacuanha', '2.2': 'Jaborandi', '2.3': 'Urucum', '2.4': null,
  '3.2': 'Borracha (látex)', '3.3': 'Borracha (látex)',
  '4.1': 'Carnaúba (cera)', '4.2': 'Carnaúba (pó)', '4.3': null,
  '5.1': 'Buriti (fibra)', '5.2': 'Carnaúba (fibra)', '5.3': 'Piaçava', '5.4': null,
  '7.1': 'Carvão vegetal', '7.2': 'Lenha', '7.3': 'Madeira em tora',
  '8.2': 'Babaçu', '8.3': 'Copaíba (óleo)', '8.4': 'Cumaru', '8.5': 'Licuri', '8.8': 'Pequi (amêndoa)',
  '9.1': 'Pinheiro brasileiro', '9.2': 'Pinheiro brasileiro', '9.3': 'Pinheiro brasileiro',
  '10.1': 'Angico (casca)', '10.2': 'Barbatimão (casca)', '10.3': null,
};
const MADEIREIROS = new Set(['Carvão vegetal', 'Lenha', 'Madeira em tora', 'Pinheiro brasileiro']);

// nomes mais curtos para lavouras e pecuária
const limpa = (n) =>
  n
    .replace(/\*+$/, '')
    .replace(/ \((em grão|em caroço|em casca|cacho|em amêndoa|em folha|folha verde|semente|baga|fibra|fruto seco|cacho de coco|látex coagulado)\)/, '')
    .replace(/^Café Total$/, 'Café')
    .replace(/^Algodão herbáceo$/, 'Algodão')
    .replace(/^Castanha de caju$/, 'Castanha-de-caju')
    .replace(/^Borracha$/, 'Borracha (látex)')
    .replace(/^Coco-da-baía$/, 'Coco')
    .trim();
const IGNORA_PAM = new Set(['Café (em grão) Arábica', 'Café (em grão) Canephora']); // já estão no Total
const IGNORA_PPM = new Set(['Alevinos', 'Larvas e pós-larvas de camarão', 'Sementes de moluscos', 'Outros peixes', 'Outros produtos (rã, jacaré, siri, caranguejo, lagosta, etc)']);

const ler = (f) => {
  const j = JSON.parse(readFileSync(f, 'utf8'));
  return Array.isArray(j.data[0]) ? j.data.map((r) => Object.fromEntries(j.columns.map((c, i) => [c, r[i]]))) : j.data;
};
const [fPam, fPpm, fPevs, ano = '2024', data = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);

// cod → Map(produto → valor) para cadeias; e só extração não madeireira
const total = new Map();
const extr = new Map();
const add = (m, cod, prod, v) => {
  if (!v) return;
  const x = m.get(cod) || new Map();
  x.set(prod, (x.get(prod) || 0) + v);
  m.set(cod, x);
};
for (const r of ler(fPam)) if (!IGNORA_PAM.has(r.Crop)) add(total, r['Municipality ID'], limpa(r.Crop), r['Production Value']);
for (const r of ler(fPpm)) if (!IGNORA_PPM.has(r.Product)) add(total, r['Municipality ID'], limpa(r.Product), r['Production Value']);
const visto = new Set();
let descartadas = 0;
for (const r of ler(fPevs)) {
  const chave = `${r['Municipality ID']}|${r['Product ID']}`;
  if (visto.has(chave)) {
    descartadas++;
    continue; // linha duplicada pelo erro de cadastro do cubo
  }
  visto.add(chave);
  const nome = PEVS_OFICIAL[r['Product ID']];
  if (!nome) continue;
  add(total, r['Municipality ID'], nome, r['Production Value']);
  if (!MADEIREIROS.has(nome)) add(extr, r['Municipality ID'], nome, r['Production Value']);
}

// índice de municípios (UF e bioma predominante)
const idx = new Map(JSON.parse(readFileSync('public/geo/municipios-index.json', 'utf8')).map((m) => [m[0], { uf: m[2], bioma: m[6] }]));
const somaEm = (destino, chave, origem) => {
  const d = destino.get(chave) || new Map();
  for (const [p, v] of origem) d.set(p, (d.get(p) || 0) + v);
  destino.set(chave, d);
};
const porUF = new Map();
const porBioma = new Map();
const extrUF = new Map();
const br = new Map();
for (const [cod, m] of total) {
  const sigla = UF_IBGE[Math.floor(cod / 1e5)];
  if (!sigla) continue;
  somaEm(porUF, sigla, m);
  somaEm(br, 'BR', m);
  const b = idx.get(cod)?.bioma;
  if (b) somaEm(porBioma, b, m);
}
for (const [cod, m] of extr) {
  const sigla = UF_IBGE[Math.floor(cod / 1e5)];
  if (sigla) somaEm(extrUF, sigla, m);
}
// [nome, valor em R$] ordenados, os n primeiros
const topo = (m, n) => [...(m || new Map())].sort((a, b) => b[1] - a[1]).slice(0, n).map(([p, v]) => [p, Math.round(v)]);

const retrato = {
  ano: +ano,
  atualizadoEm: data,
  fontes: 'IBGE (PAM, PPM, PEVS) via API do Observatório; nomes da PEVS conforme SIDRA tabela 289',
  unidade: 'R$',
  br: { top: topo(br.get('BR'), 5) },
  uf: Object.fromEntries([...porUF].map(([s, m]) => [s, { top: topo(m, 5), extrativas: AMAZONIA_LEGAL.includes(s) ? topo(extrUF.get(s), 6) : undefined }])),
  bioma: Object.fromEntries([...porBioma].map(([b, m]) => [b, { top: topo(m, 5) }])),
};
// município: cadeia principal + 3 seguintes; extrativas (Amazônia Legal) até 4
const mun = {};
for (const [cod, m] of total) {
  const sigla = UF_IBGE[Math.floor(cod / 1e5)];
  if (!sigla) continue;
  const o = { c: topo(m, 4) };
  if (AMAZONIA_LEGAL.includes(sigla) && extr.get(cod)) o.e = topo(extr.get(cod), 4);
  mun[cod] = o;
}
mkdirSync('lib/dados/retratos', { recursive: true });
mkdirSync('public/dados/ibge', { recursive: true });
writeFileSync('lib/dados/retratos/producao-2024.json', JSON.stringify(retrato, null, 1));
writeFileSync('public/dados/ibge/producao-municipio.json', JSON.stringify({ ano: +ano, atualizadoEm: data, mun }));
console.log(`PEVS: ${descartadas} linhas duplicadas descartadas · ${Object.keys(mun).length} municípios`);
console.log('Brasil', retrato.br.top);
for (const s of ['RO', 'PA', 'AM', 'MT', 'SP', 'BA', 'RS']) console.log(s, retrato.uf[s].top.slice(0, 3), retrato.uf[s].extrativas || '');
for (const [b, v] of Object.entries(retrato.bioma)) console.log(b, v.top.slice(0, 3));
