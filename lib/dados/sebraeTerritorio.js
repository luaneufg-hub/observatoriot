// Sebrae no território: programas e iniciativas em cada município.
//
// Programas com dado REAL vêm da dimensão "Jornada" do cube RF da API do Observatório
// (cada município marcado Sim/Não). Os 8 programas dessa dimensão têm retrato real em
// /public/dados/programas (gerado por scripts/retrato-programa.mjs, nov. 2026).
// Programas de atendimento (Sebrae Delas, ALI, Educação Empreendedora) dependem do
// cube de Atendimentos Sebrae: fictícios até lá.
import { API } from '@/lib/api/observatorio';
import { geo } from '@/lib/geo';
import { carregarIGs } from './ig';

const TOKEN = process.env.NEXT_PUBLIC_OBS_TOKEN || '';

export const PROGRAMAS = [
  {
    id: 'jornada',
    nome: 'Jornada Territorial Sebrae',
    sobre: 'Municípios incluídos na Jornada Territorial do Sebrae.',
    nivel: ['Territorial Journey Sebrae', 'Municipality Jornada'],
    cor: '#2A4FDA',
  },
  {
    id: 'sala',
    nome: 'Sala do Empreendedor',
    sobre: 'Espaço de atendimento ao empreendedor no município: formalização, MEI, orientação e acesso a serviços.',
    nivel: ['Entrepreneur Room', 'Municipality SALA'],
    cor: '#36BF76',
  },
  {
    id: 'cidade',
    nome: 'Cidade Empreendedora',
    sobre: 'Programa do Sebrae com a prefeitura para melhorar o ambiente de negócios local.',
    nivel: ['Entrepreneurial City', 'Municipality CE'],
    cor: '#D81E5B',
  },
  {
    id: 'pspe',
    nome: 'Prêmio Prefeitura Empreendedora',
    sobre: 'Prefeituras participantes do prêmio que reconhece políticas de apoio aos pequenos negócios.',
    nivel: ['Entrepreneurial City Hall', 'Municipality PSPE'],
    cor: '#F1573B',
  },
  {
    id: 'te',
    nome: 'Território Empreendedor',
    sobre: 'Municípios em territórios do programa Território Empreendedor.',
    nivel: ['Entrepreneurial Territory', 'Municipality TE'],
    cor: '#A093D1',
  },
  {
    id: 'ats',
    nome: 'Agente Territorial Sebrae',
    sobre: 'Municípios com Agente Territorial Sebrae (ATS) em atuação.',
    nivel: ['Territorial Agent Sebrae', 'Municipality ATS'],
    cor: '#DA7400',
  },
  {
    id: 'rp',
    nome: 'Relação com a prefeitura',
    sobre: 'Municípios com relacionamento institucional do Sebrae com a prefeitura.',
    nivel: ['City Hall Relationship', 'Municipality RP'],
    cor: '#0A2474',
  },
  {
    id: 'ig',
    nome: 'Indicação Geográfica',
    sobre: 'Municípios em área de Indicação Geográfica reconhecida pelo INPI (Indicação de Procedência ou Denominação de Origem).',
    nivel: ['Geographical Indication', 'Municipality IG'],
    cor: '#8A9136',
  },
  // programas de atendimento (cube Sebrae_Atendimento): "participa" = teve atendimento de alguma
  // iniciativa do programa em 2025 (as iniciativas foram escolhidas pelo nome: Delas, ALI, Educação Empreendedora)
  { id: 'delas', nome: 'Sebrae Delas', sobre: 'Programa do Sebrae para mulheres empreendedoras. Participa: município com atendimento do programa em 2025.', cor: '#DF57B1', atendimento: true },
  { id: 'ali', nome: 'ALI · Agentes de Inovação', sobre: 'Agentes que levam inovação aos pequenos negócios. Participa: município com atendimento do programa em 2025.', cor: '#60B466', atendimento: true },
  { id: 'educacao', nome: 'Educação Empreendedora', sobre: 'Empreendedorismo nas escolas e na formação de professores. Participa: município com atendimento do programa em 2025, inclusive os atendimentos nacionais a distância.', cor: '#C9DF60', atendimento: true },
];

