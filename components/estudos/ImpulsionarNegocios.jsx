'use client';
// Impulsionar Negócios: relatórios da estratégia setor-território por estado (Fase 1, Fase 2 e
// perfil no Observatório). Mapa clicável + filtros de Estado, Município e Fase, como no protótipo,
// com a opção de comparar duas regiões lado a lado. Links: lib/dados/impulsionar.js.
import { useEffect, useMemo, useRef, useState } from 'react';
import { geoIdentity, geoPath } from 'd3-geo';
import Icon from '../Icon';
import { Bandeira } from '../CaixaUF';
import { UFS, UF_BY_SIGLA } from '@/lib/dados/ufs';
import { IMPULSIONAR, FASES, FASE_BY_ID } from '@/lib/dados/impulsionar';
import { geo } from '@/lib/geo';

const SELECT =
  'h-12 w-full appearance-none rounded-2xl border border-transparent bg-off px-4 pr-10 text-[15px] text-[#232122] outline-none transition focus-visible:border-azul disabled:opacity-50 bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%232A4FDA%27 stroke-width=%272%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E")] bg-[length:20px] bg-[right_14px_center] bg-no-repeat';
const COR_LADO = ['var(--tema-numero)', '#D81E5B'];
const VAZIO = { uf: null, mun: null, fase: 'fase1' };

// regionais do Sebrae por município (public/dados/sebrae/regionais-municipio.json)
let regionaisCache = null;
function useRegionais() {
  const [r, setR] = useState(regionaisCache);
  useEffect(() => {
    if (regionaisCache) return;
    fetch(geo('../dados/sebrae/regionais-municipio.json'))
      .then((x) => x.json())
      .then((j) => {
        regionaisCache = j;
        setR(j);
      })
      .catch(() => {});
  }, []);
  return r;
}

let ufsCache = null;
function useUfs() {
  const [fc, setFc] = useState(ufsCache);
  useEffect(() => {
    if (ufsCache) return;
    fetch(geo('ufs.json'))
      .then((r) => r.json())
      .then((j) => {
        ufsCache = j;
        setFc(j);
      })
      .catch(() => {});
  }, []);
  return fc;
}

