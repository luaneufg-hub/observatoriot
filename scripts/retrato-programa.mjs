// Converte a resposta da API (data.jsonrecords ou jsonarrays) de um programa da dimensão
// "Jornada" do cube RF num retrato compacto em public/dados/programas/<id>.json.
// Uso: node scripts/retrato-programa.mjs <arquivo-da-api.json> [data AAAA-MM-DD]
import { readFileSync, writeFileSync } from 'node:fs';

const NIVEL_PARA_ID = {
  'Territorial Journey Sebrae': 'jornada',
  'Entrepreneur Room': 'sala',
  'Entrepreneurial City': 'cidade',
  'Entrepreneurial City Hall': 'pspe',
  'Entrepreneurial Territory': 'te',
  'Territorial Agent Sebrae': 'ats',
  'City Hall Relationship': 'rp',
  'Geographical Indication': 'ig',
};

const [arquivo, data = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);
const j = JSON.parse(readFileSync(arquivo, 'utf8'));
const cols = j.columns;
const n1 = cols[1];
const id = NIVEL_PARA_ID[n1];
if (!id) throw new Error(`Programa não reconhecido: ${n1}`);
const linhas = Array.isArray(j.data[0]) ? j.data.map((r) => Object.fromEntries(cols.map((c, i) => [c, r[i]]))) : j.data;
const sim = linhas.filter((r) => r[`${n1} ID`] === 1).map((r) => r[cols[2]]).sort((a, b) => a - b);
writeFileSync(`public/dados/programas/${id}.json`, JSON.stringify({ programa: id, atualizadoEm: data, origem: `API do Observatório · cube RF · ${j.columns[1]}`, sim }));
console.log(`${id}: ${sim.length} municípios participantes de ${linhas.length}`);