export const PROGRAMA_BY_ID = Object.fromEntries(PROGRAMAS.map((p) => [p.id, p]));

// retratos reais disponíveis em /public/dados/programas/<id>.json
const RETRATOS = new Set(['jornada', 'ig', 'sala', 'cidade', 'pspe', 'te', 'ats', 'rp', 'delas', 'ali', 'educacao']);

export function urlPrograma(p) {
  const q = new URLSearchParams({ cube: 'RF', drilldowns: p.nivel.join(','), measures: 'Establishments', locale: 'pt' });
  if (TOKEN) q.set('token', TOKEN);
  return `${API}/data.jsonrecords?${q.toString()}`;
}

function sorte(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 100000) / 100000;
}

// participação fictícia: proporção típica por programa, maior em municípios grandes
const TAXA = { sala: 0.55, cidade: 0.25, pspe: 0.18, te: 0.35, ats: 0.3, rp: 0.6, ig: 0.04, delas: 0.4, ali: 0.22, educacao: 0.5 };
function ficticio(p, base) {
  const set = new Set();
  const t = TAXA[p.id] ?? 0.3;
  for (const m of base.lista) {
    const peso = Math.min(1, (base.peso.get(m.cod) || 0) * 40);
    if (sorte(`${p.id}-${m.cod}`) < t * (m.cap ? 1.5 : 0.6 + peso)) set.add(m.cod);
  }
  return set;
}

/** Lê um registro da API (jsonrecords) e devolve o conjunto de municípios "Sim" */
function simDaAPI(p, linhas) {
  const [n1, n2] = p.nivel;
  const set = new Set();
  for (const r of linhas) if (r[`${n1} ID`] === 1 || r[n1] === 'Sim') set.add(r[`${n2} ID`]);
  return set;
}

const cache = new Map();
/**
 * @returns {Promise<{ sim: Set<number>, real: boolean, origem: string, atualizadoEm?: string }>}
 */
export function carregarPrograma(p, base) {
  if (cache.has(p.id)) return cache.get(p.id);
  const tarefa = (async () => {
    // indicação geográfica: a fonte é a lista oficial do INPI (municípios da delimitação de cada IG)
    if (p.id === 'ig') {
      const { igs } = await carregarIGs();
      if (igs.length) return { sim: new Set(igs.flatMap((i) => i.municipios)), real: true, origem: 'INPI · listas de IP e DO reconhecidas (out. 2026)' };
    }
    if (!p.atendimento) {
      // 1. API em tempo real
      try {
        const r = await fetch(urlPrograma(p), { cache: 'no-store' });
        if (r.ok) {
          const j = await r.json();
          if (Array.isArray(j.data) && j.data.length) return { sim: simDaAPI(p, j.data), real: true, origem: 'API do Observatório' };
        }
      } catch {
        /* sem API (rede, CORS, chave): segue para o retrato */
      }
    }
    // 2. último retrato salvo (os de atendimento só existem como retrato)
    if (RETRATOS.has(p.id)) {
      try {
        const j = await fetch(geo(`../dados/programas/${p.id}.json`)).then((r) => r.json());
        return { sim: new Set(j.sim), real: true, origem: j.origem, atualizadoEm: j.atualizadoEm };
      } catch {
        /* segue */
      }
    }
    // 3. fictício, marcado na tela
    return { sim: ficticio(p, base), real: false, origem: p.atendimento ? 'aguardando cube de Atendimentos Sebrae' : 'aguardando consulta da API' };
  })();
  cache.set(p.id, tarefa);
  return tarefa;
}

export async function carregarProgramas(base) {
  const r = await Promise.all(PROGRAMAS.map((p) => carregarPrograma(p, base)));
  return Object.fromEntries(PROGRAMAS.map((p, i) => [p.id, r[i]]));
}
