// Cliente da API do Observatório (Tesseract OLAP, Datawheel).
//
// Configuração (.env.local):
//   NEXT_PUBLIC_OBS_API=https://apiv2-observatorio.sebrae.com.br/tesseract
//   NEXT_PUBLIC_OBS_TOKEN=<chave>        ← provisória no protótipo; pedir chave de uso no site
//
// Estratégia "sempre atualizado": o site consulta a API ao abrir; se a API falhar
// (rede, CORS, chave expirada), usa o último retrato salvo em /public/dados/*.json.

export const API = process.env.NEXT_PUBLIC_OBS_API || 'https://apiv2-observatorio.sebrae.com.br/tesseract';
const TOKEN = process.env.NEXT_PUBLIC_OBS_TOKEN || '';

// Códigos dos membros (cube RF), conferidos em /members
export const RF = {
  situacao: { nula: 1, ativa: 2, suspensa: 3, inapta: 4, baixada: 8 },
  porte: { naoAplicavel: 0, grande: 1, media: 2, epp: 3, me: 4, mei: 5, outros: 9 },
  // Setor Sebrae → setores do site
  setor: {
    11: 'industria', // Indústria de transformação
    12: 'industria', // Extrativa mineral
    13: 'industria', // SIUP
    21: 'comercio',
    31: 'servicos',
    32: 'admpub',
    33: 'semfins',
    41: 'agro',
    61: 'construcao',
    0: 'naoespecificado',
  },
};
export const PORTES_MPE = [RF.porte.epp, RF.porte.me, RF.porte.mei];

/**
 * Monta a URL de uma consulta.
 * @param q { cube, drilldowns: string[], measures: string[], include?: {[nivel]: (number|string)[]}, parents?: boolean }
 */
export function urlConsulta({ cube, drilldowns, measures, include = {}, parents = false, formato = 'jsonrecords' }) {
  const p = new URLSearchParams();
  p.set('cube', cube);
  p.set('drilldowns', drilldowns.join(','));
  p.set('measures', measures.join(','));
  const inc = Object.entries(include)
    .map(([nivel, chaves]) => `${nivel}:${chaves.join(',')}`)
    .join(';');
  if (inc) p.set('include', inc);
  if (parents) p.set('parents', 'true');
  p.set('locale', 'pt');
  if (TOKEN) p.set('token', TOKEN);
  return `${API}/data.${formato}?${p.toString()}`;
}

/* ------------------------------------------------------------------ consultas do site */
export const CONSULTAS = {
  // pequenos negócios ativos por município e porte (MEI, ME, EPP)
  ativasPorte: {
    cube: 'RF',
    drilldowns: ['Municipality', 'Company Size Sebrae'],
    measures: ['Establishments'],
    include: { 'Registration Status': [RF.situacao.ativa], 'Company Size Sebrae': PORTES_MPE },
  },
  // estabelecimentos ativos por porte, Brasil (retrato em lib/dados/retratos/rf-ativas-porte-brasil.json)
  ativasPorteBrasil: {
    cube: 'RF',
    drilldowns: ['Company Size Sebrae'],
    measures: ['Establishments'],
    include: { 'Registration Status': [RF.situacao.ativa] },
  },
  // pequenos negócios ativos por município e setor
  ativasSetor: {
    cube: 'RF',
    drilldowns: ['Municipality', 'Sector'],
    measures: ['Establishments'],
    include: { 'Registration Status': [RF.situacao.ativa], 'Company Size Sebrae': PORTES_MPE },
  },
  // aberturas de pequenos negócios por UF, setor e ano
  aberturas: {
    cube: 'RF',
    drilldowns: ['State', 'Sector', 'Open Activity Year'],
    measures: ['Establishments'],
    include: { 'Company Size Sebrae': PORTES_MPE, 'Open Activity Year': [2023, 2024, 2025, 2026] },
  },
  // pequenos negócios ativos liderados por mulheres, por município
  feminino: {
    cube: 'RF',
    drilldowns: ['Municipality', 'Flag Feminino'],
    measures: ['Establishments'],
    include: { 'Registration Status': [RF.situacao.ativa], 'Company Size Sebrae': PORTES_MPE },
  },
};

const cache = new Map();

/**
 * Consulta a API; em caso de falha, lê o retrato local `/dados/<nome>.json` (mesmo formato).
 * @returns {{ data: object[], origem: 'api' | 'retrato', atualizadoEm?: string }}
 */
export async function consultar(nome, { retrato } = {}) {
  if (cache.has(nome)) return cache.get(nome);
  const tarefa = (async () => {
    try {
      const r = await fetch(urlConsulta(CONSULTAS[nome]), { cache: 'no-store' });
      if (!r.ok) throw new Error(`API ${r.status}`);
      const j = await r.json();
      return { data: j.data, origem: 'api' };
    } catch (e) {
      if (!retrato) throw e;
      const r = await fetch(retrato);
      const j = await r.json();
      return { data: j.data, origem: 'retrato', atualizadoEm: j.atualizadoEm };
    }
  })();
  cache.set(nome, tarefa);
  return tarefa;
}
