'use client';
// Calendário de eventos (agenda FICTÍCIA de demonstração) e gerador de briefing georreferenciado.
import { useMemo, useState } from 'react';
import Icon from '../Icon';
import { CATEGORIAS, CATEGORIA_BY_ID, OBJETIVOS, SECOES_BRIEFING, chaveDia, montarBriefing, briefingEmTexto, municipioMaisProximo } from '@/lib/dados/mobile';
import { Acordeao, Botao, Chips, Folha, SeloFicticio, TituloTela, useGuardado } from './ui';

const DIAS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

// ------------------------------------------------------------------ Calendário
export function TelaCalendario({ ctx }) {
  const { p, agenda, irPara, setBriefingPara } = ctx;
  const dias = useMemo(() => {
    const r = [];
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const x = new Date(d);
      x.setDate(d.getDate() + i);
      r.push(x);
    }
    return r;
  }, []);
  const [dia, setDia] = useState(chaveDia(dias[0]));
  const [cat, setCat] = useState('todas');
  const cats = cat === 'todas' ? [] : [cat];
  const [marcados, setMarcados] = useGuardado('obs-mobile-agenda', []);
  const [ev, setEv] = useState(null);
  const doDia = agenda.filter((e) => e.dia === dia && (!cats.length || cats.includes(e.cat)));
  const comEvento = new Set(agenda.map((e) => e.dia));
  const alternarMarca = (id) => setMarcados((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  const mes = dias[0].toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <>
      <TituloTela apoio={`${p.nome} · ${mes}`}>Próximos eventos</TituloTela>
      <p className="mb-4 flex items-center gap-2 text-[12px] leading-snug text-tema-suave">
        <SeloFicticio /> agenda de demonstração, até a ligação com a agenda oficial
      </p>
      <div className="mb-4">
        <Chips itens={[{ id: 'todas', rotulo: 'Todas' }, ...CATEGORIAS]} ativo={cat} onEscolher={setCat} rotulo="Categorias" />
      </div>

      <div role="tablist" aria-label="Dias" className="sem-barra -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {dias.map((d) => {
          const k = chaveDia(d);
          const sel = k === dia;
          return (
            <button
              key={k}
              role="tab"
              aria-selected={sel}
              aria-label={d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              onClick={() => setDia(k)}
              className={`relative flex w-[52px] flex-none flex-col items-center rounded-[16px] py-2.5 ${sel ? 'bg-navy text-white [[data-theme=navy]_&]:bg-lima [[data-theme=navy]_&]:text-navy [[data-theme=escuro]_&]:bg-lima [[data-theme=escuro]_&]:text-[#141414]' : 'bg-tema-card text-tema-tinta'}`}
            >
              <span className="text-[10.5px] font-semibold">{DIAS[d.getDay()]}</span>
              <span className="font-display text-[22px] font-semibold leading-tight">{d.getDate()}</span>
              {comEvento.has(k) && <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${sel ? 'bg-lima [[data-theme=navy]_&]:bg-navy' : 'bg-[#D81E5B]'}`} />}
            </button>
          );
        })}
      </div>

      <ol className="relative mt-5 space-y-3 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-px before:bg-tema-linha">
        {doDia.length === 0 && <li className="pl-10 text-[14px] text-tema-suave">Nenhum evento neste dia{cats.length ? ' com essas categorias' : ''}.</li>}
        {doDia.map((e) => {
          const c = CATEGORIA_BY_ID[e.cat];
          const marcado = marcados.includes(e.id);
          return (
            <li key={e.id} className="relative flex gap-3">
              <button
                type="button"
                role="checkbox"
                aria-checked={marcado}
                aria-label={`Vou participar: ${e.titulo}`}
                onClick={() => alternarMarca(e.id)}
                className={`relative z-[1] mt-3 grid h-8 w-8 flex-none place-items-center rounded-[10px] border-2 ${marcado ? 'border-[#36BF76] bg-[#36BF76] text-white' : 'border-tema-linha bg-tema-bg text-transparent'}`}
              >
                <Icon name="marcado" size={18} />
              </button>
              <button type="button" onClick={() => setEv(e)} className="min-w-0 flex-1 rounded-[22px] p-4 text-left" style={{ background: `var(--tom-${c.tom})` }}>
                <span className="flex items-start justify-between gap-2">
                  <span className="font-display text-[16px] font-semibold leading-tight text-tema-tinta">{e.titulo}</span>
                  <span className="flex-none text-[13px] font-semibold tabular-nums text-tema-tinta">{e.hora}</span>
                </span>
                <span className="mt-1 block text-[13px] text-tema-suave">{e.local}</span>
                <span className="mt-1.5 inline-flex items-center gap-1.5 text-[11.5px] text-tema-suave">
                  <span className="h-2 w-2 rounded-full" style={{ background: c.cor }} />
                  {c.rotulo}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <Folha aberta={!!ev} onFechar={() => setEv(null)} titulo={ev?.titulo}>
        {ev && (
          <div className="space-y-4">
            <SeloFicticio />
            <p className="text-[14px] text-tema-tinta">
              {ev.data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}, {ev.hora}
              <br />
              {ev.local}
            </p>
            <p className="text-[15px] leading-relaxed text-tema-tinta">{ev.sobre}</p>
            <div>
              <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-tema-suave">Ações possíveis do Sebrae</h3>
              <ul className="space-y-2">
                {ev.acoes.map((a) => (
                  <li key={a} className="flex items-center gap-2 rounded-2xl bg-tema-linha/60 px-3 py-2.5 text-[14px] text-tema-tinta">
                    <Icon name="sebrae" size={18} /> {a}
                  </li>
                ))}
              </ul>
            </div>
            <Botao
              className="w-full"
              onClick={() => {
                setBriefingPara(ev);
                setEv(null);
                irPara('relatorios');
              }}
            >
              <Icon name="documento2" size={18} /> Gerar briefing para este evento
            </Botao>
          </div>
        )}
      </Folha>
    </>
  );
}

// ------------------------------------------------------------------ Briefing
export function TelaBriefing({ ctx }) {
  const { p, t, setT, base, agenda, abrirBusca, briefingPara, setBriefingPara } = ctx;
  const [objetivo, setObjetivo] = useState(briefingPara ? OBJETIVOS[2] : OBJETIVOS[0]);
  const [pauta, setPauta] = useState(briefingPara ? briefingPara.titulo : '');
  const [secoes, setSecoes] = useState(SECOES_BRIEFING.map((s) => s.id));
  const [doc, setDoc] = useState(null);
  const [aviso, setAviso] = useState('');
  const [aberto, setAberto] = useState('onde');

  const localizar = () => {
    setAviso('Procurando sua localização…');
    if (!navigator.geolocation) return setAviso('Este navegador não informa a localização. Escolha o território pela busca.');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const m = municipioMaisProximo(base, pos.coords.longitude, pos.coords.latitude);
        if (m) {
          setT({ uf: m.uf, mun: m });
          setAviso(`Localização encontrada: ${m.nome} (${m.uf}).`);
        }
      },
      () => setAviso('Não foi possível obter a localização (permissão negada ou indisponível). Escolha o território pela busca.'),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  const gerar = () => {
    const ag = agenda.filter((e) => !t.mun || e.mun.cod === t.mun.cod || e.uf === t.uf);
    setDoc(montarBriefing(p, t, { objetivo, secoes, agenda: ag, pauta }));
    setBriefingPara(null);
    window.scrollTo({ top: 0 });
  };
  const texto = doc ? briefingEmTexto(doc) : '';
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setAviso('Briefing copiado.');
    } catch {
      setAviso('Não foi possível copiar neste navegador.');
    }
  };
  const compartilhar = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: doc.titulo, text: texto });
      } catch {
        /* cancelado */
      }
    } else copiar();
  };

  if (doc)
    return (
      <>
        <div className="nao-imprimir mb-3 flex items-center gap-2">
          <button type="button" onClick={() => setDoc(null)} className="seta-gatilho flex items-center gap-1 rounded-full px-2 py-1.5 text-[14px] font-semibold text-tema-tinta hover:bg-tema-linha">
            <Icon name="voltar" size={18} /> editar
          </button>
        </div>
        <article className="briefing-doc rounded-[24px] bg-tema-card p-5">
          <header className="mb-4 border-b border-tema-linha pb-4">
            <p className="text-[12px] font-bold uppercase tracking-wide text-[#36BF76]">Briefing do território</p>
            <h1 className="mt-1 font-display text-[26px] font-extrabold leading-tight text-tema-tinta">{doc.titulo.replace('Briefing · ', '')}</h1>
            <p className="mt-1 text-[13px] text-tema-suave">
              {doc.subtitulo} · {doc.data}
            </p>
          </header>
          {doc.secoes.map((s) => (
            <section key={s.titulo} className="mb-4">
              <h2 className="mb-1.5 flex items-center gap-2 font-display text-[16px] font-bold text-tema-tinta">
                {s.titulo} {s.ficticio && <SeloFicticio />}
              </h2>
              <ul className="space-y-1.5 text-[14px] leading-relaxed text-tema-tinta">
                {s.itens.map((i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 flex-none rounded-full bg-[#36BF76]" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {doc.atencao.length > 0 && (
            <section className="mb-4 rounded-2xl bg-lima/40 p-4 [[data-theme=escuro]_&]:bg-lima/15 [[data-theme=navy]_&]:bg-lima/15">
              <h2 className="mb-1.5 font-display text-[15px] font-bold text-tema-tinta">Pontos de atenção</h2>
              <ul className="list-disc space-y-1 pl-5 text-[14px] text-tema-tinta">
                {doc.atencao.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </section>
          )}
          <p className="text-[11px] leading-snug text-tema-apagado">Fontes: {doc.fontes}</p>
        </article>
        <div className="nao-imprimir mt-4 grid grid-cols-3 gap-2">
          <Botao tipo="secundario" className="px-2" onClick={copiar}>
            Copiar
          </Botao>
          <Botao tipo="secundario" className="px-2" onClick={compartilhar}>
            <Icon name="enviar" size={16} /> Enviar
          </Botao>
          <Botao tipo="secundario" className="px-2" onClick={() => window.print()}>
            <Icon name="baixar" size={16} /> PDF
          </Botao>
        </div>
        {aviso && (
          <p role="status" className="nao-imprimir mt-3 text-center text-[13px] text-tema-suave">
            {aviso}
          </p>
        )}
      </>
    );

  return (
    <>
      <TituloTela apoio="um resumo do território para levar à visita, à reunião ou ao evento">Gerar briefing</TituloTela>
      <div className="border-t border-tema-linha">
        <Acordeao titulo="Onde" icone="pino" aberto={aberto === 'onde'} onAlternar={() => setAberto((a) => (a === 'onde' ? null : 'onde'))}>
          <div className="space-y-2">
            <button type="button" onClick={() => abrirBusca((nt) => setT(nt))} className="flex w-full items-center gap-2 rounded-full bg-tema-card px-4 py-3 text-left text-[14px] text-tema-tinta">
              <Icon name="pino" size={18} /> <span className="flex-1">{p.nome}</span> <span className="text-[12px] text-tema-suave">trocar</span>
            </button>
            <Botao tipo="lima" className="w-full" onClick={localizar}>
              <Icon name="recentrar" size={18} /> Usar minha localização
            </Botao>
            {aviso && (
              <p role="status" className="text-[13px] text-tema-suave">
                {aviso}
              </p>
            )}
          </div>
        </Acordeao>
        <Acordeao titulo="Para quê" icone="documento2" aberto={aberto === 'para'} onAlternar={() => setAberto((a) => (a === 'para' ? null : 'para'))}>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Objetivo">
            {OBJETIVOS.map((o) => (
              <button key={o} type="button" role="radio" aria-checked={o === objetivo} onClick={() => setObjetivo(o)} className={`rounded-full px-3.5 py-2 text-[13px] ${o === objetivo ? 'bg-navy text-white [[data-theme=navy]_&]:bg-lima [[data-theme=navy]_&]:text-navy [[data-theme=escuro]_&]:bg-lima [[data-theme=escuro]_&]:text-[#141414]' : 'bg-tema-card text-tema-tinta'}`}>
                {o}
              </button>
            ))}
          </div>
          <label className="mt-3 block text-[13px] text-tema-suave" htmlFor="pauta">
            Pauta (opcional)
          </label>
          <input id="pauta" value={pauta} onChange={(e) => setPauta(e.target.value)} placeholder="ex.: reunião com a secretaria de desenvolvimento" className="mt-1 w-full rounded-2xl border border-tema-linha bg-tema-card px-4 py-3 text-[14px] text-tema-tinta placeholder:text-tema-apagado" />
        </Acordeao>
        <Acordeao titulo="O que incluir" icone="categoria" aberto={aberto === 'secoes'} onAlternar={() => setAberto((a) => (a === 'secoes' ? null : 'secoes'))}>
          <ul className="space-y-1">
            {SECOES_BRIEFING.map((s) => {
              const on = secoes.includes(s.id);
              return (
                <li key={s.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl px-1 py-2 text-[14px] text-tema-tinta">
                    <input type="checkbox" checked={on} onChange={() => setSecoes((x) => (on ? x.filter((y) => y !== s.id) : [...x, s.id]))} className="h-5 w-5 accent-[#36BF76]" />
                    {s.rotulo}
                    {s.id === 'agenda' && <SeloFicticio />}
                  </label>
                </li>
              );
            })}
          </ul>
        </Acordeao>
      </div>
      <Botao className="mt-6 w-full" onClick={gerar} disabled={!secoes.length}>
        <Icon name="documento2" size={18} /> Gerar briefing de {p.nome}
      </Botao>
    </>
  );
}
