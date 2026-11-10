'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Card, { InfoTip, LinhaBarra, Nota, Selo, Valor } from './Card';
import CaixaUF, { Bandeira, BandeiraQuadrada } from './CaixaUF';
import Icon, { KitSvg, ILUSTRACAO_SETOR } from './Icon';
import { Busca, Camadas, DropdownIndicadores, DropdownUF } from './Controles';
import { construirPrancha } from './Prancha';
import { UFS, UF_BY_SIGLA, REGIOES } from '@/lib/dados/ufs';
import { BIOMAS, BIOMA_BY_ID } from '@/lib/dados/biomas';
import { GRUPOS, INDICADOR_BY_ID, DADOS, formatar, SETORES, quocienteLocacional, ATUALIZADO_EM, ehReal } from '@/lib/dados/indicadores';
import { carregarMunicipios, valoresMunicipais } from '@/lib/dados/municipios';
import { metricasUF, metricasMunicipio } from '@/lib/dados/metricas';
import { classes, corDe, corDoRotulo, DIM, PRANCHA, BASE } from '@/lib/escalas';
import { geo } from '@/lib/geo';
import MicroPequenas from './diagnostico/MicroPequenas';
import SebraeTerritorio from './SebraeTerritorio';
import CadeiasProdutivas from './CadeiasProdutivas';
import IndicacoesGeograficas from './IndicacoesGeograficas';
import InovacaoTerritorio from './InovacaoTerritorio';
import Comparar from './comparar/Comparar';
import LogoObservatorio from './LogoObservatorio';
import Estudos from './estudos/Estudos';
import { carregarIGs, produtoCurto } from '@/lib/dados/ig';
import { cadeiaBioma } from '@/lib/dados/producao';
import Seta from './Seta';
import { DESTAQUES_UF, destaquesMunicipais, CLASSES_DESTAQUE, SETORES_DESTAQUE, SETOR_DESTAQUE_BY_ID, QL_FORTE } from '@/lib/dados/destaques';
import { PROGRAMA_BY_ID, carregarPrograma } from '@/lib/dados/sebraeTerritorio';


const Mapa = dynamic(() => import('./Mapa'), { ssr: false });
// gráficos (Recharts) só são baixados depois da página principal
const Setores = dynamic(() => import('./diagnostico/Setores'), { ssr: false });

const TEMAS = [
  { id: 'claro', rotulo: 'Claro' },
  { id: 'navy', rotulo: 'Navy' },
  { id: 'escuro', rotulo: 'Escuro' },
];

