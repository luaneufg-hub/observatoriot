// "Onde estou": transforma a posição do navegador (lon, lat) em UF e município,
// usando as próprias malhas do Observatório (ponto-no-polígono). Sem serviço externo.
import { geo } from '@/lib/geo';

/** ponto dentro de um anel (ray casting) */
function noAnel(x, y, anel) {
  let dentro = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i];
    const [xj, yj] = anel[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

function noPoligono(x, y, aneis) {
  if (!noAnel(x, y, aneis[0])) return false;
  for (let k = 1; k < aneis.length; k++) if (noAnel(x, y, aneis[k])) return false; // buraco
  return true;
}

export function contem(geometria, lon, lat) {
  if (!geometria) return false;
  if (geometria.type === 'Polygon') return noPoligono(lon, lat, geometria.coordinates);
  if (geometria.type === 'MultiPolygon') return geometria.coordinates.some((p) => noPoligono(lon, lat, p));
  return false;
}

const cacheJSON = new Map();
function json(arquivo) {
  if (!cacheJSON.has(arquivo)) cacheJSON.set(arquivo, fetch(geo(arquivo)).then((r) => r.json()));
  return cacheJSON.get(arquivo);
}

/**
 * @returns {{ uf: string, cod: number|null, foraDoBrasil?: boolean }}
 * Se o ponto cair fora das malhas (litoral simplificado, fronteira), usa o centróide mais próximo.
 */
export async function localizarPonto(lon, lat, base) {
  const ufs = await json('ufs.json');
  let uf = ufs.features.find((f) => contem(f.geometry, lon, lat))?.properties.uf;

  // fora de qualquer UF: município mais próximo (até ~60 km); além disso, fora do Brasil
  if (!uf) {
    let melhor = null;
    let d = Infinity;
    for (const m of base.lista) {
      const dd = (m.lon - lon) ** 2 + (m.lat - lat) ** 2;
      if (dd < d) {
        d = dd;
        melhor = m;
      }
    }
    if (!melhor || d > 0.3) return { uf: null, cod: null, foraDoBrasil: true };
    return { uf: melhor.uf, cod: melhor.cod };
  }

  const mun = await json(`municipios/${uf}.json`);
  const f = mun.features.find((k) => contem(k.geometry, lon, lat));
  if (f) return { uf, cod: f.properties.cod };
  // borda simplificada: município da UF com centróide mais próximo
  const ms = base.porUF[uf] || [];
  let melhor = ms[0];
  let d = Infinity;
  for (const m of ms) {
    const dd = (m.lon - lon) ** 2 + (m.lat - lat) ** 2;
    if (dd < d) {
      d = dd;
      melhor = m;
    }
  }
  return { uf, cod: melhor?.cod ?? null };
}

/** Pede a posição ao navegador. Rejeita com { motivo: 'negado' | 'indisponivel' | 'tempo' | 'sem-suporte' } */
export function pedirPosicao() {
  return new Promise((ok, falha) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return falha({ motivo: 'sem-suporte' });
    navigator.geolocation.getCurrentPosition(
      (p) => ok({ lon: p.coords.longitude, lat: p.coords.latitude, precisao: p.coords.accuracy }),
      (e) => falha({ motivo: e.code === 1 ? 'negado' : e.code === 3 ? 'tempo' : 'indisponivel' }),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 10 * 60 * 1000 },
    );
  });
}
