'use client';
// "Setores": cartões de setor, abas (crescimento, novos negócios, empregos, atividade),
// seletor de ano e gráfico de barras (Recharts) com microinterações:
// barras crescem ao entrar e ao trocar de ano/aba, hover destaca a barra e esmaece as outras,
// clique na barra seleciona o setor, valores contam até o número final.
import { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import Icon, { KitSvg } from '../Icon';
import { InfoTip } from '../Card';
import { FaixaResumo } from '../CaixaResumo';
import { asset } from '@/lib/asset';
import { useNaTela, useContagem, reduzMovimento } from './Contador';
import { ABAS, SETORES_MPE, resumoFaixa } from '@/lib/dados/mpe';
import KIT from '@/lib/icones/iconesKit';

// ícones de linha dos cartões (como no layout) e ilustrações coloridas do kit
const LINHA = { agro: 'Ativo_44', servicos: 'Ativo_45', comercio: 'Ativo_46', industria: 'Ativo_81', construcao: 'tijolos', admpub: 'Ativo_80' };
const ILUSTRA = { agro: 'agro', servicos: 'servico', comercio: 'comercio', industria: 'industria', construcao: 'Ativo_65', admpub: 'servico_publico' };

function IconeSetor({ id, size = 34 }) {
  const n = LINHA[id];
  return n.startsWith('Ativo_') ? <KitSvg nome={n} size={size} /> : <Icon name={n} size={size} stroke={1.5} />;
}

function formatar(v, unidade, curto = true) {
  if (unidade === 'pct') return `${v >= 0 ? '+' : ''}${v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  if (!curto) return v.toLocaleString('pt-BR');
  if (v >= 1e6) return `${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mi`;
  if (v >= 1e3) return `${Math.round(v / 1e3).toLocaleString('pt-BR')} mil`;
  return v.toLocaleString('pt-BR');
}

/* ---------------------------------------------------------------- partes do gráfico */
function BarraArredondada({ x, y, width, height, fill, fillOpacity, borda }) {
  if (height <= 0) return null;
  const r = Math.min(10, width / 2, height);
  return (
    <path
      d={`M${x},${y + height} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + height} Z`}
      fill={fill}
      fillOpacity={fillOpacity}
      stroke={borda || 'none'}
      strokeOpacity={fillOpacity}
      strokeWidth={borda ? 1.5 : 0}
      style={{ transition: 'fill-opacity .25s ease' }}
    />
  );
}

// ícone do setor acima da barra
function IconeAcima({ x, y, width, index, dados, foco }) {
  const d = dados[index];
  if (!d) return null;
  const ic = KIT[LINHA[d.id]] ? KIT[LINHA[d.id]] : null;
  const s = 30;
  const cx = x + width / 2;
  const ativo = foco === d.id;
  return (
    <g transform={`translate(${cx - s / 2}, ${y - s - 8})`} style={{ transition: 'transform .3s' }} opacity={foco && !ativo ? 0.35 : 1}>
      {ic ? (
        <svg width={s} height={s} viewBox={ic.vb} dangerouslySetInnerHTML={{ __html: ic.svg }} style={{ color: d.borda || d.cor }} />
      ) : (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={d.borda || d.cor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="7" width="18" height="10" rx="0.8" />
          <path d="M3 12h18M9 7v5M15 7v5M6 12v5M12 12v5M18 12v5" />
        </svg>
      )}
    </g>
  );
}

// valor (contando) + nome do setor abaixo da barra
function RotuloEixo({ x, y, payload, dados, unidade, foco }) {
  const d = dados.find((k) => k.rotulo === payload.value);
  const v = useContagem(d?.valor ?? 0, { duracao: 1100 });
  if (!d) return null;
  const apagado = foco && foco !== d.id;
  const compacto = typeof window !== 'undefined' && window.innerWidth < 640;
  return (
    <g transform={`translate(${x},${y + 6})`} opacity={apagado ? 0.45 : 1} style={{ transition: 'opacity .25s' }}>
      {d.pendente ? (
        <text textAnchor="middle" y={16} className="fill-tema-apagado font-display" fontSize={compacto ? 10.5 : 12.5} fontWeight={700}>
          {d.motivo?.rotulo || 'pendente'}
        </text>
      ) : (
        <text textAnchor="middle" y={18} className="fill-tema-tinta font-display" fontSize={compacto ? 13.5 : 20} fontWeight={800}>
          {formatar(unidade === 'pct' ? Math.round(v * 10) / 10 : v, unidade)}
        </text>
      )}
      <title>{d.nome}</title>
    </g>
  );
}

function Dica({ active, payload, unidade, periodo }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-2xl bg-white px-3.5 py-3 text-[12.5px] text-[#2b2b30] shadow-flutuante">
      <div className="mb-1 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.cor }} />
        <strong className="font-display text-[13px] text-navy-2">{d.nome}</strong>
      </div>
      {d.pendente ? (
        <div className="max-w-[220px] text-[12px] text-[#6b6b70]">{d.motivo?.texto || 'Dado ainda não publicado. Entra aqui quando a consulta à API do Observatório estiver disponível.'}</div>
      ) : (
        <div className="font-display text-[20px] font-extrabold tabular-nums text-navy-2">{formatar(d.valor, unidade, false)}</div>
      )}
      <div className="text-[11.5px] text-[#6b6b70]">{periodo.nota}</div>
      {d.part != null && !d.pendente && <div className="mt-1 text-[11.5px] text-[#6b6b70]">{d.part > 0 && d.part < 0.01 ? '< 0,01' : d.part.toLocaleString('pt-BR', { maximumFractionDigits: d.part < 1 ? 2 : 1 })}% do total</div>}
      <div className="mt-1.5 text-[11px] font-semibold text-azul">Clique para ver o resumo do setor</div>
    </div>
  );
}

/* ---------------------------------------------------------------- componente */
export default function Setores({ lugar }) {
  // setor escolhido pela pessoa; sem escolha, vale o setor de maior destaque no gráfico
  const [escolhido, setSetor] = useState(null);
  const [abaId, setAbaId] = useState('crescimento');
  const aba = ABAS.find((a) => a.id === abaId);
  const indiceAba = ABAS.findIndex((a) => a.id === abaId);
  const irPara = (i) => setAbaId(ABAS[(i + ABAS.length) % ABAS.length].id);
  const deslize = useRef(null);
  const [periodoId, setPeriodoId] = useState(aba.periodos[0]?.id);
  const [hover, setHover] = useState(null);
  const graficoRef = useRef(null);
  const visto = useNaTela(graficoRef);

  // ao trocar de aba, vai para o período mais recente disponível
  useEffect(() => {
    setPeriodoId(aba.periodos[0]?.id);
  }, [abaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const periodo = aba.periodos.find((p) => p.id === periodoId) || aba.periodos[0];

  const dados = useMemo(() => {
    if (!periodo) return [];
    const total = Object.values(periodo.valores).reduce((a, b) => a + b, 0);
    return SETORES_MPE.map((s) => ({
      ...s,
      valor: periodo.valores[s.id] ?? 0,
      // sem valor nesta aba (adm. pública nas abas de aberturas e empregos): sem barra
      pendente: periodo.valores[s.id] == null,
      motivo: periodo.semValor?.[s.id], // { rotulo, texto } quando o setor fica de fora de propósito
      part: aba.unidade === 'n' && periodo.valores[s.id] != null ? (periodo.valores[s.id] / total) * 100 : null,
    }));
  }, [periodo, aba.unidade]);

  // setor de maior destaque no período (barra mais alta)
  const lider = useMemo(() => (dados.length ? dados.reduce((a, b) => (b.valor > a.valor ? b : a)).id : 'servicos'), [dados]);
  const setor = escolhido ?? lider;
  // barras esmaecem só no hover (como na arte, todas ficam com cor cheia em repouso)
  const foco = hover;
  const animar = !reduzMovimento();

  // indicador deslizante das abas
  const abasRef = useRef(null);
  const [linha, setLinha] = useState({ left: 0, width: 0 });
  useEffect(() => {
    const el = abasRef.current?.querySelector('[aria-selected="true"]');
    if (el) setLinha({ left: el.offsetLeft, width: el.offsetWidth });
  }, [abaId]);
  useEffect(() => {
    const onResize = () => {
      const el = abasRef.current?.querySelector('[aria-selected="true"]');
      if (el) setLinha({ left: el.offsetLeft, width: el.offsetWidth });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const sInfo = SETORES_MPE.find((s) => s.id === setor);
  const resumo = resumoFaixa(abaId, periodo?.id, setor);

  return (
    <section id="setores" aria-labelledby="setores-titulo" className="faixa bg-tema-bg px-4 pb-20 pt-16 sm:px-8 lg:px-12 lg:pt-20">
      <div className="mx-auto max-w-[1240px]">
        <header className="mx-auto max-w-[760px] text-center">
          <h2 id="setores-titulo" className="font-display text-[clamp(34px,4vw,52px)] font-extrabold tracking-[-0.02em] text-tema-tinta">
            Setores
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-tema-suave">
            Onde os pequenos negócios estão nascendo e gerando emprego. Escolha um setor para ler o resumo e passe o mouse nas barras para comparar.
          </p>
          {lugar && (
            <p className="troca-entra mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-tema-linha bg-tema-card px-3.5 py-1.5 text-[12.5px] text-tema-suave">
              <span className="h-2 w-2 rounded-full bg-magenta" aria-hidden />
              Você está vendo {lugar}. Os dados por setor ainda são só do Brasil.
            </p>
          )}
        </header>

        {/* cartões de setor */}
        <div role="group" aria-label="Setor" className="-mx-4 mt-10 flex gap-3 overflow-x-auto px-4 pb-3 sm:mx-auto sm:grid sm:max-w-[1000px] sm:grid-cols-6 sm:gap-4 sm:overflow-visible sm:px-0">
          {SETORES_MPE.map((s) => {
            const sel = s.id === setor;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={sel}
                onClick={() => setSetor(s.id)}
                onMouseEnter={() => setHover(s.id)}
                onMouseLeave={() => setHover(null)}
                className={`setor-chip flex aspect-[1/1.05] w-[104px] flex-none flex-col sm:w-auto items-center justify-center gap-3 rounded-[20px] text-[15px] font-medium text-[#050506] transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_14px_30px_-16px_rgba(7,5,104,.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul ${
                  sel ? 'bg-[#B7E055] shadow-[0_14px_30px_-18px_rgba(7,5,104,.45)]' : 'bg-[#EFEEEA] hover:bg-[#E7E5DF]'
                }`}
              >
                <span className="setor-chip__ic inline-flex">
                  <IconeSetor id={s.id} size={44} />
                </span>
                <span className="text-center leading-tight">
                  {s.rotulo}
                  {(dados.find((d) => d.id === s.id)?.pendente ?? s.pendente) && (
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#B5174C]">
                      {dados.find((d) => d.id === s.id)?.motivo?.rotulo || 'sem dado nesta aba'}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* abas */}
        <div className="relative mt-14 overflow-x-auto">
          <div ref={abasRef} role="tablist" aria-label="Indicador do setor" className="relative flex min-w-[640px] justify-between border-b border-tema-linha">
            {ABAS.map((a) => (
              <button
                key={a.id}
                role="tab"
                type="button"
                aria-selected={a.id === abaId}
                onClick={() => setAbaId(a.id)}
                className={`px-6 pb-3 pt-2 text-left text-[15px] leading-tight transition ${a.id === abaId ? 'font-bold text-tema-tinta' : 'font-medium text-tema-apagado hover:text-tema-tinta'}`}
              >
                {a.rotulo[0]}
                <br />
                {a.rotulo[1]}
                {!a.periodos.length && <span className="ml-1.5 align-middle text-[10px] font-semibold uppercase tracking-wider text-[#B5174C]">em breve</span>}
              </button>
            ))}
            <span className="absolute -bottom-px h-[3px] rounded-full bg-tema-tinta transition-all duration-300 ease-out" style={{ left: linha.left, width: linha.width }} />
          </div>
        </div>

        <div
          key={abaId}
          className="troca-entra mt-10 grid touch-pan-y gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14"
          onPointerDown={(e) => (deslize.current = e.pointerType === 'mouse' ? null : e.clientX)}
          onPointerUp={(e) => {
            if (deslize.current == null) return;
            const dx = e.clientX - deslize.current;
            deslize.current = null;
            if (Math.abs(dx) > 60) irPara(indiceAba + (dx < 0 ? 1 : -1));
          }}
        >
          {/* texto + resumo do setor */}
          <div className="flex min-w-0 flex-col">
            <div className="flex items-start gap-2">
              <h3 className="font-display text-[22px] font-bold leading-tight text-tema-tinta">{aba.titulo}</h3>
              <InfoTip titulo={aba.titulo} lado="esquerda">
                {aba.explica}
                {periodo && (
                  <span className="mt-2 block border-t border-[#ece8e1] pt-2 text-[11.5px] text-[#5b5a60]">
                    Fonte:{' '}
                    <a href={periodo.fonte.url} target="_blank" rel="noreferrer" className="font-semibold text-azul hover:underline">
                      {periodo.fonte.nome}
                    </a>{' '}
                    ({periodo.fonte.data})
                  </span>
                )}
              </InfoTip>
            </div>
            <p className="mt-2 text-[14.5px] leading-relaxed text-tema-suave">{aba.explica}</p>

            {/* imagem do setor em destaque (o resumo fica na faixa abaixo dos dados) */}
            <div key={setor} className="troca-entra relative mt-auto pt-8">
              {sInfo.imagem ? (
                <img src={asset(`setores/${sInfo.imagem}.webp`)} alt="" className="pointer-events-none mx-auto max-h-[380px] w-full select-none object-contain object-bottom" loading="lazy" />
              ) : (
                <div className="relative grid h-[280px] place-items-center" style={{ background: `radial-gradient(55% 55% at 50% 62%, ${sInfo.cor}66, transparent 70%)` }}>
                  <KitSvg nome={ILUSTRA[setor]} size={150} />
                  <span className="absolute bottom-2 right-3 text-[11px] italic text-tema-apagado">imagem do setor em produção</span>
                </div>
              )}
            </div>

            {periodo?.situacao === 'calculado' && (
              <p className="mt-4 font-detail text-nota italic text-tema-apagado">Valores de 2024 {periodo.nota}.</p>
            )}
          </div>

          {/* gráfico */}
          <div ref={graficoRef} className="min-w-0">
            {aba.periodos.length > 0 ? (
              <>
                <div role="radiogroup" aria-label="Período" className="mx-auto flex w-fit items-stretch border-b border-tema-tinta">
                  {aba.periodos.map((p, i) => (
                    <button
                      key={p.id}
                      role="radio"
                      type="button"
                      aria-checked={p.id === periodo.id}
                      onClick={() => setPeriodoId(p.id)}
                      className={`relative px-7 pb-1.5 font-display text-[19px] transition ${i > 0 ? 'border-l border-tema-tinta' : ''} ${
                        p.id === periodo.id ? 'font-extrabold text-tema-tinta' : 'font-medium text-tema-apagado hover:text-tema-tinta'
                      }`}
                    >
                      {p.rotulo}
                      {p.situacao === 'calculado' && <sup className="ml-0.5 text-[11px]">*</sup>}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-center text-[12px] text-tema-apagado">{periodo.nota}</p>

                <div className="mt-2 h-[360px] w-full">
                  {visto && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dados} margin={{ top: 48, right: 8, bottom: 8, left: 8 }} barCategoryGap="18%" onMouseLeave={() => setHover(null)}>
                        <XAxis
                          dataKey="rotulo"
                          axisLine={{ stroke: 'currentColor', strokeOpacity: 0.25 }}
                          tickLine={false}
                          interval={0}
                          height={52}
                          tick={<RotuloEixo dados={dados} unidade={aba.unidade} foco={hover} />}
                        />
                        <YAxis hide domain={[0, (max) => max * 1.08]} />
                        <Tooltip
                          cursor={{ fill: 'currentColor', fillOpacity: 0.05, radius: 12 }}
                          content={<Dica unidade={aba.unidade} periodo={periodo} />}
                          wrapperStyle={{ outline: 'none' }}
                        />
                        <Bar
                          dataKey="valor"
                          shape={<BarraArredondada />}
                          isAnimationActive={animar}
                          animationDuration={900}
                          animationEasing="ease-out"
                          onMouseEnter={(_, i) => setHover(dados[i].id)}
                          onClick={(d) => setSetor(d.id)}
                          className="cursor-pointer"
                        >
                          {dados.map((d) => (
                            <Cell key={d.id} fill={d.cor} borda={d.borda} fillOpacity={foco && foco !== d.id ? 0.35 : 1} />
                          ))}
                          <LabelList dataKey="valor" content={<IconeAcima dados={dados} foco={hover} />} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <p className="mt-3 text-center font-detail text-nota italic text-tema-apagado">
                  Fonte:{' '}
                  <a href={periodo.fonte.url} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
                    {periodo.fonte.nome}
                  </a>
                </p>
              </>
            ) : (
              <div className="troca-entra flex h-full min-h-[300px] flex-col items-start justify-center rounded-[22px] border border-dashed border-tema-linha bg-tema-card p-7">
                <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-magenta">Em breve</span>
                <p className="mt-2 font-display text-[20px] font-bold text-tema-tinta">Este gráfico depende de um dado ainda não publicado.</p>
                <p className="mt-2 text-[14px] leading-relaxed text-tema-suave">{aba.pendente}</p>
              </div>
            )}
          </div>
        </div>

        {/* resumo em faixa, abaixo dos dados: a cor alterna a cada aba e a frase muda com aba, período e setor */}
        <div className="mt-10 flex justify-center">
          <FaixaResumo
            className="w-full max-w-[760px]"
            chave={`${abaId}-${periodo?.id}-${setor}`}
            variante={ABAS.findIndex((a) => a.id === abaId) % 2 ? 'magenta' : 'verde'}
            subtitulo={resumo.subtitulo}
            destaque={resumo.destaque}
          >
            {resumo.texto}
          </FaixaResumo>
        </div>

        {/* bolinhas: passam de uma aba para a outra (no celular, também dá para deslizar) */}
        <div role="group" aria-label="Indicadores do setor" className="mt-10 flex justify-center gap-3">
          {ABAS.map((a, i) => {
            const ativa = a.id === abaId;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => irPara(i)}
                aria-label={`${a.rotulo.join(' ')}${ativa ? ' (aberto)' : ''}`}
                aria-current={ativa ? 'step' : undefined}
                title={a.rotulo.join(' ')}
                className={`h-3.5 w-3.5 rounded-full transition duration-300 ease-out hover:scale-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul ${
                  ativa ? 'scale-110 bg-[#36BF76]' : 'bg-[#B3E6CC] hover:bg-[#7fd3a6]'
                }`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

