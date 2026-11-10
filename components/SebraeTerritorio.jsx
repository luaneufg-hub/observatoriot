'use client';
// Bloco "Sebrae no território" da barra lateral: programas e iniciativas do Sebrae
// no Brasil, no estado ou no município selecionado. Tocar num programa destaca no mapa
// os municípios participantes.
import { useEffect, useState } from 'react';
import Card, { Nota } from './Card';
import { PROGRAMAS, carregarProgramas } from '@/lib/dados/sebraeTerritorio';
import { UF_BY_SIGLA } from '@/lib/dados/ufs';

const fmt = (n) => n.toLocaleString('pt-BR');

function SeloFicticio() {
  return (
    <span className="rounded-full bg-[#fdf0f4] px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-[#8c1240]" title="Dado fictício até a ligação com a API">
      fictício
    </span>
  );
}

export default function SebraeTerritorio({ base, uf, mun, destaque, onDestacar }) {
  const [dados, setDados] = useState(null);
  useEffect(() => {
    if (base) carregarProgramas(base).then(setDados);
  }, [base]);

  const lugar = mun ? mun.nome : uf ? UF_BY_SIGLA[uf].nome : 'Brasil';
  const universo = mun ? null : uf ? base?.porUF[uf] || [] : base?.lista || [];

  const linhas = dados
    ? PROGRAMAS.map((p) => {
        const d = dados[p.id];
        if (mun) return { p, d, participa: d.sim.has(mun.cod) };
        let n = 0;
        for (const m of universo) if (d.sim.has(m.cod)) n++;
        return { p, d, n, total: universo.length };
      })
    : [];
  // no município: primeiro os programas presentes
  if (mun) linhas.sort((a, b) => Number(b.participa) - Number(a.participa));

  const reais = linhas.filter((l) => l.d.real).length;

  return (
    <Card
      icone="sebrae"
      rotulo={`Sebrae no território · ${lugar}`}
      info={
        <>
          Programas e iniciativas do Sebrae em cada município, da API do Observatório (dimensão Jornada e Atendimentos Sebrae). A Indicação Geográfica segue a lista oficial do INPI. Os
          marcados <strong>fictício</strong> aguardam a consulta da API ou o cube de Atendimentos Sebrae. Toque num programa para ver os municípios no mapa.
        </>
      }
    >
      {!dados ? (
        <div className="grid gap-2 py-1" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-5 animate-pulse rounded-full bg-tema-linha" />
          ))}
        </div>
      ) : (
        <>
          {mun && (
            <p className="mb-2 text-[13px] text-tema-suave">
              <span className="font-display text-[22px] font-extrabold text-tema-numero">{linhas.filter((l) => l.participa).length}</span> de {linhas.length} programas e
              iniciativas em {mun.nome}
            </p>
          )}
          <ul className="grid gap-1">
            {linhas.map(({ p, d, n, total, participa }) => {
              const ativo = destaque === p.id;
              const pct = total ? (n / total) * 100 : 0;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-pressed={ativo}
                    onClick={() => onDestacar(ativo ? null : p.id)}
                    title={p.sobre}
                    className={`group grid w-full grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1 rounded-xl px-2 py-1.5 text-left transition ${
                      ativo ? 'bg-tema-linha ' : 'hover:bg-tema-linha'
                    } ${mun && !participa ? 'opacity-55' : ''}`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.cor }} aria-hidden />
                    <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-tema-tinta">
                      <span className="truncate">{p.nome}</span>
                      {!d.real && <SeloFicticio />}
                    </span>
                    {mun ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${participa ? 'bg-lima text-navy-2' : 'bg-tema-linha text-tema-suave'}`}
                      >
                        {participa ? 'participa' : 'não participa'}
                      </span>
                    ) : (
                      <span className="text-right text-[12.5px] font-semibold tabular-nums text-tema-tinta">
                        {fmt(n)}
                        <span className="font-normal text-tema-suave"> de {fmt(total)}</span>
                      </span>
                    )}
                    {!mun && (
                      <span className="col-start-2 col-end-4 h-1 overflow-hidden rounded-full bg-tema-linha" aria-hidden>
                        <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: p.cor }} />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <Nota>
            {mun ? 'Toque num programa para ver no mapa onde mais ele está presente.' : `Municípios participantes. Toque num programa para destacá-los no mapa.`}{' '}
            {reais} de {linhas.length} com dado real.
          </Nota>
        </>
      )}
    </Card>
  );
}