export default function Observatorio() {
  const [tema, setTema] = useState('claro');
  // páginas: início (território) e estudos — pelo endereço (#/estudos; #/impulsionarnegocios, como no Painéis Ditec)
  const [pagina, setPagina] = useState('inicio');
  useEffect(() => {
    const ler = () => {
      const h = window.location.hash;
      if (!h.startsWith('#/')) return; // âncoras internas (#territorio…) não trocam de página
      const p = h.startsWith('#/estudos') || h.includes('impulsionarnegocios') ? 'estudos' : 'inicio';
      setPagina(p);
      window.scrollTo(0, 0);
      if (h.includes('impulsionarnegocios')) setTimeout(() => document.getElementById('impulsionar')?.scrollIntoView(), 120);
    };
    ler();
    window.addEventListener('hashchange', ler);
    return () => window.removeEventListener('hashchange', ler);
  }, []);
  const [modo, setModo] = useState('coropletico');
  const [indicadorId, setIndicadorId] = useState('ativas');
  const [uf, setUf] = useState(null);
  const [municipio, setMunicipio] = useState(null); // cod
  const [camadas, setCamadas] = useState({ sebrae: false, municipais: false, limites: true, bioma: false });
  const [hover, setHover] = useState(null);
  const [base, setBase] = useState(null); // municípios
  const [ufsGeo, setUfsGeo] = useState(null);
  const [centros, setCentros] = useState(null);
  const mapa = useRef(null);
  const areaRef = useRef(null);

  const ind = INDICADOR_BY_ID[indicadorId];
  const grupo = GRUPOS.find((g) => g.id === ind.grupo);
  const categorico = ind.unidade === 'cat';

  useEffect(() => {
    carregarMunicipios().then(setBase);
    fetch(geo('ufs-centros.json'))
      .then((r) => r.json())
      .then((c) => {
        const cods = { RO: 11, AC: 12, AM: 13, RR: 14, PA: 15, AP: 16, TO: 17, MA: 21, PI: 22, CE: 23, RN: 24, PB: 25, PE: 26, AL: 27, SE: 28, BA: 29, MG: 31, ES: 32, RJ: 33, SP: 35, PR: 41, SC: 42, RS: 43, MS: 50, MT: 51, GO: 52, DF: 53 };
        for (const k of Object.keys(c)) c[k].cod = cods[k];
        setCentros(c);
      });
    setUfsGeo(true);
  }, []);

  /* ---------------------------------------------------- valores e escalas */
  const valoresUF = useMemo(() => new Map(UFS.map((u) => [u.sigla, DADOS[u.sigla][indicadorId]])), [indicadorId]);
  const valoresMun = useMemo(() => (base ? valoresMunicipais(base, indicadorId) : null), [base, indicadorId]);
  const munVisiveis = useMemo(() => {
    if (!base) return [];
    return uf ? base.porUF[uf] : base.lista;
  }, [base, uf]);

  const classesUF = useMemo(() => classes(ind, [...valoresUF.values()], modo), [ind, valoresUF, modo]);
  const classesMun = useMemo(() => (valoresMun ? classes(ind, munVisiveis.map((m) => valoresMun.get(m.cod)), modo) : null), [ind, valoresMun, munVisiveis, modo]);

  const munUF = camadas.municipais && !!uf;
  const munBR = camadas.municipais && !uf;

  /* ---------------------------------------------------- Destaques: setor em destaque (maior QL) */
  const emDestaques = modo === 'destaques';
  const destaquesMun = useMemo(() => (base ? destaquesMunicipais(base) : null), [base]);
  const mapaValoresUF = useMemo(
    () => (emDestaques ? new Map([...DESTAQUES_UF].map(([k, d]) => [k, { cat: d.setor, forte: d.forte }])) : valoresUF),
    [emDestaques, valoresUF],
  );
  const mapaValoresMun = useMemo(
    () => (emDestaques ? (destaquesMun ? new Map([...destaquesMun].map(([k, d]) => [k, { cat: d.setor, forte: d.forte }])) : null) : valoresMun),
    [emDestaques, destaquesMun, valoresMun],
  );
  const mapaClassesUF = emDestaques ? CLASSES_DESTAQUE : classesUF;
  const mapaClassesMun = emDestaques ? CLASSES_DESTAQUE : classesMun;

  // sem valor (null) vai para o fim do ranking
  const ordem = (a, b) => (a == null ? (b == null ? 0 : 1) : b == null ? -1 : ind.menorMelhor ? a - b : b - a);
  const rankingUF = useMemo(() => (categorico ? [] : [...UFS].sort((a, b) => ordem(valoresUF.get(a.sigla), valoresUF.get(b.sigla)))), [valoresUF, categorico, ind]);
  const posUF = useMemo(() => Object.fromEntries(rankingUF.map((u, i) => [u.sigla, i + 1])), [rankingUF]);
  const nUFcomValor = useMemo(() => [...valoresUF.values()].filter((v) => v != null).length, [valoresUF]);
  const rankingMun = useMemo(() => {
    if (!uf || !base || !valoresMun || categorico) return [];
    return [...base.porUF[uf]].sort((a, b) => ordem(valoresMun.get(a.cod), valoresMun.get(b.cod)));
  }, [uf, base, valoresMun, categorico, ind]);
  const posMun = useMemo(() => Object.fromEntries(rankingMun.map((m, i) => [m.cod, i + 1])), [rankingMun]);
  const mediaUF = useMemo(() => {
    const nums = [...valoresUF.values()].filter((b) => typeof b === 'number');
    return nums.reduce((a, b) => a + b, 0) / (nums.length || 1);
  }, [valoresUF]);

  /* ---------------------------------------------------- navegação top-down */
  const irBrasil = useCallback(() => {
    setUf(null);
    setMunicipio(null);
    mapa.current?.brasil();
  }, []);
  const irUF = useCallback(
    (sigla) => {
      if (!sigla) return irBrasil();
      setUf(sigla);
      setMunicipio(null);
      setCamadas((c) => ({ ...c, municipais: true }));
      const b = centros?.[sigla]?.b;
      if (b) mapa.current?.enquadrar([[b[0], b[1]], [b[2], b[3]]]);
    },
    [centros, irBrasil, modo],
  );
  const irMunicipio = useCallback(
    (cod, ufDoMun) => {
      const m = base?.porCod.get(cod);
      if (!m) return;
      const sigla = ufDoMun || m.uf;
      if (sigla !== uf) {
        setUf(sigla);
        setCamadas((c) => ({ ...c, municipais: true }));
      }
      setMunicipio(cod);
      const atual = mapa.current?.zoom() || 5;
      const z = sigla === 'DF' ? 8.5 : Math.min(7.2, Math.max(6.4, atual + 0.8));
      mapa.current?.map()?.easeTo({ center: [m.lon, m.lat], zoom: z, duration: 800 });
    },
    [base, uf, modo],
  );

  /* ---------------------------------------------------- Sebrae (ilustrativo) */
  const sebrae = useMemo(() => {
    if (!base) return null;
    const out = [];
    for (const u of UFS) {
      const ms = base.porUF[u.sigla] || [];
      const cap = ms.find((m) => m.cap);
      if (cap) out.push({ id: `sede-${u.sigla}`, pos: [cap.lon, cap.lat], sede: true, nome: cap.nome, uf: u.sigla });
      const k = Math.max(1, Math.round((DADOS[u.sigla].pontos - 1) / 5));
      [...ms]
        .filter((m) => !m.cap)
        .sort((a, b) => base.peso.get(b.cod) - base.peso.get(a.cod))
        .slice(0, k)
        .forEach((m) => out.push({ id: `er-${m.cod}`, pos: [m.lon, m.lat], sede: false, nome: m.nome, uf: u.sigla }));
    }
    return out;
  }, [base]);

  /* ---------------------------------------------------- siglas das UFs (cor por contraste) */
  const rotulosUF = useMemo(() => {
    if (!centros) return [];
    return UFS.filter((u) => !(munUF && u.sigla === uf)).map((u) => {
      let fundo;
      if (munBR || munUF) fundo = modo === 'destaques' ? PRANCHA.dim : DIM;
      else {
        const vv = mapaValoresUF.get(u.sigla);
        fundo = corDe(mapaClassesUF, vv && typeof vv === 'object' ? vv.cat : vv);
      }
      const [r, g, b] = hexRgb(corDoRotulo(fundo));
      return { pos: centros[u.sigla].c, texto: u.sigla, cor: [r, g, b, munBR || munUF ? 140 : 255] };
    });
  }, [centros, munUF, munBR, uf, mapaClassesUF, mapaValoresUF, modo]);

  /* ---------------------------------------------------- legenda */
  const legenda = useMemo(() => {
    if (emDestaques)
      return [
        ...SETORES_DESTAQUE.map((s) => ({ cor: s.cor, rotulo: s.rotulo })),
        { cor: '#E9E5DD', hachura: true, rotulo: `concentração forte (QL ≥ ${String(QL_FORTE).replace('.', ',')})` },
      ];
    const c = munBR || munUF ? classesMun : classesUF;
    if (!c) return [];
    if (c.tipo === 'cat') return BIOMAS.map((b) => ({ cor: c.cores[b.id], rotulo: b.nome }));
    if (ind.biomaId) return c.cores.slice(1).map((cor, i) => ({ cor, rotulo: c.rotulos[i], hachura: modo === 'destaques' && i === 3 }));
    const ext = [c.min, ...c.limites, c.max];
    return c.cores.map((cor, i) => ({ cor, rotulo: `${formatar(ind, ext[i], { curto: true })} – ${formatar(ind, ext[i + 1], { curto: true })}`, hachura: modo === 'destaques' && i === 4 }));
  }, [classesUF, classesMun, munBR, munUF, ind, modo, emDestaques]);

  /* ---------------------------------------------------- destaques (prancha) */
  const mSel = municipio && base ? base.porCod.get(municipio) : null;

  /* ---------------------------------------------------- destaque de programa Sebrae */
  const [programa, setPrograma] = useState(null);
  const [destaqueMapa, setDestaqueMapa] = useState(null);
  useEffect(() => {
    if (!programa || !base) return setDestaqueMapa(null);
    let vivo = true;
    // indicação geográfica (INPI): "ig:<id>"
    if (programa.startsWith('ig:')) {
      carregarIGs().then(({ igs }) => {
        const ig = igs.find((x) => `ig:${x.id}` === programa);
        if (vivo && ig) setDestaqueMapa({ id: programa, nome: `IG ${produtoCurto(ig.produto)} · ${ig.nome}`, cor: '#8A9136', real: true, cods: ig.municipios });
      });
      setCamadas((c) => (c.municipais ? c : { ...c, municipais: true }));
      return () => {
        vivo = false;
      };
    }
    const p = PROGRAMA_BY_ID[programa];
    carregarPrograma(p, base).then((d) => vivo && setDestaqueMapa({ id: p.id, nome: p.nome, cor: p.cor, real: d.real, cods: [...d.sim] }));
    setCamadas((c) => (c.municipais ? c : { ...c, municipais: true }));
    return () => {
      vivo = false;
    };
  }, [programa, base]);
  const caixa = useMemo(() => {
    if (mSel && valoresMun) {
      const v = valoresMun.get(mSel.cod);
      const totalUF = ind.unidade === 'n' ? DADOS[mSel.uf][ind.id] : null;
      return { uf: mSel.uf, titulo: mSel.nome, n: categorico ? null : posMun[mSel.cod], ...metricasMunicipio(ind, mSel, v, totalUF, posMun[mSel.cod], rankingMun.length) };
    }
    if (uf) {
      const extra = categorico ? { cab: BIOMA_BY_ID[DADOS[uf][ind.id]].cor, quadro: BIOMA_BY_ID[DADOS[uf][ind.id]].cor } : {};
      return { uf, titulo: UF_BY_SIGLA[uf].nome, n: categorico ? null : posUF[uf], ...metricasUF(ind, uf, ind.brasil ?? mediaUF), ...extra };
    }
    return null;
  }, [mSel, valoresMun, uf, ind, posMun, posUF, rankingMun, mediaUF, categorico]);

  const prancha = useMemo(() => {
    if (modo !== 'destaques' || !centros) return null;
    let foco = null;
    if (mSel) foco = { bbox: [mSel.lon - 0.35, mSel.lat - 0.3, mSel.lon + 0.35, mSel.lat + 0.3], centro: [mSel.lon, mSel.lat] };
    else if (uf) foco = { bbox: centros[uf].b, centro: centros[uf].c };
    return construirPrancha({
      foco,
      carimbo: {
        titulo: 'Setor em destaque',
        nota: (munBR || munUF) && !base?.setor?.size ? 'municípios: valores fictícios até a API' : 'QL = participação do setor no lugar ÷ no Brasil',
        itens: legenda,
        folha: `${mSel ? mSel.uf + '·M' : uf || 'BR'}·QL`,
        lugar: mSel ? `${mSel.nome}, ${mSel.uf}` : uf ? UF_BY_SIGLA[uf].nome : 'Brasil',
      },
    });
  }, [modo, centros, mSel, uf, ind, legenda, munBR, munUF, base]);

  /* ---------------------------------------------------- hover */
  const hoverInfo = useMemo(() => {
    if (!hover) return null;
    if (hover.tipo === 'sebrae') return { tipo: 'sebrae', ...hover };
    if (hover.tipo === 'uf') {
      const v = valoresUF.get(hover.id);
      return { uf: hover.id, nome: UF_BY_SIGLA[hover.id].nome, sub: REGIOES[UF_BY_SIGLA[hover.id].regiao], v, pos: v == null ? null : posUF[hover.id], n: nUFcomValor, x: hover.x, y: hover.y, destaque: emDestaques ? DESTAQUES_UF.get(hover.id) : null };
    }
    const m = base?.porCod.get(hover.id);
    if (!m) return null;
    const v = valoresMun?.get(m.cod);
    const pos = uf === m.uf ? posMun[m.cod] : null;
    return { uf: m.uf, nome: m.nome, sub: `${UF_BY_SIGLA[m.uf].nome}${m.cap ? ' · capital' : ''}`, v, pos, n: base.porUF[m.uf].length, x: hover.x, y: hover.y, destaque: emDestaques ? destaquesMun?.get(m.cod) : null };
  }, [hover, valoresUF, valoresMun, base, posUF, posMun, uf, emDestaques, destaquesMun, nUFcomValor]);

  const valorTexto = (v) => (v == null ? '—' : categorico ? BIOMA_BY_ID[v]?.nome ?? '—' : formatar(ind, v, { curto: false }));

  /* ---------------------------------------------------- resumo do card principal */
  const resumo = useMemo(() => {
    if (mSel && valoresMun) {
      const v = valoresMun.get(mSel.cod);
      return { valor: categorico ? BIOMA_BY_ID[v]?.nome : formatar(ind, v, { curto: true }), selo: categorico ? null : `${posMun[mSel.cod]}º de ${rankingMun.length} em ${mSel.uf}`, apoio: mSel.nome };
    }
    if (uf) {
      const v = valoresUF.get(uf);
      return { valor: categorico ? BIOMA_BY_ID[v].nome : formatar(ind, v, { curto: true }), selo: categorico ? null : v == null ? 'sem valor' : `${posUF[uf]}º de ${nUFcomValor} UFs`, apoio: UF_BY_SIGLA[uf].nome };
    }
    if (categorico) {
      const cont = {};
      for (const v of valoresUF.values()) cont[v] = (cont[v] || 0) + 1;
      const top = Object.entries(cont).sort((a, b) => b[1] - a[1])[0];
      return { valor: BIOMA_BY_ID[top[0]].nome, selo: `${top[1]} de 27 UFs`, apoio: 'Bioma mais frequente' };
    }
    if (ind.brasil != null) return { valor: formatar(ind, ind.brasil, { curto: ind.unidade === 'n' }), selo: ind.seloBrasil?.[0] ?? 'Brasil', apoio: ind.seloBrasil?.[1] ?? 'total nacional' };
    const vals = [...valoresUF.values()];
    const soma = vals.reduce((a, b) => a + b, 0);
    return ind.unidade === 'n'
      ? { valor: formatar(ind, soma, { curto: true }), selo: 'Total Brasil', apoio: '27 UFs' }
      : { valor: formatar(ind, soma / vals.length), selo: 'Média das UFs', apoio: '27 UFs' };
  }, [mSel, valoresMun, uf, valoresUF, ind, categorico, posMun, posUF, rankingMun, nUFcomValor]);

  const ranking = uf ? rankingMun : rankingUF;
  const valorRank = (x) => (uf ? valoresMun?.get(x.cod) : valoresUF.get(x.sigla));
  const maxRank = ranking.length ? Math.max(...ranking.slice(0, 5).map(valorRank)) : 1;

  /* ---------------------------------------------------- render */
  return (
    <div data-theme={tema} className="flex min-h-screen flex-col bg-tema-bg">
      {/* Cabeçalho do site (demonstração) */}
      <header className="flex h-16 flex-none items-center gap-3 bg-[var(--tema-nav)] px-4 text-white sm:gap-6 sm:px-6">
        <a href="#/" className="flex min-w-0 items-center" aria-label="Observatório Setorial Territorial · início">
          <LogoObservatorio className="block h-[14px] w-auto max-w-full sm:h-[17px]" />
        </a>
        <nav className="ml-auto hidden gap-8 text-[15px] lg:flex">
          {[
            ['Início', '#/', 'inicio'],
            ['Estudos', '#/estudos', 'estudos'],
            ['Calendário', '#', null],
            ['Documentação', '#', null],
          ].map(([t, h, p]) => (
            <a key={t} href={h} aria-current={p === pagina ? 'page' : undefined} className={`hover:opacity-100 hover:underline ${p === pagina ? 'font-semibold underline decoration-lima decoration-2 underline-offset-[6px]' : 'opacity-90'}`}>
              {t}
            </a>
          ))}
        </nav>
        <div role="radiogroup" aria-label="Tema" className="ml-auto inline-flex flex-none rounded-full border border-white/70 p-[3px] lg:ml-0">
          {TEMAS.map((t) => (
            <button key={t.id} role="radio" aria-checked={tema === t.id} onClick={() => setTema(t.id)} className={`rounded-full px-2 py-1 text-[11px] font-medium sm:px-2.5 sm:text-[12px] ${tema === t.id ? 'bg-white text-[var(--tema-nav)]' : 'text-white'}`}>
              {t.rotulo}
            </button>
          ))}
        </div>
        <a href="#" className="hidden whitespace-nowrap rounded-full bg-lima px-3.5 py-1.5 text-[14px] font-bold text-navy-2 sm:block">
          login/ inscreva-se
        </a>
      </header>

      {pagina === 'estudos' ? (
        <Estudos base={base} />
      ) : (
        <>
      <div id="territorio" className="grid grid-cols-1 lg:h-[calc(100vh-64px)] lg:min-h-[640px] lg:grid-cols-[440px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
        {/* ====================================================== BARRA LATERAL */}
        <aside className="rolagem relative order-2 min-h-0 overflow-y-auto bg-tema-painel px-6 pb-8 pt-7 lg:order-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-[64px] font-extrabold leading-[0.95] tracking-tight text-[var(--tema-sobre-painel)]">BRASIL</h1>
              <nav aria-label="Navegação territorial" className="trilha mt-1.5 flex flex-wrap items-center gap-1.5 font-detail text-[15px] font-normal uppercase tracking-[0.02em] text-[var(--tema-sobre-painel)]">
                {/* como no layout: TERRITÓRIO em caixa alta, Lato regular; níveis acima ficam mais leves */}
                <button onClick={irBrasil} aria-current={uf ? undefined : 'location'} className={`uppercase ${uf ? 'opacity-85 underline-offset-2 hover:underline hover:opacity-100' : ''}`}>
                  Território
                </button>
                {uf && (
                  <>
                    <Seta name="seta-dir" size={14} />
                    <button onClick={() => irUF(uf)} aria-current={municipio ? undefined : 'location'} className={`uppercase ${municipio ? 'opacity-85 underline-offset-2 hover:underline hover:opacity-100' : ''}`}>
                      {UF_BY_SIGLA[uf].nome}
                    </button>
                  </>
                )}
                {mSel && (
                  <>
                    <Seta name="seta-dir" size={14} />
                    <span aria-current="location">{mSel.nome}</span>
                  </>
                )}
              </nav>
            </div>
            {uf && (
              <button
                onClick={() => (municipio ? irUF(uf) : irBrasil())}
                aria-label="Voltar um nível"
                className="seta-gatilho mt-3 grid h-12 w-12 flex-none place-items-center rounded-full bg-navy-2 text-lima transition hover:[--icon-2:theme(colors.off.DEFAULT)] [[data-theme=navy]_&]:bg-lima [[data-theme=navy]_&]:text-navy [[data-theme=escuro]_&]:bg-lima [[data-theme=escuro]_&]:text-[#141414]"
              >
                <Seta name="seta-esq" size={22} />
              </button>
            )}
          </div>

          <div className="mt-6">
            <Busca municipios={base} onUF={irUF} onMunicipio={(m) => irMunicipio(m.cod, m.uf)} onIndicador={setIndicadorId} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <DropdownIndicadores indicadorId={indicadorId} onEscolher={setIndicadorId} />
            <DropdownUF uf={uf} onEscolher={irUF} />
          </div>

          <div className="mt-6 grid gap-4">
            {/* Card principal: indicador */}
            <Card
              icone={ind.icone}
              rotulo={ind.titulo}
              info={
                <>
                  {ind.descricao}
                  <span className="mt-1.5 block text-cinza">Fonte: {ind.fonte}</span>
                </>
              }
            >
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <Valor>{resumo.valor}</Valor>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {resumo.selo && <Selo tom="destaque">{resumo.selo}</Selo>}
                    <span className="text-[12.5px] text-tema-suave">{resumo.apoio}</span>
                  </div>
                </div>
                {ILUSTRACAO_SETOR[ind.id] && <KitSvg nome={ILUSTRACAO_SETOR[ind.id]} size={64} className="flex-none" />}
              </div>
              <Nota>
                {grupo.rotulo} · {ATUALIZADO_EM} ·{' '}
                {/* com estado aberto, o mapa mostra os municípios */}
                {ehReal(ind, uf ? 'mun' : 'uf') ? 'dados reais da API do Observatório' : ind.real ? 'reais por estado, ilustrativos por município' : 'valores ilustrativos'}
              </Nota>
            </Card>

            {/* Caixa do estado / município */}
            {caixa && <CaixaUF tamanho="lg" {...caixa} />}

            {/* Ranking */}
            {!categorico && (
              <Card
                icone="setores"
                rotulo={uf ? `Maiores valores · municípios de ${uf}` : 'Maiores valores · UFs'}
                info={uf ? 'Os cinco municípios da UF com os maiores valores do indicador selecionado. Clique para ver no mapa.' : 'As cinco UFs com os maiores valores do indicador selecionado. Clique para abrir a UF e ver os municípios.'}
              >
                <div className="mt-1">
                  {ranking.slice(0, 5).map((x, i) => (
                    <LinhaBarra
                      key={x.cod || x.sigla}
                      pos={i + 1}
                      nome={x.nome}
                      frac={valorRank(x) / maxRank}
                      valor={formatar(ind, valorRank(x), { curto: true })}
                      ativo={(x.cod && x.cod === municipio) || (!uf && x.sigla === uf)}
                      onClick={() => (uf ? irMunicipio(x.cod, uf) : irUF(x.sigla))}
                    />
                  ))}
                </div>
              </Card>
            )}

            {/* Vocação setorial (UF) */}
            {uf && !mSel && (
              <Card
                icone="empresas"
                rotulo="Vocação setorial"
                info={
                  <>
                    Quociente locacional (QL): participação do setor nas empresas da UF dividida pela participação do mesmo setor no Brasil. QL acima de 1 indica concentração do setor acima da média nacional.
                  </>
                }
              >
                <ul className="mt-1 grid gap-2">
                  {SETORES.map((s) => {
                    const ql = quocienteLocacional(uf, s.id);
                    return (
                      <li key={s.id} className="grid grid-cols-[22px_minmax(0,1fr)_40%_44px] items-center gap-2.5 text-[13px] text-tema-tinta">
                        <Icon name={s.icone} size={18} />
                        <span>{s.rotulo}</span>
                        <span className="relative h-1.5 rounded-full bg-tema-linha">
                          <span className="absolute inset-y-0 left-0 rounded-full bg-[var(--tema-barra)]" style={{ width: `${Math.min(100, (ql / 2) * 100)}%` }} />
                          <span className="absolute -top-1 h-3.5 w-px bg-tema-suave" style={{ left: '50%' }} aria-hidden />
                        </span>
                        <span className={`text-right font-semibold tabular-nums ${ql >= 1 ? '' : 'text-tema-suave'}`}>{ql.toFixed(1).replace('.', ',')}</span>
                      </li>
                    );
                  })}
                </ul>
                <Nota>A linha marca QL = 1 (média nacional).</Nota>
              </Card>
            )}

            {/* Sebrae no território: programas e iniciativas */}
            <SebraeTerritorio base={base} uf={uf} mun={mSel} destaque={programa} onDestacar={setPrograma} />

            {/* Indicações geográficas (INPI) */}
            <IndicacoesGeograficas uf={uf} mun={mSel} destaque={programa} onDestacar={setPrograma} />

            {/* Cadeias produtivas (IBGE 2024) e extrativistas da Amazônia Legal */}
            <CadeiasProdutivas uf={uf} mun={mSel} />

            {/* Inovação (Sebrae · Indicadores Municipais de Inovação) */}
            <InovacaoTerritorio base={base} uf={uf} mun={mSel} />

            {/* Biomas (UF ou município) — dados reais */}
            {(uf || mSel) && (
              <Card icone="bioma" rotulo={`Biomas no território · ${mSel ? mSel.nome : UF_BY_SIGLA[uf].nome}`} info="Participação de cada bioma na área, a partir dos limites oficiais dos biomas (IBGE, 2019) cruzados com a malha territorial do IBGE.">
                <BarraBiomas biomas={mSel ? mSel.biomas : UF_BY_SIGLA[uf].biomas} />
              </Card>
            )}

            {/* Camadas */}
            <Card icone="filtros" rotulo="Camadas do mapa" info="Liga e desliga as camadas sobre o mapa. 'Indicadores municipais' colore os municípios com o indicador selecionado; ao escolher uma UF ele é ligado automaticamente.">
              <Camadas camadas={camadas} onAlternar={(id) => setCamadas((c) => ({ ...c, [id]: !c[id] }))} />
            </Card>
          </div>

          <p className="mt-6 font-detail text-[13px] italic text-[var(--tema-sobre-painel)] opacity-85">{ATUALIZADO_EM}</p>
        </aside>

        {/* ====================================================== MAPA */}
        <main
          ref={areaRef}
          data-mapa-area
          className={`relative order-1 h-[62vh] min-h-[420px] overflow-hidden lg:order-2 lg:h-auto ${modo === 'destaques' ? 'prancha-grade bg-[#F7F6F2]' : 'bg-[var(--tema-mapa)]'}`}
        >
          {ufsGeo && centros && (
            <Mapa
              apiRef={mapa}
              tema={tema}
              modo={modo}
              centros={centros}
              uf={uf}
              municipio={municipio}
              camadas={camadas}
              valoresUF={mapaValoresUF}
              valoresMun={mapaValoresMun}
              classesUF={mapaClassesUF}
              classesMun={mapaClassesMun}
              onModo={setModo}
              rotulosUF={rotulosUF}
              sebrae={sebrae}
              prancha={prancha}
              onHover={setHover}
              onSelecionarUF={irUF}
              onSelecionarMunicipio={irMunicipio}
              destaque={destaqueMapa}
            />
          )}

          {/* título do mapa (versão compacta, sem caixa): grupo › linha › onde › indicador */}
          <div className={`pointer-events-none absolute left-6 top-7 z-10 max-w-[calc(100%-120px)] text-[#0d0d0f] sm:left-7 sm:top-8 ${emDestaques ? '-ml-3 -mt-2 bg-[#F7F6F2] px-3 pb-2 pt-2' : ''}`}>
            <p className="truncate font-display text-[14px] font-extrabold leading-tight tracking-[-0.005em]">{emDestaques ? 'Destaques setoriais' : grupo.rotulo}</p>
            <span className={`mt-1.5 block h-[1.5px] w-[196px] max-w-full ${modo === 'destaques' ? 'bg-magenta' : 'bg-azul'}`} aria-hidden />
            <p className="mt-2 truncate font-body text-[11px] leading-tight">
              {mSel ? `${UF_BY_SIGLA[mSel.uf].nome} > ${mSel.nome}` : uf ? `${UF_BY_SIGLA[uf].nome} > ${munUF ? 'municípios' : 'estado'}` : `Brasil > ${munBR ? 'municípios' : 'estados'}`}
            </p>
            <h2 className="mt-0.5 font-body text-[20px] font-normal leading-[1.1] tracking-[-0.01em] [text-wrap:balance]">{emDestaques ? 'Setor em destaque' : ind.titulo}</h2>
          </div>

          {/* destaque de programa Sebrae no mapa */}
          {destaqueMapa && (
            <div className="anima-entra absolute left-6 top-[118px] z-10 inline-flex max-w-[calc(100%-40px)] items-center gap-2 rounded-full bg-white py-1.5 pl-3 pr-1.5 text-[12.5px] text-[#2b2b30] shadow-card sm:left-7 sm:top-[124px]">
              <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: destaqueMapa.cor }} aria-hidden />
              <span className="truncate">
                <strong className="font-semibold">{destaqueMapa.nome}</strong> ·{' '}
                {uf ? `${(base?.porUF[uf] || []).filter((m) => destaqueMapa.cods.includes(m.cod)).length.toLocaleString('pt-BR')} municípios em ${uf}` : `${destaqueMapa.cods.length.toLocaleString('pt-BR')} municípios`}
              </span>
              {!destaqueMapa.real && <span className="rounded-full bg-[#fdf0f4] px-1.5 text-[10px] font-bold uppercase text-[#8c1240]">fictício</span>}
              <button type="button" onClick={() => setPrograma(null)} aria-label="Tirar destaque" className="grid h-6 w-6 flex-none place-items-center rounded-full hover:bg-black/5">
                <Icon name="fechar" size={14} />
              </button>
            </div>
          )}

          {/* legenda (coroplético) */}
          {modo !== 'destaques' && legenda.length > 0 && (
            <>
            {/* versão compacta (celular): uma faixa de cores com mínimo e máximo */}
            <div className="absolute bottom-9 left-3 right-16 z-10 rounded-xl bg-white/95 p-2.5 shadow-flutuante sm:hidden">
              <div className="flex gap-0.5">
                {legenda.map((l, i) => (
                  <span key={i} className="h-2.5 flex-1 first:rounded-l last:rounded-r" style={{ background: l.cor }} title={l.rotulo} />
                ))}
              </div>
              <div className="mt-1 flex justify-between gap-2 text-[10.5px] tabular-nums text-[#2b2b30]">
                <span className="truncate">{categorico ? legenda[0].rotulo : legenda[0].rotulo.split(' – ')[0]}</span>
                <span className="truncate text-right">{categorico ? legenda[legenda.length - 1].rotulo : legenda[legenda.length - 1].rotulo.split(' – ').pop()}</span>
              </div>
            </div>
            <div className="absolute bottom-6 left-5 z-10 hidden w-[230px] rounded-2xl bg-white/95 p-3.5 shadow-flutuante backdrop-blur sm:block">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="truncate text-[12px] font-medium text-[#6b6b70]">{ind.titulo}</span>
                <InfoTip titulo="Como ler a legenda" lado="esquerda">
                  {ind.biomaId ? 'Faixas fixas da participação do bioma no território.' : categorico ? 'Cor do bioma predominante em cada área.' : 'Cinco faixas com o mesmo número de áreas (quintis), calculadas sobre as áreas visíveis.'}
                </InfoTip>
              </div>
              <ul className="grid gap-1 text-[12px] tabular-nums text-[#2b2b30]">
                {legenda.map((l, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="h-3 w-6 flex-none rounded-[3px]" style={{ background: l.cor }} />
                    {l.rotulo}
                  </li>
                ))}
              </ul>
              {camadas.sebrae && (
                <div className="mt-2 flex items-center gap-3 border-t border-[#efeae2] pt-2 text-[11.5px] text-[#2b2b30]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full border-2 border-lima bg-navy" /> Sede
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full border border-white bg-azul" /> Escritório
                  </span>
                </div>
              )}
            </div>
            </>
          )}

          {/* caixa do hover */}
          {hoverInfo && <CaixaHover info={hoverInfo} ind={ind} valorTexto={valorTexto} area={areaRef} />}
        </main>
      </div>

      {/* Diagnóstico das micro e pequenas empresas */}
      <MicroPequenas
        base={base}
        uf={uf}
        mun={mSel}
        onBrasil={irBrasil}
        onUF={irUF}
        onMunicipio={irMunicipio}
      />
      <Setores lugar={mSel ? `${mSel.nome} (${mSel.uf})` : uf ? UF_BY_SIGLA[uf].nome : null} />

      {/* Comparar territórios */}
      <Comparar base={base} />
        </>
      )}

      <footer className="border-t border-tema-linha bg-tema-bg px-4 py-8 text-center">
        <nav aria-label="Páginas" className="mb-3 flex justify-center gap-6 text-[14px] text-tema-tinta lg:hidden">
          <a href="#/" className="underline-offset-4 hover:underline">Início</a>
          <a href="#/estudos" className="underline-offset-4 hover:underline">Estudos</a>
        </nav>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="seta-gatilho inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-tema-tinta transition hover:bg-tema-linha">
          <Seta name="seta-dir" size={14} base={-90} />
          voltar ao topo
        </button>
      </footer>
    </div>
  );
}

