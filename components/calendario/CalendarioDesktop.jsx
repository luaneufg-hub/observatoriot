'use client';
// Calendário de eventos da DITEC (versão desktop, #/calendario): grade do mês, filtro por unidade
// e detalhe do evento. Dados reais da planilha Calendário Sebrae DITEC 2026.
import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../Icon';
import Seta from '../Seta';
import { CATEGORIAS_CAL, CAT_BY_ID, EVENTOS, FONTE_CALENDARIO, doMes, noDia, nomeMes, periodo, localTexto, proximos, tomCat } from '@/lib/dados/calendario';

const SEMANA = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
const ANO = 2026;

/** dias exibidos na grade: semanas completas (segunda a domingo) que cobrem o mês */
function diasDaGrade(ano, mes) {
  const primeiro = new Date(ano, mes, 1);
  const ini = new Date(primeiro);
  ini.setDate(1 - ((primeiro.getDay() + 6) % 7));
  const ultimo = new Date(ano, mes + 1, 0);
  const fim = new Date(ultimo);
  fim.setDate(ultimo.getDate() + (6 - ((ultimo.getDay() + 6) % 7)));
  const r = [];
  for (let d = new Date(ini); d <= fim; d.setDate(d.getDate() + 1)) r.push(new Date(d));
  return r;
}
const mesmoDia = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function CalendarioDesktop() {
  const hoje = useMemo(() => new Date(), []);
  const [mes, setMes] = useState(hoje.getFullYear() === ANO ? hoje.getMonth() : 0);
  const [cat, setCat] = useState('todas');
  const [ev, setEv] = useState(null);
  const [diaAberto, setDiaAberto] = useState(null);

  const lista = useMemo(() => (cat === 'todas' ? EVENTOS : EVENTOS.filter((e) => e.categoria === cat)), [cat]);
  const dias = useMemo(() => diasDaGrade(ANO, mes), [mes]);
  const noMes = doMes(ANO, mes, lista);
  const prox = proximos(4, lista, hoje);

  return (
    <section id="calendario" className="bg-tema-bg px-4 pb-20 pt-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1240px]">
        {/* topo */}
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <div className="min-w-0">
            <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-tema-suave">Calendário DITEC</p>
            <div className="flex items-center gap-4">
              <h1 className="font-display text-[clamp(40px,4.6vw,64px)] font-extrabold leading-none tracking-tight text-tema-tinta">
                {nomeMes(mes)[0].toUpperCase() + nomeMes(mes).slice(1)}’ {String(ANO).slice(2)}
              </h1>
              <div className="flex items-center gap-1">
                <button type="button" disabled={mes === 0} onClick={() => setMes((m) => m - 1)} aria-label="Mês anterior" className="seta-gatilho grid h-10 w-10 place-items-center rounded-full text-tema-tinta hover:bg-tema-linha disabled:opacity-30">
                  <Seta name="seta-esq" size={18} />
                </button>
                <button type="button" onClick={() => setMes(hoje.getFullYear() === ANO ? hoje.getMonth() : 0)} aria-label="Voltar para o mês atual" className="grid h-10 w-10 place-items-center rounded-full text-tema-tinta hover:bg-tema-linha">
                  <span className="h-2 w-2 rounded-full bg-current" />
                </button>
                <button type="button" disabled={mes === 11} onClick={() => setMes((m) => m + 1)} aria-label="Próximo mês" className="seta-gatilho grid h-10 w-10 place-items-center rounded-full text-tema-tinta hover:bg-tema-linha disabled:opacity-30">
                  <Seta name="seta-dir" size={18} />
                </button>
              </div>
            </div>
            <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-tema-suave">
              Encontros de gestores, fóruns e premiações da Diretoria Técnica do Sebrae em {ANO}. Clique num evento para ver local, datas e público.
            </p>
          </div>
          <div className="ml-auto text-right text-[13px] text-tema-suave">
            <span className="block font-display text-[28px] font-extrabold leading-none text-tema-tinta">{noMes.length}</span>
            evento{noMes.length === 1 ? '' : 's'} em {nomeMes(mes)}
          </div>
        </div>

        {/* filtro por unidade */}
        <div role="radiogroup" aria-label="Filtrar por unidade" className="mt-8 flex flex-wrap gap-2">
          {[{ id: 'todas', rotulo: 'Todas as unidades' }, ...CATEGORIAS_CAL].map((c) => {
            const on = c.id === cat;
            return (
              <button key={c.id} type="button" role="radio" aria-checked={on} onClick={() => setCat(c.id)} className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] transition ${on ? 'bg-navy font-semibold text-white [[data-theme=navy]_&]:bg-lima [[data-theme=navy]_&]:text-navy [[data-theme=escuro]_&]:bg-lima [[data-theme=escuro]_&]:text-[#141414]' : 'bg-tema-card text-tema-tinta hover:bg-tema-linha'}`}>
                {c.cor && <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.cor }} />}
                {c.curto || c.rotulo}
              </button>
            );
          })}
        </div>

        {/* grade do mês */}
        <div className="mt-8 grid grid-cols-7 gap-x-3 lg:gap-x-5" aria-label={`Eventos de ${nomeMes(mes)} de ${ANO}`} role="group">
          {SEMANA.map((s, i) => (
            <div key={s} aria-hidden="true" className={`pb-3 text-[12px] font-bold tracking-[0.06em] ${i >= 5 ? 'text-tema-apagado' : 'text-tema-suave'}`}>
              {s}
            </div>
          ))}
          {dias.map((d) => {
            const fora = d.getMonth() !== mes;
            const ehHoje = mesmoDia(d, hoje);
            const evs = fora ? [] : lista.filter((e) => noDia(e, d));
            const vis = evs.slice(0, 3);
            return (
              <div key={d.toISOString()} className={`min-h-[150px] border-t-2 pb-4 pt-3 ${ehHoje ? 'border-[#D81E5B] bg-[var(--tema-linha)] px-2.5' : fora ? 'border-tema-linha' : 'border-tema-tinta/80'}`}>
                <span className={`block font-display text-[28px] font-semibold leading-none tabular-nums ${ehHoje ? 'text-[#B5174C] [[data-theme=navy]_&]:text-[#F49AC1] [[data-theme=escuro]_&]:text-[#F49AC1]' : fora ? 'text-tema-apagado' : 'text-tema-tinta'}`}>
                  {String(d.getDate()).padStart(2, '0')}
                </span>
                <span className="sr-only">
                  {d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {ehHoje ? ', hoje' : ''}
                </span>
                <ul className="mt-3 space-y-2.5">
                  {vis.map((e) => {
                    const continua = !e.soMes && !mesmoDia(e.dInicio, d) && d.getDay() !== 1;
                    return (
                      <li key={e.id}>
                        <button type="button" onClick={() => setEv(e)} className="group block w-full text-left">
                          <span className="flex items-start gap-1.5">
                            <span aria-hidden="true" className="mt-[5px] h-2 w-2 flex-none rounded-full" style={{ background: CAT_BY_ID[e.categoria].cor }} />
                            <span className={`text-[13px] font-semibold leading-snug group-hover:underline ${continua ? 'text-tema-suave' : 'text-tema-tinta'}`}>
                              {continua ? `↳ ${e.nome}` : e.nome}
                            </span>
                          </span>
                          {!continua && <span className="mt-0.5 block pl-3.5 text-[11.5px] text-tema-suave">{e.soMes ? 'dia a definir' : localTexto(e)}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {evs.length > 3 && (
                  <button type="button" onClick={() => setDiaAberto(d)} className="mt-2 pl-3.5 text-[12px] font-semibold text-tema-tinta underline underline-offset-4">
                    e mais {evs.length - 3}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* próximos */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="font-display text-[24px] font-extrabold text-tema-tinta">Próximos eventos</h2>
            <p className="mt-1 text-[13px] text-tema-suave">A partir de hoje{cat !== 'todas' ? `, em ${CAT_BY_ID[cat].rotulo.toLowerCase()}` : ''}.</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {prox.length === 0 && <li className="text-[14px] text-tema-suave">Não há mais eventos em {ANO}.</li>}
            {prox.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => setEv(e)} className="flex h-full w-full flex-col items-start rounded-[22px] p-4 text-left transition hover:-translate-y-0.5" style={{ background: tomCat(e.categoria) }}>
                  <span className="text-[12px] font-semibold text-tema-tinta">{CAT_BY_ID[e.categoria].curto || CAT_BY_ID[e.categoria].rotulo}</span>
                  <span className="mt-1 font-display text-[16px] font-bold leading-snug text-tema-tinta">{e.nome}</span>
                  <span className="mt-auto pt-3 text-[13px] text-tema-tinta">
                    {periodo(e)} · {localTexto(e)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-8 text-[12px] text-tema-apagado">Fonte: {FONTE_CALENDARIO}.</p>
      </div>

      <Detalhe ev={ev} onFechar={() => setEv(null)} />
      <DoDia d={diaAberto} lista={lista} onFechar={() => setDiaAberto(null)} onEscolher={(e) => { setDiaAberto(null); setEv(e); }} />
    </section>
  );
}

function Modal({ aberto, onFechar, titulo, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!aberto) return;
    const ant = document.activeElement;
    ref.current?.focus();
    const k = (e) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', k);
    return () => {
      window.removeEventListener('keydown', k);
      ant?.focus?.();
    };
  }, [aberto, onFechar]);
  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <button type="button" aria-label="Fechar" onClick={onFechar} className="absolute inset-0 bg-[#070568]/50" />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={titulo} className="anima-entra relative w-full max-w-[520px] rounded-[28px] bg-tema-card p-7 shadow-flutuante outline-none">
        <button type="button" onClick={onFechar} aria-label="Fechar" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full text-tema-tinta hover:bg-tema-linha">
          <Icon name="fechar" size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}

function Detalhe({ ev, onFechar }) {
  const c = ev && CAT_BY_ID[ev.categoria];
  return (
    <Modal aberto={!!ev} onFechar={onFechar} titulo={ev?.nome}>
      {ev && (
        <>
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold text-tema-tinta" style={{ background: tomCat(ev.categoria) }}>
            <span className="h-2 w-2 rounded-full" style={{ background: c.cor }} />
            {ev.unidade}
            {ev.categoria !== 'GERAL' ? ` (${ev.categoria})` : ''}
          </span>
          <h2 className="mt-4 pr-8 font-display text-[26px] font-extrabold leading-tight text-tema-tinta">{ev.nome}</h2>
          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-[15px]">
            <dt className="text-tema-suave">Quando</dt>
            <dd className="text-tema-tinta">
              {periodo(ev)}
              {ev.dias > 1 && !ev.soMes ? ` · ${ev.dias} dias` : ''}
            </dd>
            <dt className="text-tema-suave">Onde</dt>
            <dd className="text-tema-tinta">{localTexto(ev)}</dd>
            <dt className="text-tema-suave">Público</dt>
            <dd className="text-tema-tinta">{ev.publico || '—'}</dd>
          </dl>
        </>
      )}
    </Modal>
  );
}

function DoDia({ d, lista, onFechar, onEscolher }) {
  const evs = d ? lista.filter((e) => noDia(e, d)) : [];
  const titulo = d ? d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
  return (
    <Modal aberto={!!d} onFechar={onFechar} titulo={titulo}>
      <h2 className="pr-8 font-display text-[24px] font-extrabold text-tema-tinta">{titulo}</h2>
      <ul className="mt-5 space-y-2">
        {evs.map((e) => (
          <li key={e.id}>
            <button type="button" onClick={() => onEscolher(e)} className="w-full rounded-[18px] p-3.5 text-left" style={{ background: tomCat(e.categoria) }}>
              <span className="block font-semibold text-tema-tinta">{e.nome}</span>
              <span className="text-[13px] text-tema-tinta">{localTexto(e)}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
