'use client';
// Telas de dados da versão mobile: Início, Micro e Pequenas Empresas, Território-setor e Comparar.
// Visualização recortada: poucos números por vez e o resto em dropdowns (acordeões).
import { useMemo, useState } from 'react';
import Icon from '../Icon';
import { asset } from '@/lib/asset';
import { UF_BY_SIGLA, REGIOES } from '@/lib/dados/ufs';
import { cartoes, caixasMPE, heroi, temas, trilha, GENTILICO, perfil, curto, GRUPOS_CARTAO, serieAberturas } from '@/lib/dados/mobile';
import { pctTxt } from '@/lib/dados/comparar';
import { Acordeao, Botao, CartaoNumero, Chamada, Chips, Folha, TituloTela } from './ui';
import MapaMini from './MapaMini';
import { PROGRAMAS } from '@/lib/dados/sebraeTerritorio';
import { doTerritorio, proximos } from '@/lib/dados/calendario';

const IMG_SETOR = { agro: 'agro', comercio: 'comercio', industria: 'industria', servicos: 'servicos' };

function Trilha({ t, onIr }) {
  const passos = trilha(t);
  if (passos.length < 2) return null;
  return (
    <nav aria-label="Navegação territorial" className="mb-1 flex flex-wrap items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.04em] text-tema-suave">
      {passos.map((p, i) => (
        <span key={p.rotulo} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden="true">›</span>}
          {i < passos.length - 1 ? (
            <button type="button" onClick={() => onIr(p.t)} className="uppercase underline-offset-2 hover:underline">
              {p.rotulo}
            </button>
          ) : (
            <span aria-current="location">{p.rotulo}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/** Grade de caixas: mostra as 4 primeiras; o restante abre num dropdown */
function GradeCartoes({ lista, onDetalhe, inicial = 4 }) {
  const [mais, setMais] = useState(false);
  const vis = mais ? lista : lista.slice(0, inicial);
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {vis.map((c) => (
          <CartaoNumero key={c.id} c={c} onClick={() => onDetalhe(c)} />
        ))}
      </div>
      {lista.length > inicial && (
        <button type="button" aria-expanded={mais} onClick={() => setMais((v) => !v)} className="mx-auto mt-3 flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-tema-tinta hover:bg-tema-linha">
          {mais ? 'mostrar menos' : `mais ${lista.length - inicial} indicadores`}
          <span className={`transition-transform ${mais ? 'rotate-180' : ''}`}>
            <Icon name="chevron" size={16} />
          </span>
        </button>
      )}
    </>
  );
}

function DetalheCartao({ c, onFechar }) {
  return (
    <Folha aberta={!!c} onFechar={onFechar} titulo={c?.rotulo && c.rotulo[0].toUpperCase() + c.rotulo.slice(1)}>
      {c && (
        <>
          <p className="font-display text-[40px] font-semibold leading-none tracking-tight text-tema-tinta tabular-nums">{c.valor}</p>
          {c.apoio && <p className="mt-2 text-[14px] font-semibold text-tema-suave">{c.apoio}</p>}
          <p className="mt-4 text-[15px] leading-relaxed text-tema-tinta">{c.sobre}</p>
          <p className="mt-4 text-[12px] text-tema-apagado">Fonte: {c.fonte} · API do Observatório</p>
        </>
      )}
    </Folha>
  );
}

// ------------------------------------------------------------------ Início
export function TelaInicio({ ctx }) {
  const { p, t, irPara, setT, base, abrirBusca } = ctx;
  const [det, setDet] = useState(null);
  const [grupo, setGrupo] = useState('destaque');
  const h = heroi(p, t);
  const lista = cartoes(p, t);
  const g = GRUPOS_CARTAO.find((x) => x.id === grupo);
  const vis = g.ids ? g.ids.map((id) => lista.find((c) => c.id === id)) : lista.filter((c) => c.grupo === grupo);
  return (
    <>
      <p className="text-[15px] text-tema-suave">Olá! Este é o retrato de</p>
      <button type="button" onClick={() => abrirBusca((nt) => setT(nt))} className="seta-gatilho group mt-0.5 flex max-w-full items-center gap-2 text-left">
        <h1 className="truncate font-display text-[34px] font-semibold leading-tight tracking-tight text-tema-tinta">{p.nome}</h1>
        <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-tema-card text-tema-tinta">
          <Icon name="chevron" size={16} />
        </span>
        <span className="sr-only">trocar território</span>
      </button>
      <p className="mb-4 text-[13px] text-tema-suave">
        {h.valor} {h.rotulo}
        {t.uf && !t.mun ? ` · região ${REGIOES[UF_BY_SIGLA[t.uf].regiao]}` : ''}
        {t.mun ? ` · ${UF_BY_SIGLA[t.uf].nome}` : ''}
      </p>

      <Chips itens={GRUPOS_CARTAO} ativo={grupo} onEscolher={setGrupo} rotulo="Temas" />

      <GraficoAberturas t={t} base={base} />

      <div className="mt-3 grid grid-cols-2 gap-3">
        {vis.map((c) => (
          <CartaoNumero key={c.id} c={c} onClick={() => setDet(c)} />
        ))}
      </div>

      <div className="mt-4">
        <Chamada texto={<>Vai a campo? <strong>Gere o briefing de {p.nome}</strong> em um toque.</>} onClick={() => irPara('relatorios')} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <AtalhoGrande icone="empresas" titulo="Micro e pequenas empresas" onClick={() => irPara('mpe')} />
        <AtalhoGrande icone="pino" titulo="Território-setor" onClick={() => irPara('territorio')} />
      </div>
      <DetalheCartao c={det} onFechar={() => setDet(null)} />
    </>
  );
}

/** Cartão com gráfico: aberturas de pequenos negócios por ano */
function GraficoAberturas({ t, base }) {
  const serie = serieAberturas(t, base);
  const v25 = serie[1].v;
  const v24 = serie[0].v;
  const varia = v24 && v25 != null ? ((v25 - v24) / v24) * 100 : null;
  const max = Math.max(...serie.map((x) => x.v || 0)) || 1;
  return (
    <section className="mt-3 rounded-[28px] bg-tema-card p-5" aria-label="Aberturas de pequenos negócios por ano">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] text-tema-suave">Pequenos negócios abertos em 2025</p>
          <p className="mt-1 font-display text-[30px] font-semibold leading-none tracking-tight text-tema-tinta tabular-nums">{curto(v25)}</p>
          {varia != null && (
            <p className={`mt-1.5 text-[12px] font-semibold ${varia >= 0 ? 'text-[#2F6551] [[data-theme=navy]_&]:text-lima [[data-theme=escuro]_&]:text-[#60B466]' : 'text-[#B5174C] [[data-theme=navy]_&]:text-[#F49AC1] [[data-theme=escuro]_&]:text-[#F49AC1]'}`}>
              {varia >= 0 ? '↗' : '↘'} {varia >= 0 ? '+' : '−'}
              {pctTxt(Math.abs(varia))}% sobre 2024
            </p>
          )}
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-lima text-navy">
          <Icon name="tendencia" size={20} />
        </span>
      </div>
      <div className="mt-5 grid h-[110px] grid-cols-3 items-end gap-4" aria-hidden="true">
        {serie.map((x) => (
          <div key={x.ano} className="flex h-full flex-col items-center justify-end gap-1.5">
            <span className="text-[11px] font-semibold text-tema-tinta tabular-nums">{curto(x.v)}</span>
            <span
              className={`w-full rounded-[12px] ${x.ano === 2025 ? 'bg-navy [[data-theme=navy]_&]:bg-lima [[data-theme=escuro]_&]:bg-lima' : x.parcial ? 'border-2 border-dashed border-[#A093D1] bg-[var(--tom-lavanda)]' : 'bg-[var(--tom-lavanda)]'}`}
              style={{ height: `${Math.max(6, ((x.v || 0) / max) * 72)}px` }}
            />
            <span className="text-[11.5px] text-tema-suave">{x.ano}{x.parcial ? '*' : ''}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-tema-apagado">*2026 até nov. · Receita Federal</p>
    </section>
  );
}

function AtalhoGrande({ icone, titulo, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-[112px] flex-col justify-between rounded-[24px] bg-tema-card p-4 text-left">
      <span className="flex w-full items-start justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--tom-verde)] text-tema-tinta">
          <Icon name={icone} size={20} />
        </span>
        <span className="text-tema-tinta" aria-hidden="true">↗</span>
      </span>
      <span className="font-display text-[15px] font-semibold leading-snug text-tema-tinta">{titulo}</span>
    </button>
  );
}

// ------------------------------------------------------------------ Micro e pequenas empresas
export function TelaMPE({ ctx }) {
  const { p, t, setT, base, onAvancada } = ctx;
  const [aberto, setAberto] = useState(null);
  const caixas = caixasMPE(p, t);
  const lista = useMemo(() => temas(p, t, base), [p, t, base]);
  return (
    <>
      <Trilha t={t} onIr={setT} />
      <TituloTela>Micro e pequenas empresas</TituloTela>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {caixas.map((c, i) => (
          <div key={c.rotulo} className="flex min-w-0 flex-col rounded-[20px] p-3 text-tema-tinta" style={{ background: `var(--tom-${['verde', 'lima', 'lavanda'][i]})` }}>
            <span className="font-display text-[24px] font-semibold leading-none tracking-tight tabular-nums">{c.valor}</span>
            <span className="mt-1.5 text-[11.5px] leading-snug text-tema-suave">{c.rotulo}</span>
          </div>
        ))}
      </div>
      <div className="rounded-[24px] bg-tema-card px-4 [&>div:last-child]:border-b-0">
        {lista.map((tm) => (
          <Acordeao key={tm.id} titulo={tm.titulo} icone={tm.icone} aberto={aberto === tm.id} onAlternar={() => setAberto((a) => (a === tm.id ? null : tm.id))}>
            <ConteudoTema tm={tm} />
          </Acordeao>
        ))}
      </div>
      <Botao tipo="secundario" className="mt-6 w-full" onClick={onAvancada}>
        <Icon name="expandir" size={18} /> visualizar versão avançada
      </Botao>
    </>
  );
}

function ConteudoTema({ tm }) {
  if (tm.emPreparacao)
    return (
      <p className="rounded-2xl bg-tema-linha/60 p-4 text-[14px] leading-relaxed text-tema-tinta">
        <strong className="mb-1 block text-[12px] uppercase tracking-wide text-tema-suave">em preparação</strong>
        {tm.texto}
      </p>
    );
  const max = tm.barras ? Math.max(...tm.barras.map((b) => Math.abs(b.v))) : 1;
  return (
    <div className="space-y-3">
      {tm.linhas.length > 0 && (
        <dl className="divide-y divide-tema-linha rounded-2xl bg-[var(--tom-areia)] px-4">
          {tm.linhas.map((l) => (
            <div key={l.rotulo} className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-[13px] leading-snug text-tema-tinta">{l.rotulo}</dt>
              <dd className={`flex-none text-right font-display font-semibold tabular-nums text-tema-tinta ${l.destaque ? 'text-[22px]' : 'text-[16px]'}`}>{l.valor}</dd>
            </div>
          ))}
        </dl>
      )}
      {tm.barras && (
        <ul className="space-y-2.5 rounded-2xl bg-[var(--tom-areia)] p-4">
          {tm.barras.map((b) => (
            <li key={b.rotulo} className="grid grid-cols-[22px_76px_1fr_54px] items-center gap-2 text-[13px] text-tema-tinta">
              <Icon name={b.icone} size={18} />
              <span className="truncate">{b.rotulo}</span>
              <span className="h-2 rounded-full bg-tema-linha">
                <span className="block h-2 rounded-full bg-[var(--tema-barra)]" style={{ width: `${Math.max(4, (Math.abs(b.v) / max) * 100)}%` }} />
              </span>
              <span className="text-right font-semibold tabular-nums">{b.txt}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[13px] leading-relaxed text-tema-suave">{tm.texto}</p>
      <p className="text-[11px] text-tema-apagado">Fonte: {tm.fonte}</p>
    </div>
  );
}

// ------------------------------------------------------------------ Território-setor
export function TelaTerritorio({ ctx }) {
  const { p, t, setT, base, irPara, agenda, setComparar } = ctx;
  const [det, setDet] = useState(null);
  const [aberto, setAberto] = useState('sebrae');
  const alt = (id) => setAberto((a) => (a === id ? null : id));
  const u = t.uf ? UF_BY_SIGLA[t.uf] : null;
  const info = [];
  if (u && !t.mun) {
    info.push({ id: 'pop', tom: 'lima', curtoRot: 'Habitantes', icone: 'pessoas', valor: `${u.pop.toLocaleString('pt-BR')} mi`, rotulo: 'habitantes', fonte: 'IBGE · Censo 2022', sobre: 'População residente no Censo Demográfico 2022, em milhões.' });
    info.push({ id: 'gent', tom: 'lavanda', curtoRot: 'Gentílico', apoio: `capital: ${u.capital}`, icone: 'localizacao', valor: GENTILICO[t.uf][0].toUpperCase() + GENTILICO[t.uf].slice(1), rotulo: 'gentílico', fonte: 'IBGE', sobre: `Quem nasce em ${u.nome} é ${GENTILICO[t.uf]}. Região ${REGIOES[u.regiao]}.` });
  }
  if (t.mun) info.push({ id: 'uf', tom: 'lavanda', curtoRot: 'Estado', icone: 'localizacao', valor: t.uf, rotulo: `${UF_BY_SIGLA[t.uf].nome}${t.mun.cap ? ' · capital' : ''}`, fonte: 'IBGE', sobre: `Município de ${UF_BY_SIGLA[t.uf].nome}, região ${REGIOES[UF_BY_SIGLA[t.uf].regiao]}.` });
  if (p.bioma) info.push({ id: 'bioma', tom: 'verde', curtoRot: 'Bioma', icone: 'bioma', valor: p.bioma, rotulo: 'bioma predominante', fonte: 'IBGE · Biomas', sobre: 'Bioma com a maior parte do território.' });
  const cs = cartoes(p, t);
  info.push(cs.find((c) => c.id === 'remuneracao'), cs.find((c) => c.id === 'vinculos'), cs.find((c) => c.id === 'ativas'));
  const pinos = proximos(99, doTerritorio(agenda, t)).filter((e) => e.mun);

  return (
    <>
      <Trilha t={t} onIr={setT} />
      <TituloTela apoio="toque no mapa para escolher um estado ou município">Território-setor</TituloTela>
      <MapaMini t={t} base={base} onEscolher={setT} pinos={pinos} />
      <h2 className="mb-3 mt-5 font-display text-[22px] font-semibold text-tema-tinta">{p.nome}</h2>
      <GradeCartoes lista={info.filter(Boolean)} onDetalhe={setDet} />

      <div className="mt-5 rounded-[24px] bg-tema-card px-4 [&>div:last-child]:border-b-0">
        <Acordeao titulo="Sebrae no território" icone="sebrae" aberto={aberto === 'sebrae'} onAlternar={() => alt('sebrae')}>
          <SebraeNoTerritorio p={p} t={t} />
        </Acordeao>
        <Acordeao titulo="Setores em destaque" icone="setores" aberto={aberto === 'setores'} onAlternar={() => alt('setores')}>
          <SetoresDestaque p={p} t={t} />
        </Acordeao>
        <Acordeao titulo="Micro e pequenas empresas" icone="empresas" aberto={aberto === 'mpe'} onAlternar={() => alt('mpe')}>
          <div className="grid grid-cols-3 gap-2">
            {caixasMPE(p, t).map((c, i) => (
              <div key={c.rotulo} className="rounded-[20px] p-3 text-tema-tinta" style={{ background: `var(--tom-${['verde', 'lima', 'lavanda'][i]})` }}>
                <span className="block font-display text-[22px] font-semibold leading-none tracking-tight">{c.valor}</span>
                <span className="mt-1 block text-[11.5px] leading-snug text-tema-suave">{c.rotulo}</span>
              </div>
            ))}
          </div>
          <Botao tipo="secundario" className="mt-3 w-full" onClick={() => irPara('mpe')}>
            ver os temas das MPE <Icon name="seta-dir" size={16} />
          </Botao>
        </Acordeao>
        <Acordeao titulo="Comparativo" icone="trocar" aberto={aberto === 'cmp'} onAlternar={() => alt('cmp')}>
          <p className="mb-3 text-[14px] text-tema-tinta">Compare {p.nome} com o Brasil ou com outro território.</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-full bg-tema-linha/70 px-4 py-3 text-[14px] text-tema-tinta">
              <Icon name="pino" size={18} /> {p.nome}
            </div>
            <div className="flex items-center gap-2 rounded-full bg-tema-linha/70 px-4 py-3 text-[14px] text-tema-tinta">
              <Icon name="pino" size={18} /> {t.mun ? UF_BY_SIGLA[t.uf].nome : 'Brasil'}
            </div>
          </div>
          <Botao className="mt-3 w-full" onClick={() => { setComparar([t, t.mun ? { uf: t.uf } : {}]); irPara('comparar'); }}>
            Comparar
          </Botao>
        </Acordeao>
      </div>
      <DetalheCartao c={det} onFechar={() => setDet(null)} />
    </>
  );
}

function SebraeNoTerritorio({ p, t }) {
  const [todos, setTodos] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between rounded-2xl bg-[var(--tom-lima)] px-4 py-3">
        <span className="text-[13px] text-tema-tinta">Empresas atendidas em 2025</span>
        <span className="font-display text-[22px] font-semibold text-tema-tinta tabular-nums">{curto(p.atendidas)}</span>
      </div>
      {!p.prog && <p className="text-[13px] text-tema-suave">Carregando os programas…</p>}
      {p.prog && t.mun && (
        <ul className="grid grid-cols-2 gap-2">
          {ctxProgramas(p).map((x) => (
            <li key={x.id} className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-[12.5px] leading-tight ${x.sim ? 'border-transparent bg-tema-card text-tema-tinta' : 'border-dashed border-tema-linha text-tema-apagado'}`}>
              <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: x.sim ? x.cor : 'transparent', border: x.sim ? 0 : '1px solid currentColor' }} />
              {x.nome}
            </li>
          ))}
        </ul>
      )}
      {p.prog && !t.mun && (
        <ul className="space-y-2.5 rounded-2xl bg-[var(--tom-areia)] p-4">
          {[...p.prog.cobertura].sort((a, b) => b.pct - a.pct).slice(0, todos ? 99 : 4).map((x) => (
            <li key={x.id} className="text-[12.5px] text-tema-tinta">
              <span className="flex justify-between gap-2">
                <span className="truncate">{x.nome}</span>
                <span className="font-semibold tabular-nums">{pctTxt(x.pct, 0)}%</span>
              </span>
              <span className="mt-1 block h-1.5 rounded-full bg-tema-linha">
                <span className="block h-1.5 rounded-full" style={{ width: `${Math.max(2, x.pct)}%`, background: x.cor }} />
              </span>
            </li>
          ))}
        </ul>
      )}
      {p.prog && !t.mun && p.prog.cobertura.length > 4 && (
        <button type="button" aria-expanded={todos} onClick={() => setTodos((v) => !v)} className="text-[13px] font-semibold text-tema-tinta underline underline-offset-4">
          {todos ? 'mostrar menos' : `ver os ${p.prog.cobertura.length} programas`}
        </button>
      )}
      <p className="text-[11px] text-tema-apagado">{t.mun ? 'Programas com registro no município.' : 'Parte dos municípios com cada programa.'} Fonte: Sebrae · API do Observatório.</p>
    </div>
  );
}
// programas do município: todos os acompanhados, marcando os presentes
function ctxProgramas(p) {
  const pres = new Set(p.prog.presentes.map((x) => x.id));
  return PROGRAMAS.filter((x) => x.id !== 'ig').map((x) => ({ ...x, sim: pres.has(x.id) }));
}

function SetoresDestaque({ p, t }) {
  const ord = [...p.setores].filter((s) => s.n).sort((a, b) => (t.uf ? b.ql - a.ql : b.part - a.part));
  return (
    <div className="sem-barra -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1">
      {ord.map((s) => (
        <div key={s.id} className="w-[150px] flex-none snap-start overflow-hidden rounded-[20px] bg-tema-card">
          <div className="relative h-[92px]" style={{ background: s.cor }}>
            {IMG_SETOR[s.id] && <img src={asset(`setores/${IMG_SETOR[s.id]}.webp`)} alt="" className="h-full w-full object-cover" loading="lazy" />}
          </div>
          <div className="p-3">
            <p className="font-display text-[15px] font-bold text-tema-tinta">{s.nome}</p>
            <p className="font-display text-[20px] font-semibold text-tema-tinta tabular-nums">{pctTxt(s.part * 100, 0)}%</p>
            <p className="text-[11.5px] leading-snug text-tema-suave">{t.uf ? `${s.ql.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}× a proporção do Brasil` : 'dos pequenos negócios'}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ Comparar
export function TelaComparar({ ctx }) {
  const { base, extras, comparar, setComparar, abrirBusca } = ctx;
  const [a, b] = comparar;
  const pa = useMemo(() => perfil(a, base, extras), [a, base, extras]);
  const pb = useMemo(() => perfil(b, base, extras), [b, base, extras]);
  const ca = cartoes(pa, a);
  const cb = cartoes(pb, b);
  const [det, setDet] = useState(null);
  const lado = (i) => (
    <button type="button" onClick={() => abrirBusca((nt) => setComparar(i === 0 ? [nt, b] : [a, nt]))} className="flex w-full items-center gap-2 rounded-full bg-tema-card px-4 py-3 text-left text-[14px] text-tema-tinta">
      <Icon name="pino" size={18} className={i === 0 ? 'text-[#36BF76]' : 'text-[#A093D1]'} />
      <span className="min-w-0 flex-1 truncate">{(i === 0 ? pa : pb).nome}</span>
      <span className="text-[12px] text-tema-suave">trocar</span>
    </button>
  );
  return (
    <>
      <TituloTela apoio="toque em um território para trocar">Comparar</TituloTela>
      <div className="space-y-2">
        {lado(0)}
        {lado(1)}
      </div>
      <div className="sticky top-[64px] z-10 -mx-5 mt-5 grid grid-cols-2 border-b border-tema-linha bg-[var(--app-bg)] px-5 py-2.5 text-center font-display text-[15px] font-bold text-tema-tinta">
        <span className="truncate border-r border-tema-linha pr-2">{pa.nome}</span>
        <span className="truncate pl-2">{pb.nome}</span>
      </div>
      <ul className="mt-3 space-y-3">
        {ca.map((c, i) => (
          <li key={c.id}>
            <p className="mb-1.5 text-center text-[12.5px] font-semibold text-tema-suave">{c.rotulo}</p>
            <div className="grid grid-cols-2 gap-3">
              {[c, cb[i]].map((x, j) => (
                <button key={j} type="button" onClick={() => setDet(x)} className="rounded-[20px] p-3 text-center" style={{ background: `var(--tom-${j === 0 ? 'verde' : 'lavanda'})` }}>
                  <span className="block font-display text-[22px] font-semibold leading-tight tracking-tight text-tema-tinta tabular-nums">{x.valor}</span>
                  {x.apoio && <span className="mt-0.5 block text-[11px] text-tema-suave">{x.apoio}</span>}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[11px] text-tema-apagado">Contagens absolutas dependem do tamanho de cada território. Fontes: Receita Federal, RAIS 2025, Novo CAGED, Sebrae e REDESIM.</p>
      <DetalheCartao c={det} onFechar={() => setDet(null)} />
    </>
  );
}
