'use client';
// Bloco "Inovação" da barra lateral: Indicadores Municipais de Inovação do Sebrae no município,
// no estado (média dos municípios) ou no Brasil. Cada tema mostra o percentil: à frente de
// quantos % dos municípios do país o lugar está.
import Card, { Nota } from './Card';
import INOV from '@/lib/dados/retratos/inovacao.json';
import { UF_BY_SIGLA } from '@/lib/dados/ufs';

const nf1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat('pt-BR');
const K = INOV.campos.length; // valores, depois percentis, depois a posição
const COR = '#2A4FDA';

function Tema({ nome, largura, texto, medidas, marca }) {
  return (
    <li title={`Componentes: ${medidas.join(', ')}`}>
      <div className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className="min-w-0 truncate text-tema-tinta">{nome}</span>
        <span className="flex-none font-semibold tabular-nums text-tema-tinta">{texto}</span>
      </div>
      <div className="relative mt-1 h-1.5 rounded-full bg-tema-linha" aria-hidden>
        <span className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700" style={{ width: `${Math.min(100, largura)}%`, background: COR }} />
        {marca && <span className="absolute -top-0.5 h-2.5 w-px bg-tema-tinta/60" style={{ left: '50%' }} />}
      </div>
    </li>
  );
}

export default function InovacaoTerritorio({ base, uf, mun }) {
  const lugar = mun ? mun.nome : uf ? UF_BY_SIGLA[uf].nome : 'Brasil';
  let valor;
  let pct;
  let posicao = null;
  let de = null;
  if (mun) {
    const v = base?.inov?.get(mun.cod);
    if (v) {
      valor = v.slice(0, K);
      pct = v.slice(K, 2 * K);
      posicao = v[2 * K];
      de = INOV.municipios;
    }
  } else if (uf) {
    ({ valor, pct, posicao } = INOV.uf[uf]);
    de = Object.keys(INOV.uf).length;
  } else ({ valor, pct } = INOV.br);
  const carregando = mun && !base?.inov;

  return (
    <Card
      icone="robo"
      rotulo={`Inovação · ${lugar}`}
      info={
        <>
          Indicadores Municipais de Inovação do Sebrae ({INOV.ano}). O índice geral, de 0 a 100, é o calculado pelo Sebrae. Os componentes estão agrupados aqui em cinco temas
          para leitura. No estado e no município, a barra de cada tema mostra à frente de quantos % dos municípios do país o lugar está (o traço marca 50%, o município do
          meio). No Brasil, mostra a pontuação média de cada tema, de 0 a 100. No estado e no Brasil, os valores são a média simples dos municípios.
        </>
      }
    >
      {carregando ? (
        <span className="block h-5 animate-pulse rounded-full bg-tema-linha" />
      ) : !valor ? (
        <p className="text-[13px] text-tema-suave">Sem dado de inovação para este município.</p>
      ) : (
        <>
          <p className="text-[13px] text-tema-suave">
            <span className="font-display text-[26px] font-extrabold text-tema-numero">{nf1.format(valor[0])}</span> de 100 no índice
            {mun || uf ? (
              <>
                {' '}
                · <span className="font-semibold text-tema-tinta">{nf0.format(posicao)}º</span> de {nf0.format(de)} {mun ? 'municípios' : 'estados'}
              </>
            ) : (
              ' (média dos municípios)'
            )}
          </p>
          {(mun || uf) && (
            <p className="mt-0.5 text-[12.5px] text-tema-suave">
              {mun ? `À frente de ${pct[0]}% dos municípios do país` : `Em média, os municípios do estado ficam à frente de ${pct[0]}% dos municípios do país`}; média do Brasil:{' '}
              {nf1.format(INOV.br.valor[0])}.
            </p>
          )}
          <ul className="mt-3 grid gap-2.5">
            {INOV.temas.map((t, i) => (
              <Tema
                key={t.id}
                nome={t.nome}
                medidas={t.medidas}
                marca={!!(mun || uf)}
                largura={mun || uf ? pct[i + 1] : valor[i + 1]}
                texto={mun || uf ? `à frente de ${pct[i + 1]}%` : `${nf1.format(valor[i + 1])} pts`}
              />
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[12.5px]">
            <p className="rounded-xl bg-tema-linha px-2.5 py-2">
              <span className="block text-tema-suave">Startups</span>
              <span className="font-semibold text-tema-tinta">{mun || uf ? `à frente de ${pct[6]}%` : `${nf1.format(valor[6])} pts`}</span>
            </p>
            <p className="rounded-xl bg-tema-linha px-2.5 py-2" title="Empresas de base tecnológica: o dado mais próximo de deeptechs na base do Observatório">
              <span className="block text-tema-suave">Base tecnológica</span>
              <span className="font-semibold text-tema-tinta">{mun || uf ? `à frente de ${pct[7]}%` : `${nf1.format(valor[7])} pts`}</span>
            </p>
          </div>
        </>
      )}
      <Nota>Fonte: Sebrae, Indicadores Municipais de Inovação {INOV.ano} (API do Observatório)</Nota>
    </Card>
  );
}
