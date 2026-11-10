// Escalas de cor e expressões de estilo (data-driven styling) para o MapLibre/Mapbox.
import { quantile } from 'd3-array';
import { interpolateLab, piecewise } from 'd3-interpolate';
import { color as d3color } from 'd3-color';
import { BIOMAS, BIOMA_BY_ID } from '@/lib/dados/biomas';

// Mapa padrão (empresas): verde, amarelo e bege — do menor para o maior valor.
// Bege → amarelo → verdes, como na referência do potencial territorial.
export const RAMPA_EMPRESAS = ['#F2EBDD', '#E6CF8C', '#B9D7BF', '#6BAE8E', '#2F6551'];

// Indicadores de bioma: rampas dos mapas de bioma do UI Kit
export const PALETAS_BIOMA = {
  mataAtlantica: ['#EBECB7', '#CACE34', '#899136', '#797900'],
  pantanal: ['#F5E6CC', '#F7C784', '#FFB956', '#F8A928', '#C77D00'],
  caatinga: ['#EEDDCB', '#E8BC92', '#D79D60', '#DA7400', '#A35600'],
  cerrado: ['#E1B9BC', '#714F51', '#753335', '#71040B'],
  amazonia: ['#DFBED4', '#DFACCF', '#DF9DC9', '#E18AC2', '#DF57B1'],
  pampa: ['#F8C0D1', '#D5AFB9', '#D55B7A', '#D60838', '#9F072F'],
};

// Destaques (prancha): base cinza + uma cor de destaque
export const PRANCHA = { base: '#E2DFD8', dim: '#EFEEEA', cor: '#DF57B1', escura: '#D81E5B' };

export const BASE = '#F7F3EC'; // sem dado / fora do recorte
export const DIM = '#EDE9E2';
export const COR_SIGLA = '#232122';

const STEPS = [0, 0.25, 0.5, 0.75, 1];

export function rampaBioma(id) {
  const f = piecewise(interpolateLab, PALETAS_BIOMA[id]);
  return STEPS.map((t) => f(t));
}
export function rampaPrancha(cor = PRANCHA.cor) {
  return [0.16, 0.32, 0.5, 0.7, 0.9].map((t) => interpolateLab(PRANCHA.base, cor)(t));
}
export const escurecer = (c, k = 0.32) => interpolateLab(c, '#151515')(k);

/**
 * Define as classes (5) para um indicador.
 * - numérico: quintis dos valores visíveis
 * - % de bioma: limiares fixos 0,5 / 25 / 50 / 75
 */
export function classes(ind, valores, modo = 'coropletico') {
  if (ind.unidade === 'cat') {
    const cores = Object.fromEntries(
      BIOMAS.map((b) => [b.id, modo === 'destaques' ? interpolateLab(PRANCHA.base, b.cor)(0.72) : b.cor]),
    );
    return { tipo: 'cat', cores };
  }
  let cores;
  if (modo === 'destaques') cores = rampaPrancha(ind.biomaId ? BIOMA_BY_ID[ind.biomaId].cor : PRANCHA.cor);
  else cores = ind.biomaId ? rampaBioma(ind.biomaId) : RAMPA_EMPRESAS;

  if (ind.biomaId) return { tipo: 'seq', limites: [0.5, 25, 50, 75], cores: [null, ...cores.slice(1)], rotulos: ['até 25%', '25–50%', '50–75%', '75–100%'] };

  const v = valores.filter((x) => x != null && !Number.isNaN(x)).sort((a, b) => a - b);
  const limites = [0.2, 0.4, 0.6, 0.8].map((p) => quantile(v, p));
  return { tipo: 'seq', limites, cores, min: v[0], max: v[v.length - 1] };
}

/** Classe (0..4) de um valor, para legenda/hachura */
export function classeDe(c, v) {
  if (v == null) return -1;
  let i = 0;
  while (i < c.limites.length && v >= c.limites[i]) i++;
  return i;
}
export function corDe(c, v) {
  if (c.tipo === 'cat') return c.cores[v] || BASE;
  const i = classeDe(c, v);
  return i < 0 ? BASE : c.cores[i] || BASE;
}

/**
 * Expressão de cor (Mapbox/MapLibre style spec) lendo o valor do feature-state.
 * O valor é aplicado com map.setFeatureState(), sem reprocessar a geometria —
 * por isso trocar de indicador é instantâneo mesmo com os 5.570 municípios.
 */
export function expressaoCor(c, { base = BASE } = {}) {
  if (c.tipo === 'cat') {
    const pares = Object.entries(c.cores).flat();
    return ['match', ['coalesce', ['feature-state', 'cat'], ''], ...pares, base];
  }
  const step = ['step', ['feature-state', 'v'], c.cores[0] || base];
  c.limites.forEach((l, i) => step.push(l, c.cores[i + 1] || base));
  return ['case', ['==', ['typeof', ['feature-state', 'v']], 'number'], step, base];
}

/** Hachura no quintil superior (prancha): opacidade 1 só na última classe */
export function expressaoHachura(c) {
  if (c.tipo === 'cat') return c.forte ? ['case', ['boolean', ['feature-state', 'forte'], false], 1, 0] : 0;
  const ult = c.limites[c.limites.length - 1];
  return ['case', ['all', ['==', ['typeof', ['feature-state', 'v']], 'number'], ['>=', ['feature-state', 'v'], ult]], 1, 0];
}

export function luminancia(c) {
  const { r, g, b } = d3color(c).rgb();
  const lin = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
/** Sigla em #232122 ou branco, pelo maior contraste com o preenchimento */
export function corDoRotulo(fundo) {
  const f = luminancia(fundo);
  const s = luminancia(COR_SIGLA);
  return (f + 0.05) / (s + 0.05) >= 1.05 / (f + 0.05) ? COR_SIGLA : '#FFFFFF';
}
export const hexParaRgb = (h) => {
  const { r, g, b } = d3color(h).rgb();
  return [r, g, b];
};
