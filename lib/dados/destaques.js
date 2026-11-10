// Visualização "Destaques": em que setor cada estado/município se destaca.
//
// Destaque = setor com maior quociente locacional (QL): participação do setor nas empresas
// do lugar ÷ participação do mesmo setor no Brasil. QL > 1: concentração acima da média.
// "Forte" (hachura no mapa) = QL ≥ 1,5.
//
// UF e município: QL com dados REAIS (pequenos negócios ativos por Setor SEBRAE, API do
// Observatório, cubo RF). Se o retrato municipal faltar, cai no perfil fictício abaixo.
import { DADOS } from './indicadores';
import { UFS } from './ufs';

export const SETORES_DESTAQUE = [
  { id: 'agro', campo: 'setor_agro', rotulo: 'Agro', icone: 'agro', cor: '#8FBF3A' },
  { id: 'comercio', campo: 'setor_comercio', rotulo: 'Comércio', icone: 'comercio', cor: '#DC1761' },
  { id: 'industria', campo: 'setor_industria', rotulo: 'Indústria', icone: 'industria', cor: '#F1573B' },
  { id: 'servicos', campo: 'setor_servicos', rotulo: 'Serviços', icone: 'servicos', cor: '#7B6FC2' },
];
export const SETOR_DESTAQUE_BY_ID = Object.fromEntries(SETORES_DESTAQUE.map((s) => [s.id, s]));
export const QL_FORTE = 1.5;

const total = (d) => SETORES_DESTAQUE.reduce((a, s) => a + d[s.campo], 0);
export const PART_BR = (() => {
  const soma = Object.fromEntries(SETORES_DESTAQUE.map((s) => [s.id, 0]));
  let t = 0;
  for (const u of UFS) {
    const d = DADOS[u.sigla];
    for (const s of SETORES_DESTAQUE) soma[s.id] += d[s.campo];
    t += total(d);
  }
  return Object.fromEntries(SETORES_DESTAQUE.map((s) => [s.id, soma[s.id] / t]));
})();

function melhor(part) {
  let best = null;
  const qls = {};
  for (const s of SETORES_DESTAQUE) {
    const ql = part[s.id] / PART_BR[s.id];
    qls[s.id] = ql;
    if (!best || ql > best.ql) best = { setor: s.id, ql };
  }
  return { ...best, qls, forte: best.ql >= QL_FORTE };
}

export function participacoesUF(sigla) {
  const d = DADOS[sigla];
  const t = total(d);
  return Object.fromEntries(SETORES_DESTAQUE.map((s) => [s.id, d[s.campo] / t]));
}

/** Map(sigla → { setor, ql, qls, forte }) */
export const DESTAQUES_UF = new Map(UFS.map((u) => [u.sigla, melhor(participacoesUF(u.sigla))]));

function sorte(chave) {
  let h = 2166136261;
  for (let i = 0; i < chave.length; i++) h = Math.imul(h ^ chave.charCodeAt(i), 16777619);
  return ((h >>> 0) % 100000) / 100000;
}

// FICTÍCIO: perfil setorial do município = perfil do estado com variação local
// (municípios pequenos mais agro; capitais mais serviços).
function participacoesMunicipio(m, pesoNoEstado) {
  const base = participacoesUF(m.uf);
  const porte = Math.min(1, (pesoNoEstado || 0) * 25);
  const out = {};
  let t = 0;
  for (const s of SETORES_DESTAQUE) {
    const z = sorte(`${m.cod}-${s.id}`) * 2 - 1; // −1…1
    let f = Math.exp(z * 0.9);
    if (s.id === 'agro') f *= m.cap ? 0.3 : 1.25 - porte * 0.6;
    if (s.id === 'servicos') f *= m.cap ? 1.5 : 0.85 + porte * 0.5;
    out[s.id] = base[s.id] * f;
    t += out[s.id];
  }
  for (const k of Object.keys(out)) out[k] /= t;
  return out;
}

// REAL: participação de cada setor nos pequenos negócios ativos do município (API, cubo RF).
// Indústria inclui a construção, como no mapa.
function participacoesReais(st) {
  const v = { agro: st.agro, comercio: st.comercio, industria: st.industria + st.construcao, servicos: st.servicos };
  const t = v.agro + v.comercio + v.industria + v.servicos;
  if (!t) return null;
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x / t]));
}

const cacheMun = new WeakMap();
/** Map(cod → { setor, ql, qls, forte, ficticio }) */
export function destaquesMunicipais(base) {
  if (cacheMun.has(base)) return cacheMun.get(base);
  const out = new Map();
  for (const m of base.lista) {
    const st = base.setor?.get(m.cod);
    const real = st && participacoesReais(st);
    if (real) out.set(m.cod, { ...melhor(real), ficticio: false });
    else out.set(m.cod, { ...melhor(participacoesMunicipio(m, base.peso.get(m.cod))), ficticio: true });
  }
  cacheMun.set(base, out);
  return out;
}

/** Classes para o mapa (categórico por setor, hachura quando QL ≥ 1,5) */
export const CLASSES_DESTAQUE = {
  tipo: 'cat',
  forte: true,
  cores: Object.fromEntries(SETORES_DESTAQUE.map((s) => [s.id, s.cor])),
};
