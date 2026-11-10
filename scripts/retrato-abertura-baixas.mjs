// Retratos de "Situação e registro":
//  • Tempo de abertura (REDESIM_Tempo_Abertura · Total Opening Time · média em horas, 2025)
//    — o cubo calcula a média em cada nível, por isso vêm três arquivos: Brasil, UF e município.
//  • Baixas de pequenos negócios (RF · Establishments · Registration Status = 8 (baixada) ·
//    Status Year = 2025 · porte EPP/ME/MEI), por município.
//
// Uso: node scripts/retrato-abertura-baixas.mjs <tempo-brasil.json> <tempo-uf.json> <tempo-municipio.json> <baixas-municipio.json> [data]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const UF_IBGE = {
  11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO',
  21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA',
  31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP', 41: 'PR', 42: 'SC', 43: 'RS',
  50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF',
};
const ler = (f) => {
  const j = JSON.parse(readFileSync(f, 'utf8'));
  return Array.isArray(j.data[0]) ? j.data.map((r) => Object.fromEntries(j.columns.map((c, i) => [c, r[i]]))) : j.data;
};
const [fBr, fUf, fMun, fBaixas, data = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);

// tempo de abertura (horas)
const br = ler(fBr)[0]['Total Opening Time'];
const uf = Object.fromEntries(ler(fUf).map((r) => [UF_IBGE[r['State ID']], r['Total Opening Time']]));
const mun = Object.fromEntries(ler(fMun).filter((r) => r['Total Opening Time'] != null && UF_IBGE[Math.floor(r['Municipality ID'] / 1e5)]).map((r) => [r['Municipality ID'], Math.round(r['Total Opening Time'] * 10) / 10]));

// baixas
const baixasMun = {};
const baixasUF = {};
let baixasBR = 0;
for (const r of ler(fBaixas)) {
  const v = Math.round(r.Establishments || 0);
  baixasBR += v;
  const sigla = UF_IBGE[Math.floor(r['Municipality ID'] / 1e5)];
  if (!sigla) continue;
  baixasMun[r['Municipality ID']] = v;
  baixasUF[sigla] = (baixasUF[sigla] || 0) + v;
}

mkdirSync('lib/dados/retratos', { recursive: true });
mkdirSync('public/dados/redesim', { recursive: true });
writeFileSync('lib/dados/retratos/registro-2025.json', JSON.stringify({ atualizadoEm: data, ano: 2025, tempoAbertura: { unidade: 'horas', br, uf }, baixas: { br: baixasBR, uf: baixasUF } }, null, 1));
writeFileSync('public/dados/redesim/tempo-municipio.json', JSON.stringify({ atualizadoEm: data, ano: 2025, unidade: 'horas', mun }));
writeFileSync('public/dados/rf/mpe-baixas-municipio.json', JSON.stringify({ atualizadoEm: data, ano: 2025, mun: baixasMun }));
console.log(`tempo: Brasil ${br.toFixed(1)} h · ${Object.keys(uf).length} UFs · ${Object.keys(mun).length} municípios`);
console.log(`baixas 2025: Brasil ${baixasBR.toLocaleString('pt-BR')} · ${Object.keys(baixasMun).length} municípios`);
