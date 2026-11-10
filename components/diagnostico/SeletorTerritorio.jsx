'use client';
// Seletor de território: Brasil › Estado › Cidade, com "Onde estou" (geolocalização)
// e um mapinha de localização. Fica fixo no topo enquanto a seção está na tela,
// para a pessoa sempre saber onde está e trocar de nível com um toque.
import { useEffect, useMemo, useRef, useState } from 'react';
import { geoIdentity, geoPath } from 'd3-geo';
import Icon from '../Icon';
import Seta from '../Seta';
import { Bandeira } from '../CaixaUF';
import { UFS, UF_BY_SIGLA, REGIOES } from '@/lib/dados/ufs';
import { buscarMunicipios, normaliza } from '@/lib/dados/municipios';
import { localizarPonto, pedirPosicao } from '@/lib/geo/localizar';
import { geo } from '@/lib/geo';

function BandeiraBrasil({ className }) {
  // bandeira nacional simplificada (símbolo nacional, domínio público)
  return (
    <svg viewBox="0 0 20 14" className={className} aria-hidden>
      <rect width="20" height="14" rx="2" fill="#009C3B" />
      <path d="M10 1.8 18 7l-8 5.2L2 7Z" fill="#FFDF00" />
      <circle cx="10" cy="7" r="3.1" fill="#002776" />
    </svg>
  );
}

/* ------------------------------------------------------------ mapinha de localização */
let ufsGeo = null;
function useUfsGeo() {
  const [g, setG] = useState(ufsGeo);
  useEffect(() => {
    if (ufsGeo) return;
    fetch(geo('ufs.json'))
      .then((r) => r.json())
      .then((j) => {
        ufsGeo = j;
        setG(j);
      })
      .catch(() => {});
  }, []);
  return g;
}

