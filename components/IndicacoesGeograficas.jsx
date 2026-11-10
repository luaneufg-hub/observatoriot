'use client';
// Bloco "Indicações geográficas" da barra lateral (lista oficial do INPI): as IGs do município,
// do estado ou do Brasil. Tocar numa IG destaca no mapa os municípios da área delimitada.
import { useEffect, useState } from 'react';
import Card, { Nota } from './Card';
import { UF_BY_SIGLA } from '@/lib/dados/ufs';
import { carregarIGs, produtoCurto } from '@/lib/dados/ig';

const COR = '#8A9136';

function Linha({ ig, ativo, onDestacar }) {
  const semArea = !ig.municipios.length;
  return (
    <li>
      <button
        type="button"
        disabled={semArea}
        aria-pressed={ativo}
        onClick={() => onDestacar(ativo ? null : `ig:${ig.id}`)}
        title={`${ig.produto}${semArea ? ' — a delimitação do INPI não cita municípios (traz coordenadas ou o nome de uma região)' : ''}`}
        className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 rounded-xl px-2 py-1.5 text-left transition ${ativo ? 'bg-tema-linha' : semArea ? '' : 'hover:bg-tema-linha'}`}
      >
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold text-tema-tinta">{produtoCurto(ig.produto)}</span>
          <span className="block truncate text-[12px] text-tema-suave">
            {ig.nome} · {ig.ufs.join('/')} · {ig.ano}
            {semArea && <em className="not-italic text-[#B4232C]"> · sem área no mapa</em>}
          </span>
        </span>
        <span
          className={`mt-0.5 rounded-full px-1.5 py-px text-[10.5px] font-bold ${ig.especie === 'DO' ? 'bg-navy-2 text-white' : 'bg-lima text-navy-2'}`}
          title={ig.especie === 'DO' ? 'Denominação de Origem' : 'Indicação de Procedência'}
        >
          {ig.especie}
        </span>
      </button>
    </li>
  );
}

export default function IndicacoesGeograficas({ uf, mun, destaque, onDestacar }) {
  const [dados, setDados] = useState(null);
  const [todas, setTodas] = useState(false);
  useEffect(() => {
    carregarIGs().then(setDados);
  }, []);
  useEffect(() => setTodas(false), [uf, mun]);

  const lugar = mun ? mun.nome : uf ? UF_BY_SIGLA[uf].nome : 'Brasil';
  let lista = [];
  if (dados) {
    if (mun) lista = dados.porMun.get(mun.cod) || [];
    else if (uf) lista = dados.igs.filter((ig) => ig.ufs.includes(uf));
    else lista = [...dados.igs].sort((a, b) => b.ordem.localeCompare(a.ordem));
  }
  const ip = lista.filter((i) => i.especie === 'IP').length;
  const dop = lista.length - ip;
  const mostra = todas ? lista : lista.slice(0, 6);

  return (
    <Card
      icone="selo"
      rotulo={`Indicações geográficas · ${lugar}`}
      info={
        <>
          Indicações de Procedência (IP) e Denominações de Origem (DO) reconhecidas pelo INPI. Os municípios de cada IG foram lidos do texto da delimitação; quando
          ela só traz coordenadas ou o nome de uma região, a IG aparece sem área no mapa. Toque numa IG para ver os municípios.
        </>
      }
    >
      {!dados ? (
        <span className="block h-5 animate-pulse rounded-full bg-tema-linha" />
      ) : lista.length === 0 ? (
        <p className="text-[13px] text-tema-suave">Nenhuma indicação geográfica registrada {mun ? 'neste município' : 'neste estado'}.</p>
      ) : (
        <>
          <p className="mb-2 text-[13px] text-tema-suave">
            <span className="font-display text-[22px] font-extrabold text-tema-numero">{lista.length}</span> {lista.length === 1 ? 'IG' : 'IGs'}
            {!mun && (
              <>
                {' '}
                · {ip} IP e {dop} DO
              </>
            )}
            {!uf && !mun && <span className="block text-[12px]">mais recentes primeiro</span>}
          </p>
          <ul className="grid gap-0.5">
            {mostra.map((ig) => (
              <Linha key={ig.id} ig={ig} ativo={destaque === `ig:${ig.id}`} onDestacar={onDestacar} />
            ))}
          </ul>
          {lista.length > 6 && (
            <button type="button" onClick={() => setTodas((t) => !t)} className="mt-1 px-2 text-[12.5px] font-semibold text-tema-numero hover:underline">
              {todas ? 'mostrar menos' : `ver todas (${lista.length})`}
            </button>
          )}
        </>
      )}
      <Nota>Fonte: INPI, listas de IP e DO reconhecidas (out. 2026)</Nota>
    </Card>
  );
}