function CaixaHover({ info, ind, valorTexto, area }) {
  const w = area.current?.clientWidth || 1000;
  const W = info.tipo === 'sebrae' ? 240 : 290;
  const left = Math.min(Math.max(info.x, W / 2 + 10), w - W / 2 - 10);
  const seta = info.x - left;
  if (info.tipo === 'sebrae') {
    const o = info.obj;
    return (
      <div className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[calc(100%+16px)] rounded-2xl bg-white px-4 py-3 shadow-flutuante" style={{ left, top: info.y, width: W }}>
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-azul">
          <Icon name="sebrae" size={16} /> Sebrae · {o.sede ? 'sede estadual' : 'escritório regional'}
        </div>
        <div className="mt-1 font-display text-[17px] font-bold text-navy">
          {o.nome} <span className="font-body text-[13px] font-normal text-cinza">{o.uf}</span>
        </div>
        <div className="mt-0.5 text-[11px] italic text-cinza">localização ilustrativa</div>
      </div>
    );
  }
  return (
    <div className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[calc(100%+18px)] rounded-[20px] bg-white shadow-flutuante" style={{ left, top: info.y, width: W }}>
      <div className="flex items-center gap-3.5 rounded-t-[20px] bg-[#EE85DD] px-4 py-3">
        <BandeiraQuadrada uf={info.uf} className="h-11 w-11 flex-none drop-shadow" />
        <div className="min-w-0">
          <strong className="block truncate font-display text-[20px] font-extrabold leading-tight text-navy">{info.nome}</strong>
          <span className="block truncate text-[11.5px] text-navy/70">{info.sub}</span>
        </div>
      </div>
      {info.destaque ? (
        <div className="px-4 pb-3.5 pt-2.5 text-center">
          <span className="block text-[12px] text-[#6b6b70]">Setor em destaque</span>
          <span className="inline-flex items-center gap-2 font-display text-[23px] font-extrabold text-navy">
            <span className="h-3 w-3 rounded-full" style={{ background: SETOR_DESTAQUE_BY_ID[info.destaque.setor].cor }} />
            {SETOR_DESTAQUE_BY_ID[info.destaque.setor].rotulo}
            <em className="font-body text-[12px] font-normal not-italic text-[#6b6b70]">QL {info.destaque.ql.toFixed(1).replace('.', ',')}</em>
          </span>
          {info.destaque.ficticio && <span className="mt-0.5 block text-[10.5px] font-bold uppercase tracking-wide text-[#8c1240]">fictício</span>}
        </div>
      ) : (
      <div className="px-4 pb-3.5 pt-2.5 text-center">
        <span className="block text-[12px] text-[#6b6b70]">{ind.titulo}</span>
        <span className="inline-flex items-baseline gap-2 font-display text-[23px] font-extrabold text-navy tabular-nums">
          {valorTexto(info.v)}
          {info.pos && <em className="font-body text-[12px] font-normal not-italic text-[#6b6b70]">{info.pos}º de {info.n}</em>}
        </span>
      </div>
      )}
      <span className="absolute -bottom-[7px] h-3.5 w-3.5 -translate-x-1/2 rotate-45 rounded-br-[3px] bg-white" style={{ left: `calc(50% + ${seta}px)` }} />
    </div>
  );
}

