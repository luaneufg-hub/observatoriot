'use client';
// "Micro e Pequenas empresas": grandes números em cartões coloridos (layout Observatório novo).
// Cada cartão conta até o valor quando entra na tela e tem uma microinteração própria
// (barra que enche, pictograma, moedas, globo). O ícone (i) mostra a explicação e a fonte.
import { useEffect, useMemo, useRef, useState } from 'react';
import Icon, { KitSvg } from '../Icon';
import Seta from '../Seta';
import { InfoTip } from '../Card';
import Contador, { useNaTela, useContagem } from './Contador';
import { ATUALIZADO_EM } from '@/lib/dados/mpe';
import { numerosDoTerritorio } from '@/lib/dados/mpeTerritorio';
import { UF_BY_SIGLA } from '@/lib/dados/ufs';
import { Bandeira } from '../CaixaUF';
import SeletorTerritorio, { BandeiraBrasil } from './SeletorTerritorio';
import { carregarIGs } from '@/lib/dados/ig';

const COR = { lavanda: '#A093D1', lima: '#D9ED86', cinza: '#B2AEA6' };

// posição de cada cartão na grade de 20 colunas (desktop)
const GRADE = {
  pib: 'lg:col-span-6',
  ia: 'lg:col-span-4',
  mulheres: 'lg:col-span-4 lg:row-span-2',
  salarios: 'lg:col-span-6',
  empregos: 'lg:col-span-5',
  exporta: 'lg:col-span-5',
  ativas: 'lg:col-span-3',
  vagas: 'lg:col-span-3',
};
const MOBILE = { mulheres: 'sm:row-span-2', salarios: 'sm:col-span-2' };

function Simbolo({ nome, size = 20 }) {
  if (nome.startsWith('Ativo_')) return <KitSvg nome={nome} size={size} />;
  return <Icon name={nome} size={size} />;
}

function Fonte({ item, lugar }) {
  return (
    <>
      <span className="block">{item.explica}</span>
      {item.ilustrativo && (
        <span className="mt-2 block rounded-xl bg-[#fdf0f4] px-2.5 py-2 text-[11.5px] text-[#8c1240]">
          Valor fictício para {lugar}. Com a API do Observatório, virá de: {item.base}.
          {item.escopo === 'UF' && ' Este dado só existe até o nível do estado.'} A fonte abaixo é a do número do Brasil.
        </span>
      )}
      <span className="mt-2 block border-t border-[#ece8e1] pt-2 text-[11.5px] text-[#5b5a60]">
        Base: {item.base}
        <br />
        Fonte:{' '}
        <a href={item.fonte.url} target="_blank" rel="noreferrer" className="pointer-events-auto font-semibold text-azul underline-offset-2 hover:underline">
          {item.fonte.nome}
        </a>{' '}
        ({item.fonte.data})
      </span>
    </>
  );
}

function Barra({ valor, ativo }) {
  const v = useContagem(valor, { ativo, duracao: 1500 });
  return (
    <div className="mt-4 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-black/10" aria-hidden>
      <div className="h-full rounded-full bg-[#050506] transition-[width] duration-100" style={{ width: `${Math.min(100, v)}%` }} />
    </div>
  );
}

function Pictograma({ pct, ativo }) {
  const total = 18;
  const cheios = Math.round((pct / 100) * total);
  return (
    <div className="mt-auto grid grid-cols-6 gap-x-1.5 gap-y-3 pt-6" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="h-7 w-full transition-[fill,transform] duration-500 ease-out group-hover:-translate-y-1"
          style={{ fill: ativo && i < cheios ? '#050506' : 'rgba(5,5,6,.18)', transitionDelay: `${ativo ? 700 + i * 55 : 0}ms, ${i * 25}ms` }}
        >
          <circle cx="12" cy="4.2" r="3" />
          <path d="M8.3 8.6h7.4l2.8 8.4h-3.4V23h-2.2v-6h-1.8v6H8.9v-6H5.5Z" />
        </svg>
      ))}
    </div>
  );
}

function Moedas() {
  // pilha de moedas + moeda grande (desenho próprio)
  const pilha = [0, 1, 2, 3, 4];
  return (
    <svg viewBox="0 0 150 130" className="pointer-events-none absolute -right-2 bottom-2 h-[78%] max-h-[150px] w-auto" aria-hidden fill="#D9ED86" stroke="#050506" strokeWidth="3.2">
      {pilha.map((i) => (
        <g key={i} className="transition-transform duration-500 ease-out group-hover:-translate-y-[var(--sobe)]" style={{ '--sobe': `${(5 - i) * 2.5}px`, transitionDelay: `${i * 40}ms` }}>
          <path d={`M60 ${102 - i * 18} v12 c0 7 18 12 40 12 s40 -5 40 -12 v-12`} />
          <ellipse cx="100" cy={102 - i * 18} rx="40" ry="11" />
        </g>
      ))}
      <g className="origin-[52px_88px] transition-transform duration-500 ease-out group-hover:-rotate-12 group-hover:scale-105">
        <circle cx="52" cy="88" r="36" />
        <circle cx="52" cy="88" r="27" />
        <text x="52" y="99" textAnchor="middle" fontSize="30" fontWeight="700" fill="#050506" stroke="none" fontFamily="Lato, Inter, sans-serif">
          R$
        </text>
      </g>
    </svg>
  );
}