function Mapinha({ uf, mun, tamanho = 58 }) {
  const fc = useUfsGeo();
  const desenho = useMemo(() => {
    if (!fc) return null;
    // projeção plana (lon/lat): não depende do sentido dos anéis, como a projeção esférica
    const proj = geoIdentity().reflectY(true).fitSize([tamanho, tamanho], fc);
    const path = geoPath(proj);
    return { proj, ufs: fc.features.map((f) => ({ uf: f.properties.uf, d: path(f) })) };
  }, [fc, tamanho]);
  if (!desenho) return <span style={{ width: tamanho, height: tamanho }} className="block" />;
  const ponto = mun ? desenho.proj([mun.lon, mun.lat]) : null;
  return (
    <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} aria-hidden className="block overflow-visible">
      {desenho.ufs.map((u) => (
        <path
          key={u.uf}
          d={u.d}
          className="transition-[fill] duration-300"
          fill={uf ? (u.uf === uf ? 'var(--tema-numero)' : 'var(--tema-linha)') : 'var(--tema-numero)'}
          fillOpacity={uf && u.uf !== uf ? 1 : 0.9}
          stroke="var(--tema-card)"
          strokeWidth="0.35"
        />
      ))}
      {ponto && (
        <g transform={`translate(${ponto[0]},${ponto[1]})`}>
          <circle r="5" fill="#D81E5B" opacity="0.25" className="animate-ping origin-center [transform-box:fill-box]" />
          <circle r="2.6" fill="#D81E5B" stroke="#fff" strokeWidth="1" />
        </g>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------ popovers */
function useFecharFora(aberto, fechar, ref) {
  useEffect(() => {
    if (!aberto) return;
    const fora = (e) => ref.current && !ref.current.contains(e.target) && fechar();
    const esc = (e) => e.key === 'Escape' && fechar();
    document.addEventListener('pointerdown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [aberto, fechar, ref]);
}

function ListaUF({ uf, onEscolher }) {
  const [q, setQ] = useState('');
  const n = normaliza(q);
  const grupos = Object.entries(REGIOES)
    .map(([r, nome]) => ({
      nome,
      ufs: UFS.filter((u) => u.regiao === r && (!n || normaliza(u.nome).includes(n) || u.sigla.toLowerCase().startsWith(n))).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    }))
    .filter((g) => g.ufs.length);
  return (
    <div className="flex max-h-[60vh] flex-col">
      <label className="relative mb-2 block">
        <span className="sr-only">Filtrar estados</span>
        <Icon name="busca" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tema-apagado" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtrar estados"
          className="w-full rounded-full border border-tema-linha bg-tema-bg py-2 pl-9 pr-3 text-[14px] text-tema-tinta outline-none focus:border-azul"
        />
      </label>
      <div className="rolagem -mr-2 overflow-y-auto pr-2">
        {grupos.map((g) => (
          <div key={g.nome} className="mb-2">
            <p className="px-2 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-tema-apagado">{g.nome}</p>
            <div className="grid grid-cols-2 gap-1">
              {g.ufs.map((u) => (
                <button
                  key={u.sigla}
                  type="button"
                  onClick={() => onEscolher(u.sigla)}
                  className={`flex items-center gap-2 rounded-xl px-2 py-1.5 text-left text-[13.5px] transition hover:bg-tema-linha ${u.sigla === uf ? 'bg-lima font-semibold text-navy-2 hover:bg-lima' : 'text-tema-tinta'}`}
                >
                  <Bandeira uf={u.sigla} className="h-[13px] w-[19px] flex-none rounded-[2px]" />
                  <span className="min-w-0 truncate">{u.nome}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {!grupos.length && <p className="px-2 py-3 text-[13px] text-tema-apagado">Nenhum estado com esse nome.</p>}
      </div>
    </div>
  );
}

function ListaCidade({ base, uf, mun, onEscolher }) {
  const [q, setQ] = useState('');
  const lista = useMemo(() => {
    if (!base) return [];
    if (q.trim().length >= 2) {
      const r = buscarMunicipios(base, q, 40);
      // cidades do estado atual primeiro
      return uf ? [...r.filter((m) => m.uf === uf), ...r.filter((m) => m.uf !== uf)].slice(0, 30) : r.slice(0, 30);
    }
    if (!uf) return [];
    const ms = [...(base.porUF[uf] || [])].sort((a, b) => (b.cap ? 1 : 0) - (a.cap ? 1 : 0) || a.nome.localeCompare(b.nome, 'pt-BR'));
    return ms;
  }, [base, q, uf]);
  return (
    <div className="flex max-h-[60vh] flex-col">
      <label className="relative mb-2 block">
        <span className="sr-only">Buscar cidade</span>
        <Icon name="busca" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tema-apagado" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={uf ? `Buscar cidade em ${UF_BY_SIGLA[uf].nome} ou no Brasil` : 'Buscar cidade no Brasil'}
          className="w-full rounded-full border border-tema-linha bg-tema-bg py-2 pl-9 pr-3 text-[14px] text-tema-tinta outline-none focus:border-azul"
        />
      </label>
      <div className="rolagem -mr-2 overflow-y-auto pr-2">
        {!lista.length && <p className="px-2 py-3 text-[13px] text-tema-apagado">{q.trim().length >= 2 ? 'Nenhuma cidade encontrada.' : 'Digite o nome de uma cidade.'}</p>}
        {lista.map((m) => (
          <button
            key={m.cod}
            type="button"
            onClick={() => onEscolher(m)}
            className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-[13.5px] transition hover:bg-tema-linha ${mun?.cod === m.cod ? 'bg-lima font-semibold text-navy-2 hover:bg-lima' : 'text-tema-tinta'}`}
          >
            <span className="min-w-0 flex-1 truncate">{m.nome}</span>
            {m.cap && <span className="rounded-full bg-tema-linha px-1.5 text-[10.5px] font-semibold text-tema-suave">capital</span>}
            {m.uf !== uf && <span className="font-detail text-[11px] font-bold text-tema-apagado">{m.uf}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ seletor */
const MSG_ERRO = {
  negado: 'Permissão de localização negada. Escolha o estado e a cidade na lista.',
  indisponivel: 'Não foi possível descobrir sua localização agora. Escolha na lista.',
  tempo: 'A localização demorou demais. Tente de novo ou escolha na lista.',
  'sem-suporte': 'Este navegador não informa a localização. Escolha na lista.',
  fora: 'Você parece estar fora do Brasil. Escolha um estado na lista.',
};

export default function SeletorTerritorio({ base, uf, mun, onBrasil, onUF, onMunicipio }) {
  const [aberto, setAberto] = useState(null); // 'uf' | 'mun' | null
  const [geoEstado, setGeoEstado] = useState({ s: 'ocioso' }); // ocioso | buscando | ok | erro
  const ref = useRef(null);
  useFecharFora(!!aberto, () => setAberto(null), ref);

  // some a mensagem depois de alguns segundos
  useEffect(() => {
    if (geoEstado.s !== 'ok' && geoEstado.s !== 'erro') return;
    const t = setTimeout(() => setGeoEstado({ s: 'ocioso' }), 6000);
    return () => clearTimeout(t);
  }, [geoEstado]);

  const ondeEstou = async () => {
    setAberto(null);
    setGeoEstado({ s: 'buscando' });
    try {
      const p = await pedirPosicao();
      const r = await localizarPonto(p.lon, p.lat, base);
      if (r.foraDoBrasil) return setGeoEstado({ s: 'erro', msg: MSG_ERRO.fora });
      if (r.cod) onMunicipio(r.cod, r.uf);
      else onUF(r.uf);
      const m = r.cod ? base.porCod.get(r.cod) : null;
      setGeoEstado({ s: 'ok', msg: m ? `Você está em ${m.nome}, ${m.uf}.` : `Você está em ${UF_BY_SIGLA[r.uf].nome}.` });
    } catch (e) {
      setGeoEstado({ s: 'erro', msg: MSG_ERRO[e?.motivo] || MSG_ERRO.indisponivel });
    }
  };

  const nivel = mun ? 'mun' : uf ? 'uf' : 'br';
  const seg = (ativo) =>
    `group/seg inline-flex min-w-0 items-center gap-2 rounded-full px-3 py-2 text-[14px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-azul ${
      ativo ? 'bg-navy-2 font-semibold text-white [[data-theme=navy]_&]:bg-lima [[data-theme=navy]_&]:text-navy-2 [[data-theme=escuro]_&]:bg-verde [[data-theme=escuro]_&]:text-[#141414]' : 'text-tema-tinta hover:bg-tema-linha'
    }`;

  return (
    <div ref={ref} className="relative">
      <nav
        aria-label="Território"
        className="flex flex-wrap items-center gap-1.5 rounded-[26px] border border-tema-linha bg-tema-card p-1.5 shadow-flutuante backdrop-blur sm:flex-nowrap sm:rounded-full"
      >
        <button
          type="button"
          onClick={() => document.getElementById('territorio')?.scrollIntoView({ behavior: 'smooth' })}
          title="Ver no mapa"
          className="hidden flex-none rounded-full p-1 transition hover:bg-tema-linha sm:block"
        >
          <Mapinha uf={uf} mun={mun} tamanho={40} />
          <span className="sr-only">Ver no mapa</span>
        </button>

        <ol className="trilha flex min-w-0 flex-1 flex-wrap items-center gap-0.5 sm:flex-nowrap">
          <li className="flex-none">
            <button type="button" onClick={onBrasil} aria-current={nivel === 'br' ? 'location' : undefined} className={seg(nivel === 'br')}>
              <BandeiraBrasil className="h-[14px] w-5 flex-none" />
              Brasil
            </button>
          </li>
          <li aria-hidden className="text-tema-apagado">
            <Seta size={14} base={-90} />
          </li>
          <li className="min-w-0">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={aberto === 'uf'}
              aria-current={nivel === 'uf' ? 'location' : undefined}
              onClick={() => (uf && nivel !== 'uf' && aberto !== 'uf' ? onUF(uf) : setAberto(aberto === 'uf' ? null : 'uf'))}
              className={seg(nivel === 'uf')}
            >
              {uf ? <Bandeira uf={uf} className="h-[14px] w-5 flex-none rounded-[2px]" /> : <Icon name="pino" size={16} />}
              <span className="truncate">{uf ? UF_BY_SIGLA[uf].nome : 'Estado'}</span>
              <span
                role="presentation"
                onClick={(e) => {
                  e.stopPropagation();
                  setAberto(aberto === 'uf' ? null : 'uf');
                }}
                className="-mr-1 grid h-5 w-5 place-items-center rounded-full transition group-hover/seg:bg-black/5"
              >
                <Seta size={14} giro={0} aberto={aberto === 'uf'} />
              </span>
            </button>
          </li>
          <li aria-hidden className="text-tema-apagado">
            <Seta size={14} base={-90} />
          </li>
          <li className="min-w-0">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={aberto === 'mun'}
              aria-current={nivel === 'mun' ? 'location' : undefined}
              onClick={() => setAberto(aberto === 'mun' ? null : 'mun')}
              className={seg(nivel === 'mun')}
            >
              <span className="truncate">{mun ? mun.nome : 'Cidade'}</span>
              <Seta size={14} giro={0} aberto={aberto === 'mun'} />
            </button>
          </li>
        </ol>

        <button
          type="button"
          onClick={ondeEstou}
          disabled={geoEstado.s === 'buscando' || !base}
          className="ml-auto inline-flex flex-none items-center justify-center gap-2 rounded-full bg-lima max-sm:w-full px-3.5 py-2 text-[13.5px] font-bold text-navy-2 transition hover:brightness-95 disabled:opacity-70 [--icon-2:theme(colors.azul)]"
        >
          {geoEstado.s === 'buscando' ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy-2 border-t-transparent" aria-hidden />
          ) : (
            <Icon name="pino" size={17} />
          )}
          <span>{geoEstado.s === 'buscando' ? 'Localizando…' : 'Onde estou'}</span>
        </button>
      </nav>

      {/* mensagem da localização */}
      <div aria-live="polite" className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2">
        {(geoEstado.s === 'ok' || geoEstado.s === 'erro') && (
          <p
            className={`anima-entra w-max max-w-[calc(100vw-48px)] rounded-2xl px-3.5 py-1.5 text-center text-[12.5px] font-semibold shadow-card ${
              geoEstado.s === 'ok' ? 'bg-navy-2 text-white' : 'bg-white text-magenta'
            }`}
          >
            {geoEstado.msg}
          </p>
        )}
      </div>

      {/* popovers */}
      {aberto && (
        <div
          role="dialog"
          aria-label={aberto === 'uf' ? 'Escolher estado' : 'Escolher cidade'}
          className="anima-entra absolute left-0 right-0 top-full z-20 mt-2 rounded-[22px] border border-tema-linha bg-tema-card p-3 shadow-flutuante sm:left-14 sm:right-auto sm:w-[420px]"
        >
          {aberto === 'uf' ? (
            <ListaUF
              uf={uf}
              onEscolher={(s) => {
                onUF(s);
                setAberto(null);
              }}
            />
          ) : (
            <ListaCidade
              base={base}
              uf={uf}
              mun={mun}
              onEscolher={(m) => {
                onMunicipio(m.cod, m.uf);
                setAberto(null);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export { Mapinha, BandeiraBrasil };