function BarraBiomas({ biomas }) {
  const lista = Object.entries(biomas || {}).sort((a, b) => b[1] - a[1]);
  if (!lista.length) return <p className="text-[13px] text-tema-suave">Sem bioma continental (área costeira/insular).</p>;
  const pred = BIOMA_BY_ID[lista[0][0]];
  return (
    <div>
      <div className="mt-1 flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={lista.map(([id, v]) => `${BIOMA_BY_ID[id].nome} ${v}%`).join(', ')}>
        {lista.map(([id, v]) => (
          <span key={id} className="min-w-[4px]" style={{ flexGrow: v, background: BIOMA_BY_ID[id].cor }} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-tema-tinta">
        {lista.map(([id, v]) => (
          <li key={id} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: BIOMA_BY_ID[id].cor }} />
            {BIOMA_BY_ID[id].nome} <span className="text-tema-suave tabular-nums">{v}%</span>
          </li>
        ))}
      </ul>
      <Nota>
        Principal cadeia produtiva no bioma {pred.nome}: <strong className="not-italic text-tema-tinta">{cadeiaBioma(pred.id) ?? '—'}</strong> · Fontes: IBGE, Biomas 2019 e PAM/PPM/PEVS 2024
      </Nota>
    </div>
  );
}

function hexRgb(h) {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