/* ------------------------------------------------------------------ mapa clicável */
function MapaUFs({ lados, onEscolher }) {
  const fc = useUfs();
  const [sobre, setSobre] = useState(null);
  const L = 520;
  const desenho = useMemo(() => {
    if (!fc) return null;
    const proj = geoIdentity().reflectY(true).fitSize([L, L], fc);
    const path = geoPath(proj);
    return fc.features.map((f) => ({ uf: f.properties.uf, d: path(f), c: path.centroid(f) }));
  }, [fc]);
  if (!desenho) return <div className="aspect-square w-full animate-pulse rounded-3xl bg-tema-linha" />;
  const ladoDe = (uf) => lados.findIndex((l) => l.uf === uf);
  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${L} ${L}`} className="block h-auto w-full" role="group" aria-label="Mapa do Brasil: escolha um estado">
        {desenho.map((u) => {
          const i = ladoDe(u.uf);
          return (
            <path
              key={u.uf}
              d={u.d}
              role="button"
              tabIndex={0}
              aria-label={`${UF_BY_SIGLA[u.uf].nome}${i >= 0 ? `, região ${i + 1}` : ''}`}
              aria-pressed={i >= 0}
              onClick={() => onEscolher(u.uf)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onEscolher(u.uf))}
              onMouseEnter={() => setSobre(u)}
              onMouseLeave={() => setSobre(null)}
              onFocus={() => setSobre(u)}
              onBlur={() => setSobre(null)}
              className="cursor-pointer outline-none transition-[fill,opacity] duration-200 focus-visible:opacity-80"
              fill={i >= 0 ? COR_LADO[i] : sobre?.uf === u.uf ? 'var(--tema-destaque)' : '#D7E2D2'}
              stroke="var(--tema-card)"
              strokeWidth="1.2"
            />
          );
        })}
        {lados.map(
          (l, i) =>
            l.uf && (
              <text key={i} x={desenho.find((u) => u.uf === l.uf)?.c[0]} y={desenho.find((u) => u.uf === l.uf)?.c[1]} textAnchor="middle" dy="0.35em" className="pointer-events-none select-none fill-white font-display text-[15px] font-extrabold">
                {l.uf}
              </text>
            ),
        )}
      </svg>
      {sobre && (
        <figcaption className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-xl bg-tema-card px-3 py-2 text-[13.5px] font-semibold text-tema-tinta shadow-flutuante">
          <Bandeira uf={sobre.uf} className="h-3.5 w-5" />
          {UF_BY_SIGLA[sobre.uf].nome}
        </figcaption>
      )}
    </figure>
  );
}

/* ------------------------------------------------------------------ relatórios de um estado */
function CartaoRelatorio({ fase, titulo, sub, href, ativo, observatorio, selo, apagado }) {
  const f = FASE_BY_ID[fase];
  const corpo = (
    <>
      <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-white/50 transition-colors duration-500 group-hover:bg-white/15 group-focus-visible:bg-white/15">
        <Icon name={f.icone} size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-bold uppercase tracking-[0.08em] opacity-75">{f.rotulo}</span>
        <span className="block font-display text-[17px] font-extrabold leading-tight">{titulo}</span>
        {sub && <span className="mt-0.5 block text-[13px] leading-snug">{sub}</span>}
        {selo && <span className="mt-1.5 inline-block rounded-full bg-[#050506] px-2 py-0.5 text-[11.5px] font-semibold text-white transition-colors duration-500 group-hover:bg-white group-hover:text-[#050506] group-focus-visible:bg-white group-focus-visible:text-[#050506]">{selo}</span>}
      </span>
      {href && (
        <svg viewBox="0 0 24 24" className="h-5 w-5 flex-none transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M7 17 17 7M8 7h9v9" />
        </svg>
      )}
    </>
  );
  const classe = 'group flex items-center gap-3 rounded-[20px] p-4 text-[#050506] transition';
  if (!href)
    return (
      <div className={`${classe} border border-dashed border-tema-linha !text-tema-suave`} aria-disabled="true">
        {corpo}
      </div>
    );
  return (
    <a href={href} target="_blank" rel="noreferrer" className={`${classe} deslize ${apagado ? 'opacity-60 hover:opacity-100 focus-visible:opacity-100' : ''}`} style={{ background: f.cor }} title={observatorio ? 'Abre a página da regional no Observatório' : 'Abre o relatório em nova aba'}>
      {corpo}
    </a>
  );
}

function Relatorios({ lado, n, base, regionais }) {
  const l = IMPULSIONAR[lado.uf];
  const mun = lado.mun && base ? base.porCod.get(lado.mun) : null;
  const regiao = mun && regionais ? regionais.mun[mun.cod] : null;
  const nomeRegiao = regiao ? regionais.regioes[regiao] : null;
  const daRegiao = regiao ? l.fase2.find((r) => r.regiao === regiao) : null;
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 flex-none place-items-center rounded-2xl bg-tema-linha">
          <Bandeira uf={lado.uf} className="h-8 w-11" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-tema-suave">{n ? `Região ${n} · ` : ''}Você está aqui</p>
          <p className="font-display text-[clamp(26px,3vw,40px)] font-extrabold leading-tight text-tema-tinta">{mun ? mun.nome : UF_BY_SIGLA[lado.uf].nome}</p>
          {mun && (
            <p className="text-[14px] text-tema-suave">
              {UF_BY_SIGLA[lado.uf].nome}
              {nomeRegiao && <> · regional Sebrae {nomeRegiao}</>}
            </p>
          )}
        </div>
      </div>
      <div className="mt-6 grid gap-3">
        <CartaoRelatorio fase="fase1" titulo="Indicadores para alocação de recursos" sub={`Relatório do estado · ${lado.uf}`} href={l.fase1} ativo={lado.fase === 'fase1'} />
        {l.fase2.length ? (
          [...l.fase2]
            .sort((a, b) => Number(b === daRegiao) - Number(a === daRegiao))
            .map((r) => (
              <CartaoRelatorio
                key={r.href}
                fase="fase2"
                titulo="Planejamento das soluções"
                sub={`Recorte: ${r.rotulo}${r.observatorio ? ' · página no Observatório' : ''}`}
                href={r.href}
                ativo={lado.fase === 'fase2' && (!daRegiao || r === daRegiao)}
                observatorio={r.observatorio}
                selo={r === daRegiao ? `regional de ${mun.nome}` : undefined}
                apagado={!!daRegiao && r !== daRegiao}
              />
            ))
        ) : (
          <CartaoRelatorio fase="fase2" titulo="Planejamento das soluções" sub="Ainda não disponível para este estado" ativo={lado.fase === 'fase2'} />
        )}
        <CartaoRelatorio fase="geral" titulo="Perfil do estado no Observatório" sub="Dados gerais do território" href={l.geral} ativo={lado.fase === 'geral'} />
      </div>
      {mun && nomeRegiao && !daRegiao && l.fase2.length > 0 && (
        <p className="mt-3 text-[13px] leading-snug text-tema-suave">
          A Fase 2 ainda não tem relatório da regional {nomeRegiao}, onde fica {mun.nome}. Os recortes disponíveis são de outras regionais do estado.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ filtros */
function Filtros({ lado, n, base, onMudar }) {
  const ufs = useMemo(() => [...UFS].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')), []);
  const muns = useMemo(() => (lado.uf && base ? [...(base.porUF[lado.uf] || [])].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')) : []), [lado.uf, base]);
  const p = `imp${n}`;
  return (
    <fieldset className="grid content-start gap-4">
      {n > 0 && <legend className="mb-2 font-display text-[22px] font-extrabold text-tema-tinta">Região {n}</legend>}
      <label htmlFor={`${p}-uf`} className="grid gap-1.5">
        <span className="text-[14px] font-semibold text-tema-tinta">Estado</span>
        <select id={`${p}-uf`} className={SELECT} value={lado.uf || ''} onChange={(e) => onMudar({ ...lado, uf: e.target.value || null, mun: null })}>
          <option value="">Selecione</option>
          {ufs.map((u) => (
            <option key={u.sigla} value={u.sigla}>
              {u.nome}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor={`${p}-mun`} className="grid gap-1.5">
        <span className="text-[14px] font-semibold text-tema-tinta">Município</span>
        <select id={`${p}-mun`} className={SELECT} disabled={!muns.length} value={lado.mun || ''} onChange={(e) => onMudar({ ...lado, mun: e.target.value ? +e.target.value : null })}>
          <option value="">{lado.uf ? 'Todo o estado' : 'Selecione um estado antes'}</option>
          {muns.map((m) => (
            <option key={m.cod} value={m.cod}>
              {m.nome}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor={`${p}-fase`} className="grid gap-1.5">
        <span className="text-[14px] font-semibold text-tema-tinta">Fase</span>
        <select id={`${p}-fase`} className={SELECT} value={lado.fase} onChange={(e) => onMudar({ ...lado, fase: e.target.value })}>
          {FASES.map((f) => (
            <option key={f.id} value={f.id}>
              {f.rotulo}: {f.curto}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}

/* ------------------------------------------------------------------ modal "sobre o diagnóstico" */
function Sobre({ aberto, onFechar }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal?.();
    if (!aberto && d.open) d.close();
  }, [aberto]);
  return (
    <dialog
      ref={ref}
      onClose={onFechar}
      onClick={(e) => e.target === ref.current && onFechar()}
      aria-labelledby="sobre-impulsionar"
      className="w-[min(640px,calc(100vw-32px))] rounded-[28px] bg-tema-card p-0 text-tema-tinta shadow-flutuante backdrop:bg-[#070568]/40"
    >
      <div className="p-7 sm:p-9">
        <div className="flex items-start justify-between gap-4">
          <h3 id="sobre-impulsionar" className="font-display text-[28px] font-extrabold leading-tight">
            Sobre o diagnóstico
          </h3>
          <button type="button" onClick={onFechar} className="grid h-10 w-10 flex-none place-items-center rounded-full hover:bg-tema-linha" aria-label="Fechar">
            <Icon name="fechar" size={20} />
          </button>
        </div>
        <div className="mt-4 grid gap-3 text-[15px] leading-relaxed text-tema-suave">
          <p>
            O Impulsionar Negócios organiza a estratégia setor-território do Sebrae: olha para os setores e os territórios de cada estado para decidir onde e como atuar
            com os pequenos negócios.
          </p>
          <p>
            <strong className="text-tema-tinta">Fase 1 — Indicadores para alocação de recursos.</strong> Reúne os indicadores de cada estado que orientam a distribuição
            de recursos entre setores e territórios.
          </p>
          <p>
            <strong className="text-tema-tinta">Fase 2 — Planejamento das soluções.</strong> Diagnóstico setor-território das regionais escolhidas, base para planejar as
            soluções do Sebrae em cada recorte.
          </p>
          <p>
            <strong className="text-tema-tinta">Geral.</strong> O perfil completo do estado no Observatório.
          </p>
        </div>
      </div>
    </dialog>
  );
}

/* ------------------------------------------------------------------ seção */
export default function ImpulsionarNegocios({ base }) {
  const regionais = useRegionais();
  const [lados, setLados] = useState([{ ...VAZIO }]);
  const [ativo, setAtivo] = useState(0);
  const [sobre, setSobre] = useState(false);
  const [aviso, setAviso] = useState('');
  const comparando = lados.length > 1;

  const mudar = (i, v) => {
    setAviso('');
    setAtivo(i);
    setLados((ls) => ls.map((l, k) => (k === i ? v : l)));
  };
  const doMapa = (uf) => mudar(ativo, { ...lados[ativo], uf, mun: null });
  const gerar = () => {
    const l = lados[0];
    if (!l.uf) return setAviso('Escolha um estado no mapa ou na lista.');
    if (comparando) return document.getElementById('impulsionar-relatorios')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const r = IMPULSIONAR[l.uf];
    const reg = l.mun && regionais ? regionais.mun[l.mun] : null;
    const daRegiao = reg ? r.fase2.find((x) => x.regiao === reg) : null;
    const href = l.fase === 'fase1' ? r.fase1 : l.fase === 'geral' ? r.geral : daRegiao ? daRegiao.href : r.fase2.length === 1 ? r.fase2[0].href : null;
    if (href) window.open(href, '_blank', 'noopener');
    else
      setAviso(
        !r.fase2.length
          ? 'A Fase 2 ainda não está disponível para este estado.'
          : reg
            ? 'A Fase 2 ainda não tem relatório da regional deste município. Veja os recortes disponíveis abaixo.'
            : 'Este estado tem mais de um recorte na Fase 2: escolha o município ou o relatório na lista abaixo.',
      );
  };

  return (
    <section id="impulsionar" aria-labelledby="impulsionar-titulo" className="bg-tema-bg px-4 py-16 sm:px-8 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] lg:items-start">
          <h2 id="impulsionar-titulo" className="font-display text-[clamp(40px,5vw,68px)] font-extrabold leading-[0.98] tracking-[-0.02em] text-tema-tinta">
            Impulsionar
            <br />
            negócios
          </h2>
          <p className="max-w-[56ch] text-[15px] leading-relaxed text-tema-suave lg:pt-2">
            Os relatórios da estratégia setor-território do Sebrae em cada estado: a Fase 1 traz os indicadores para alocar recursos; a Fase 2, o diagnóstico das regionais para
            planejar as soluções. Escolha um estado no mapa ou nos filtros.
          </p>
          <button type="button" onClick={() => setSobre(true)} className="flex items-center gap-2 self-start rounded-full py-1 pr-3 text-left text-[13px] leading-tight text-tema-suave transition hover:text-tema-tinta">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-tema-linha text-tema-tinta">
              <Icon name="info" size={20} />
            </span>
            Saiba mais
            <br />
            sobre o diagnóstico
          </button>
        </div>

        <div className="mt-10 grid gap-10 rounded-[28px] bg-tema-card p-6 shadow-card sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14">
          <div className="grid content-start gap-10">
            <div className={`grid gap-8 ${comparando ? 'sm:grid-cols-2' : ''}`}>
              {lados.map((l, i) => (
                <div key={i} onFocusCapture={() => setAtivo(i)} className={comparando && ativo === i ? 'rounded-2xl outline outline-2 outline-offset-8 outline-tema-linha' : ''}>
                  <Filtros lado={l} n={comparando ? i + 1 : 0} base={base} onMudar={(v) => mudar(i, v)} />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={gerar} className="h-12 rounded-2xl bg-lima px-6 font-display text-[16px] font-extrabold text-navy transition hover:brightness-105">
                Gerar relatório
              </button>
              <button
                type="button"
                onClick={() => {
                  setAviso('');
                  if (comparando) {
                    setLados((ls) => [ls[0]]);
                    setAtivo(0);
                  } else {
                    setLados((ls) => [ls[0], { ...VAZIO }]);
                    setAtivo(1);
                  }
                }}
                className="h-12 rounded-2xl bg-lima px-6 font-display text-[16px] font-extrabold text-navy transition hover:brightness-105"
              >
                {comparando ? 'Voltar' : 'Comparar região'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLados((ls) => ls.map(() => ({ ...VAZIO })));
                  setAtivo(0);
                  setAviso('');
                }}
                className="h-12 rounded-2xl border-2 border-lima px-6 font-display text-[16px] font-extrabold text-azul transition hover:bg-lima/20 [[data-theme=escuro]_&]:text-lima [[data-theme=navy]_&]:text-lima"
              >
                Limpar filtros
              </button>
            </div>
            {aviso && (
              <p role="status" className="-mt-6 text-[13.5px] font-semibold text-tema-tinta">
                {aviso}
              </p>
            )}
          </div>
          <div>
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-tema-suave">
              {comparando ? `Toque no mapa para escolher a região ${ativo + 1}` : 'Clique no mapa para escolher o estado'}
            </p>
            <MapaUFs lados={lados} onEscolher={doMapa} />
          </div>
        </div>

        {lados.some((l) => l.uf) && (
          <div id="impulsionar-relatorios" className={`mt-10 grid scroll-mt-6 gap-10 rounded-[28px] bg-tema-card p-6 shadow-card sm:p-10 ${comparando ? 'md:grid-cols-2' : ''}`}>
            {lados.map((l, i) =>
              l.uf ? (
                <Relatorios key={i} lado={l} n={comparando ? i + 1 : 0} base={base} regionais={regionais} />
              ) : (
                <p key={i} className="self-center text-[15px] text-tema-suave">
                  Escolha o estado da região {i + 1}.
                </p>
              ),
            )}
          </div>
        )}
      </div>
      <Sobre aberto={sobre} onFechar={() => setSobre(false)} />
    </section>
  );
}
