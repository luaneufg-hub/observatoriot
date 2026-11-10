'use client';
// Página "Estudos": estudos especiais do Observatório (protótipo, página 3).
// Capa · Impulsionar Negócios · Potencial exportador das MPEs para a UE · Infográficos e materiais.
// Os dois últimos aguardam os dados dos estudos (chegam caso a caso).
import { useEffect, useMemo, useState } from 'react';
import { geoIdentity, geoPath } from 'd3-geo';
import ImpulsionarNegocios from './ImpulsionarNegocios';
import { geo } from '@/lib/geo';
import { asset } from '@/lib/asset';
import CorteSecao from '../CorteSecao';
import PotencialExportador from './PotencialExportador';

/* capa: mapa do Brasil em verde com barras, enquanto a colagem do protótipo não chega */
function MapaCapa() {
  const [fc, setFc] = useState(null);
  useEffect(() => {
    fetch(geo('ufs.json'))
      .then((r) => r.json())
      .then(setFc)
      .catch(() => {});
  }, []);
  const d = useMemo(() => {
    if (!fc) return null;
    const p = geoPath(geoIdentity().reflectY(true).fitSize([420, 420], fc));
    return fc.features.map((f) => p(f));
  }, [fc]);
  return (
    <svg viewBox="0 0 520 440" className="h-auto w-full max-w-[520px]" aria-hidden>
      <g transform="translate(10 10)">
        {d?.map((p, i) => (
          <path key={i} d={p} fill="#60B466" stroke="#C9DF60" strokeWidth="1.2" />
        ))}
      </g>
      {/* barras do símbolo do Observatório */}
      <g fill="#60B466" transform="translate(430 150) skewX(-10)">
        <rect x="0" y="150" width="22" height="70" rx="3" />
        <rect x="32" y="100" width="22" height="120" rx="3" />
        <rect x="64" y="20" width="22" height="200" rx="3" />
      </g>
    </svg>
  );
}

function EmPreparacao({ id, titulo, texto }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="bg-tema-bg px-4 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div className="mx-auto max-w-[1240px]">
        <h2 id={`${id}-titulo`} className="font-display text-[clamp(36px,4.6vw,60px)] font-extrabold leading-[0.98] tracking-[-0.02em] text-tema-tinta [text-wrap:balance]">
          {titulo}
        </h2>
        <div className="mt-8 rounded-[28px] border-2 border-dashed border-tema-linha p-8 text-[15px] leading-relaxed text-tema-suave">
          <span className="mb-2 inline-block rounded-full bg-tema-linha px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] text-tema-tinta">em preparação</span>
          <p className="max-w-[70ch]">{texto}</p>
        </div>
      </div>
    </section>
  );
}

export default function Estudos({ base }) {
  return (
    <>
      {/* capa */}
      <section aria-labelledby="estudos-titulo" className="overflow-hidden bg-lima px-4 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto grid max-w-[1240px] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <p className="font-display text-[clamp(18px,1.8vw,24px)] font-extrabold text-navy">Estudos de</p>
            <h1 id="estudos-titulo" className="font-display text-[clamp(44px,7vw,104px)] font-extrabold leading-[0.95] tracking-[-0.02em] text-navy">
              Oportunidades
            </h1>
            <p className="mt-2 font-display text-[clamp(22px,2.4vw,32px)] font-bold text-navy">e desafios para Pequenos Negócios</p>
            <p className="mt-6 max-w-[52ch] text-[15.5px] leading-relaxed text-navy">
              Os estudos especiais do Observatório reunidos num só lugar: os relatórios do Impulsionar Negócios em cada estado, o potencial exportador das micro e pequenas
              empresas e os materiais de apoio para quem planeja ações nos territórios.
            </p>
            <nav aria-label="Estudos nesta página" className="mt-8 flex flex-wrap gap-2">
              {[
                ['#impulsionar', 'Impulsionar negócios'],
                ['#exportador', 'Potencial exportador'],
                ['#materiais', 'Infográficos e materiais'],
              ].map(([h, t]) => (
                <a
                  key={h}
                  href={h}
                  onClick={(e) => {
                    e.preventDefault();
                    document.querySelector(h)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="rounded-full bg-navy px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-azul"
                >
                  {t}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex justify-center lg:justify-end">
            <MapaCapa />
          </div>
        </div>
      </section>

      <ImpulsionarNegocios base={base} />

      <CorteSecao para="exportador" rotulo="Potencial exportador das MPEs para a UE" />
      <section id="exportador" aria-labelledby="exportador-titulo" className="bg-tema-bg px-4 pb-14 pt-12 sm:px-8 lg:px-12 lg:pb-20 lg:pt-16">
        <div className="mx-auto max-w-[1240px]">
          <h2 id="exportador-titulo" className="font-display text-[clamp(36px,4.6vw,64px)] font-extrabold leading-[0.98] tracking-[-0.02em] text-tema-tinta">
            Potencial exportador
            <br />
            das MPEs para a UE
          </h2>
          {/* bandeiras da UE e do Mercosul "apoiadas" no painel, como no protótipo */}
          <div className="relative mt-6">
            <img
              src={asset('estudos/bandeiras-ue-mercosul.webp')}
              alt="Bandeiras da União Europeia e do Mercosul lado a lado"
              className="relative z-10 mx-auto -mb-[12%] block h-auto w-[min(440px,72%)] select-none sm:-mb-[9%]"
              loading="lazy"
            />
            <PotencialExportador />
          </div>
        </div>
      </section>
      <CorteSecao para="materiais" rotulo="Infográficos e materiais" />
      <EmPreparacao
        id="materiais"
        titulo="Infográficos e materiais"
        texto="Relatórios anuais, infográficos e apresentações do Observatório para baixar. Entram com a lista de materiais (título, link e capa)."
      />
    </>
  );
}
