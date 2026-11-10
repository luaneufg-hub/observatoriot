'use client';
// Mapa leve da versão mobile (SVG, d3-geo): estados do Brasil ou municípios de um estado,
// coloridos pela cobertura do Sebrae (empresas atendidas ÷ pequenos negócios ativos, 2025).
// Toque num estado ou município para selecioná-lo. Os pinos são os próximos eventos do Calendário DITEC.
import { useEffect, useMemo, useState } from 'react';
import { geoArea, geoMercator, geoPath } from 'd3-geo';
import { geo } from '@/lib/geo';
import { RAMPA_EMPRESAS, BASE } from '@/lib/escalas';
import RF_UF from '@/lib/dados/retratos/rf-mpe-ativas-uf.json';
import ATEND from '@/lib/dados/retratos/sebrae-atendimentos.json';
import { UF_BY_SIGLA } from '@/lib/dados/ufs';

const W = 360;
const H = 300;
const cacheGeo = new Map();
const carregar = (arq) => {
  if (!cacheGeo.has(arq)) cacheGeo.set(arq, fetch(geo(arq)).then((r) => r.json()).then(acertarOrientacao));
  return cacheGeo.get(arq);
};

// O d3-geo espera os anéis no sentido horário; o GeoJSON padrão (RFC 7946) vem no anti-horário.
// Sem acertar, cada polígono vira o "resto do mundo" e o mapa aparece como um retângulo.
function acertarOrientacao(fc) {
  for (const f of fc.features) {
    if (geoArea(f) > 2 * Math.PI) {
      const g = f.geometry;
      const polis = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
      for (const poli of polis) for (const anel of poli) anel.reverse();
    }
  }
  return fc;
}

function quintis(valores) {
  const v = valores.filter((x) => x != null && Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return [];
  return [0.2, 0.4, 0.6, 0.8].map((q) => v[Math.floor(q * (v.length - 1))]);
}
const classe = (lim, x) => {
  if (x == null) return -1;
  let i = 0;
  while (i < lim.length && x > lim[i]) i++;
  return i;
};

export default function MapaMini({ t, base, onEscolher, pinos = [] }) {
  const [fc, setFc] = useState(null);
  const arq = t.uf ? `municipios/${t.uf}.json` : 'ufs.json';
  useEffect(() => {
    let vivo = true;
    setFc(null);
    carregar(arq).then((j) => vivo && setFc(j));
    return () => {
      vivo = false;
    };
  }, [arq]);

  const cobertura = useMemo(() => {
    const m = new Map();
    if (!t.uf) {
      for (const [uf, r] of Object.entries(RF_UF.uf)) {
        const at = ATEND.uf[uf]?.[2025]?.clientesPJ;
        const tot = r.epp + r.me + r.mei;
        if (at != null && tot) m.set(uf, at / tot);
      }
    } else if (base) {
      for (const mu of base.porUF[t.uf] || []) {
        const at = base.atend.get(mu.cod)?.[2];
        const v = base.mpe.get(mu.cod);
        const tot = v ? v[0] + v[1] + v[2] : 0;
        if (at != null && tot) m.set(mu.cod, Math.min(at / tot, 1.5));
      }
    }
    return m;
  }, [t.uf, base]);
  const lim = useMemo(() => quintis([...cobertura.values()]), [cobertura]);

  const { caminho, proj } = useMemo(() => {
    if (!fc) return {};
    const p = geoMercator().fitExtent([[8, 8], [W - 8, H - 8]], fc);
    return { caminho: geoPath(p), proj: p };
  }, [fc]);

  const chave = (f) => (t.uf ? f.properties.cod : f.properties.uf);
  const nomeDe = (f) => (t.uf ? f.properties.nome : UF_BY_SIGLA[f.properties.uf]?.nome);
  const escolher = (f) => {
    if (!t.uf) onEscolher({ uf: f.properties.uf });
    else {
      const mun = base?.porCod.get(f.properties.cod);
      if (mun) onEscolher({ uf: t.uf, mun });
    }
  };
  const sel = t.mun?.cod;

  return (
    <figure className="overflow-hidden rounded-[22px] border border-tema-linha bg-[var(--tema-mapa)]">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="group" aria-label={t.uf ? `Mapa dos municípios de ${UF_BY_SIGLA[t.uf].nome}` : 'Mapa dos estados do Brasil'}>
        {!fc && <rect width={W} height={H} fill="transparent" />}
        {fc &&
          fc.features.map((f) => {
            const k = chave(f);
            const c = classe(lim, cobertura.get(k));
            const ativo = t.uf && !t.mun ? false : k === sel;
            return (
              <path
                key={k}
                d={caminho(f)}
                fill={c < 0 ? BASE : RAMPA_EMPRESAS[c]}
                stroke={ativo ? '#070568' : '#ffffff'}
                strokeWidth={ativo ? 2 : t.uf ? 0.35 : 0.8}
                className="cursor-pointer outline-none transition-opacity hover:opacity-80 focus-visible:opacity-70"
                tabIndex={t.uf ? -1 : 0}
                role={t.uf ? undefined : 'button'}
                aria-label={t.uf ? undefined : nomeDe(f)}
                onClick={() => escolher(f)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), escolher(f))}
              >
                <title>{nomeDe(f)}</title>
              </path>
            );
          })}
        {proj &&
          pinos.map((p) => {
            const xy = proj([p.mun.lon, p.mun.lat]);
            if (!xy) return null;
            return (
              <g key={p.id} transform={`translate(${xy[0]} ${xy[1]})`} aria-hidden="true">
                <path d="M0 0c-5-6-8-9.5-8-13a8 8 0 0 1 16 0c0 3.5-3 7-8 13Z" fill="#D81E5B" stroke="#fff" strokeWidth="1.2" />
                <circle cy="-13" r="2.6" fill="#fff" />
              </g>
            );
          })}
        {proj && t.mun && (() => {
          const xy = proj([t.mun.lon, t.mun.lat]);
          return xy ? <circle cx={xy[0]} cy={xy[1]} r="5" fill="#C9DF60" stroke="#070568" strokeWidth="2" aria-hidden="true" /> : null;
        })()}
      </svg>
      <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-tema-linha bg-tema-card px-4 py-2.5 text-[11px] text-tema-suave">
        <span className="flex items-center gap-1.5">
          <span className="flex">
            {RAMPA_EMPRESAS.map((c) => (
              <span key={c} className="h-2.5 w-3" style={{ background: c }} />
            ))}
          </span>
          cobertura do Sebrae em 2025 (menor → maior)
        </span>
        {pinos.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#D81E5B]" /> próximos eventos DITEC
          </span>
        )}
      </figcaption>
    </figure>
  );
}
