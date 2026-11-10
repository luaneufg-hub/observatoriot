// Cores dos biomas — UI Kit "Página Brasil - Observatório" (seção BIOMAS).
// Cada bioma tem uma cadeia-símbolo da bioeconomia, como no kit.
export const BIOMAS = [
  { id: 'amazonia', nome: 'Amazônia', cadeia: 'Açaí', cor: '#DC8ACE' },
  { id: 'cerrado', nome: 'Cerrado', cadeia: 'Café', cor: '#753335' },
  { id: 'caatinga', nome: 'Caatinga', cadeia: 'Manga', cor: '#DA7400' },
  { id: 'mataAtlantica', nome: 'Mata Atlântica', cadeia: 'Cachaça', cor: '#8A9136' },
  { id: 'pantanal', nome: 'Pantanal', cadeia: 'Mel', cor: '#F8A928' },
  { id: 'pampa', nome: 'Pampa', cadeia: 'Vinho', cor: '#D70938' },
];

export const BIOMA_BY_ID = Object.fromEntries(BIOMAS.map((b) => [b.id, b]));

export function biomaPredominante(uf) {
  return Object.entries(uf.biomas).sort((a, b) => b[1] - a[1])[0][0];
}