function Globo() {
  return (
    <svg viewBox="0 0 120 120" className="pointer-events-none absolute -top-14 right-14 h-[120px] w-[120px]" aria-hidden fill="none" stroke="#050506" strokeWidth="4">
      <circle cx="60" cy="60" r="52" />
      <path d="M8 60h104M14 34h92M14 86h92" />
      <g className="globo-meridianos">
        <ellipse cx="60" cy="60" rx="22" ry="52" />
        <path d="M60 8v104" />
      </g>
    </svg>
  );
}

function Cartao({ item, ativo, lugar, rotuloEscopo }) {
  const pct = item.formato === 'pct';
  const slot = item.slot || item.id;
  const comBarra = pct && ['pib', 'ia', 'vagas', 'setor_local', 'atendimento_local'].includes(item.id);
  const alto = slot === 'mulheres';
  const largo = item.id === 'salarios';
  const estreito = item.id === 'ativas' || item.id === 'vagas' || alto;
  const texto = item.exibe.texto;
  return (
    <article
      className={`group relative flex min-h-[188px] flex-col hyphens-auto [overflow-wrap:break-word] rounded-[22px] hover:z-20 focus-within:z-20 p-5 text-[#050506] shadow-[0_1px_0_rgba(0,0,0,.04)] transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(7,5,104,.45)] focus-within:-translate-y-1 sm:p-6 ${GRADE[slot]} ${MOBILE[slot] || ''}`}
      style={{ background: COR[item.cor] }}
    >
      <header className="relative z-30 flex items-start justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white/45 transition duration-300 group-hover:scale-110 group-hover:bg-white/70">
          <Simbolo nome={item.icone} size={22} />
        </span>
        <InfoTip
          titulo={item.depois.charAt(0).toUpperCase() + item.depois.slice(1)}
          classeBotao="grid h-7 w-7 place-items-center rounded-full text-[#050506]/60 transition hover:bg-white/50 hover:text-[#050506] focus-visible:bg-white/50"
        >
          <Fonte item={item} lugar={lugar} />
        </InfoTip>
      </header>
      {(item.id === 'exporta' || largo) && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[22px]">
          {item.id === 'exporta' && <Globo />}
          {largo && <Moedas />}
        </div>
      )}

      <div className={`relative z-10 ${alto ? 'mt-6' : 'mt-auto pt-4'} ${largo ? 'max-w-[58%]' : ''}`}>
        {item.antes && <p className={`leading-tight ${item.slot ? 'mb-1 text-[12.5px] font-bold uppercase tracking-[0.06em] opacity-70' : 'text-[15px]'}`}>{item.antes}</p>}
        {texto ? (
          <p className="font-display text-[clamp(32px,3.2vw,48px)] font-extrabold leading-[0.95] tracking-[-0.02em] [text-wrap:balance]">{texto}</p>
        ) : (
          <p className={`font-display font-extrabold leading-[0.95] tracking-[-0.02em] ${estreito ? 'text-[clamp(36px,3.1vw,48px)]' : 'text-[clamp(44px,4.6vw,68px)]'}`}>
            {item.carregando ? <span className="inline-block h-[0.9em] w-24 animate-pulse rounded-xl bg-black/10 align-middle" /> : <Contador valor={item.exibe.valor} casas={item.exibe.casas} sufixo={item.exibe.sufixo} ativo={ativo} />}
          </p>
        )}
        <p className="mt-1.5 max-w-[24ch] text-[15px] leading-snug">{item.id === 'ativas' && item.exibe.sufixo !== ' mi' ? 'pequenos negócios ativos' : item.depois}</p>
        {item.extra && <p className="mt-1 text-[12.5px] font-semibold opacity-70">{item.extra}</p>}
        {item.ilustrativo && (
          <p className="mt-2 inline-flex max-w-full flex-wrap items-center gap-x-1 rounded-xl bg-white/50 px-2 py-0.5 text-[11px] font-semibold" title="Valor fictício até a ligação com a API">
            <span className="whitespace-nowrap">{rotuloEscopo(item.escopo)}</span>
            <span className="whitespace-nowrap text-[#8c1240]">· fictício</span>
          </p>
        )}
        {comBarra && <Barra valor={item.exibe.valor} ativo={ativo} />}
      </div>
      {alto && <Pictograma pct={item.exibe.valor} ativo={ativo} />}
    </article>
  );
}

