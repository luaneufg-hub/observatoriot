// Regionais do Sebrae por município (API do Observatório):
//   cube=RF · drilldowns=Region Sebrae,Municipality Sebrae · measures=Establishments
// Saída: public/dados/sebrae/regionais-municipio.json → { regioes: { id: nome }, mun: { cod: id } }
// Os códigos das regionais são os mesmos dos relatórios de Fase 2 do Impulsionar Negócios
// (ex.: "0082 - MG - Triângulo - Diagnostico_setor_territorio.html").
// Uso: node scripts/retrato-regionais-sebrae.mjs <arquivo-da-api.json> [data]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const [arquivo, data = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);
const j = JSON.parse(readFileSync(arquivo, 'utf8'));
const linhas = Array.isArray(j.data[0]) ? j.data.map((r) => Object.fromEntries(j.columns.map((c, i) => [c, r[i]]))) : j.data;
const regioes = {};
const mun = {};
for (const r of linhas) {
  const id = r['Region Sebrae ID'];
  const nome = r['Region Sebrae'];
  if (!/^[A-Z]{2} - /.test(nome)) continue; // "Não Informado", "Não Se Aplica"
  regioes[id] = nome
    .replace(/^[A-Z]{2} - /, '')
    .replace(/^Df - /, '')
    .replace(/\b(De|Do|Da|Dos|Das|E)\b/g, (m) => m.toLowerCase())
    .replace(/\bIi\b/g, 'II')
    .replace(/^Pa Sebrae\/Am & Pa /, 'PA ')
    .replace(/^Pa /, 'PA ');
  mun[r['Municipality Sebrae ID']] = id;
}
mkdirSync('public/dados/sebrae', { recursive: true });
writeFileSync('public/dados/sebrae/regionais-municipio.json', JSON.stringify({ consulta: 'RF · Region Sebrae × Municipality Sebrae', atualizadoEm: data, regioes, mun }));
console.log(`${Object.keys(regioes).length} regionais · ${Object.keys(mun).length} municípios`);
