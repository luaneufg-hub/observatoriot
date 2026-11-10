// Indicações geográficas (INPI): listas oficiais de IP e DO reconhecidas, com os municípios
// lidos da delimitação de cada IG (scripts/retrato-ig-inpi.py).
import { asset } from '@/lib/asset';

let cache = null;
/** @returns {Promise<{ igs: object[], porMun: Map<number, object[]>, fonte: string }>} */
export function carregarIGs() {
  if (cache) return cache;
  cache = fetch(asset('dados/inpi/indicacoes-geograficas.json'))
    .then((r) => r.json())
    .then((j) => {
      const igs = j.igs.map((ig, i) => ({ ...ig, id: `${ig.numero || 'ig'}-${i}`, ano: ig.data?.slice(-4), ordem: ig.data ? ig.data.split('/').reverse().join('') : '' }));
      const porMun = new Map();
      for (const ig of igs) for (const c of ig.municipios) (porMun.get(c) || porMun.set(c, []).get(c)).push(ig);
      return { igs, porMun, fonte: j.fonte };
    })
    .catch(() => ({ igs: [], porMun: new Map(), fonte: '' }));
  return cache;
}

/** Produto em texto curto: até a primeira vírgula, dois-pontos ou parêntese */
export const produtoCurto = (p = '') => {
  let t = p.split(/[:(;]| - /)[0].replace(/\s+/g, ' ').trim().replace(/\.$/, '');
  if (t.length > 38) t = t.split(',')[0].trim();
  return t;
};