export default function MicroPequenas({ base, uf, mun, onBrasil, onUF, onMunicipio }) {
  const ref = useRef(null);
  const visto = useNaTela(ref);
  const [abrirFontes, setAbrirFontes] = useState(false);
  // indicações geográficas (INPI): carregadas uma vez, para o cartão da cadeia produtiva
  const [igs, setIgs] = useState(null);
  useEffect(() => {
    carregarIGs().then(setIgs);
  }, []);
  const numeros = useMemo(() => numerosDoTerritorio({ uf, mun }, base, { igs }), [uf, mun, base, igs]);
  const fontes = [...new Map(numeros.map((g) => [g.fonte.nome, g.fonte])).values()];
  const nomeUF = uf ? UF_BY_SIGLA[uf].nome : null;
  const lugar = mun ? `${mun.nome} (${uf})` : nomeUF || 'o Brasil';
  const rotuloEscopo = (e) => (e === 'MUN' ? mun?.nome : mun ? `${uf} (estado)` : nomeUF);

  return (
    <section id="micro-e-pequenas" aria-labelledby="mpe-titulo" className="relative bg-tema-bg px-4 py-16 sm:px-8 lg:px-12 lg:pb-24 lg:pt-10">
      {/* convite para rolar: o mapa ocupa quase toda a tela, então a seção seguinte "espia" por baixo */}
      <button
        type="button"
        onClick={() => document.getElementById('micro-e-pequenas')?.scrollIntoView({ behavior: 'smooth' })}
        aria-label="Ver mais: Micro e Pequenas empresas"
        className="convite-rolar absolute left-1/2 top-0 z-10 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-lima text-navy shadow-flutuante transition hover:brightness-105 lg:grid"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-end">
          <h2 id="mpe-titulo" className="font-display text-[clamp(40px,5.4vw,76px)] font-extrabold leading-[0.98] tracking-[-0.02em] text-tema-tinta [text-wrap:balance]">
            Micro e<br />
            Pequenas empresas
          </h2>
          <p className="max-w-[46ch] text-[15px] leading-relaxed text-tema-suave lg:pb-2">
            {uf
              ? `Os grandes números dos pequenos negócios de ${mun ? mun.nome : nomeUF}: quantos são, quanto empregam e pagam, quantas mulheres empregam, em que setor se destacam, quanto o Sebrae alcança e o que o lugar produz.`
              : 'Os grandes números dos pequenos negócios brasileiros: quanto produzem, empregam, pagam e exportam.'}
            Escolha o território abaixo ou toque em <span className="font-semibold">Onde estou</span>. O <span className="font-semibold">(i)</span> de cada cartão
            mostra a definição e a fonte.
          </p>
        </div>

        {/* onde estou / território: fica preso no topo enquanto a seção está na tela */}
        <div className="sticky top-3 z-40 mt-9">
          <SeletorTerritorio base={base} uf={uf} mun={mun} onBrasil={onBrasil} onUF={onUF} onMunicipio={onMunicipio} />
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <p key={mun?.cod || uf || 'br'} className="troca-entra flex items-center gap-2.5 font-display text-[clamp(22px,2.4vw,30px)] font-extrabold leading-tight text-tema-tinta">
            {uf ? <Bandeira uf={uf} className="h-[22px] w-8 flex-none rounded-[3px]" /> : <BandeiraBrasil className="h-[22px] w-8 flex-none" />}
            <span>
              {mun ? mun.nome : nomeUF || 'Brasil'}
              {mun && <span className="font-bold text-tema-suave">, {uf}</span>}
            </span>
          </p>
          {uf && (
            <p className="max-w-[60ch] text-[12.5px] leading-snug text-tema-suave">
              <span className="font-semibold text-tema-tinta">Indicadores do lugar</span>, todos da API do Observatório. PIB, uso de IA, mulheres donas de negócio e
              exportadoras só existem para o Brasil e aparecem na visão nacional.
            </p>
          )}
        </div>

        <div ref={ref} className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-20 lg:gap-4">
          {numeros.map((g) => (
            <Cartao key={g.id} item={g} ativo={visto} lugar={lugar} rotuloEscopo={rotuloEscopo} />
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-detail text-nota italic text-tema-apagado">
          <button
            type="button"
            aria-expanded={abrirFontes}
            onClick={() => setAbrirFontes((v) => !v)}
            className="seta-gatilho inline-flex items-center gap-1 rounded-full px-2 py-0.5 not-italic text-tema-tinta transition hover:bg-tema-linha"
          >
            Fontes
            <Seta size={14} giro={0} aberto={abrirFontes} />
          </button>
          <span>{ATUALIZADO_EM}</span>
        </div>
        {abrirFontes && (
          <ol className="anima-entra mt-2 grid list-decimal gap-1 pl-8 text-[12.5px] text-tema-suave">
            {fontes.map((f) => (
              <li key={f.url}>
                <a href={f.url} target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-tema-tinta hover:underline">
                  {f.nome}
                </a>{' '}
                ({f.data})
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
