'use client';
// Bloco "Cadeias produtivas" da barra lateral: principais produtos por valor de produção
// (IBGE 2024) no Brasil, no estado ou no município e, na Amazônia Legal, as cadeias
// extrativistas (extração vegetal não madeireira).
import Card, { Nota } from './Card';
import { UF_BY_SIGLA } from '@/lib/dados/ufs';
import { PRODUCAO, AMAZONIA_LEGAL, FONTE_PRODUCAO, extrativasAmazoniaLegal, reais } from '@/lib/dados/producao';

function Lista({ itens, cor }) {
  const max = itens[0]?.[1] || 1;
  return (
    <ol className="grid gap-1.5">
      {itens.map(([nome, v], i) => (
        <li key={nome} className="grid grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1">
          <span className="text-[11.5px] tabular-nums text-tema-apagado">{i + 1}</span>
          <span className={`truncate text-[13px] text-tema-tinta ${i === 0 ? 'font-bold' : ''}`}>{nome}</span>
          <span className="text-right text-[12.5px] font-semibold tabular-nums text-tema-tinta">{reais(v)}</span>
          <span className="col-start-2 col-end-4 h-1 overflow-hidden rounded-full bg-tema-linha" aria-hidden>
            <span className="block h-full rounded-full" style={{ width: `${(v / max) * 100}%`, background: cor }} />
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function CadeiasProdutivas({ uf, mun }) {
  const lugar = mun ? mun.nome : uf ? UF_BY_SIGLA[uf].nome : 'Brasil';
  const sigla = mun?.uf || uf;
  const naAmazonia = sigla ? AMAZONIA_LEGAL.includes(sigla) : true;
  const cadeias = mun ? mun.cadeias || [] : uf ? PRODUCAO.uf[uf]?.top || [] : PRODUCAO.br.top;
  const extrativas = mun ? mun.extrativas || [] : uf ? PRODUCAO.uf[uf]?.extrativas || [] : extrativasAmazoniaLegal();

  return (
    <Card
      icone="bioma"
      rotulo={`Cadeias produtivas · ${lugar}`}
      info={
        <>
          Produtos de maior valor de produção em 2024, somando lavouras (PAM), produtos de origem animal e aquicultura (PPM) e extração vegetal (PEVS) do IBGE. A
          primeira é a <strong>cadeia de referência</strong> do lugar. Na Amazônia Legal, aparecem também as cadeias extrativistas não madeireiras. A pecuária de corte
          não entra, porque o IBGE não publica o valor da produção de carne por município. Cupuaçu não é pesquisado pelo IBGE nessas bases.
        </>
      }
    >
      {cadeias.length ? (
        <>
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-tema-suave">Cadeia de referência</p>
          <Lista itens={cadeias.slice(0, 4)} cor="#2A4FDA" />
        </>
      ) : (
        <p className="text-[13px] text-tema-suave">Sem produção registrada nas pesquisas do IBGE.</p>
      )}
      {naAmazonia && extrativas.length > 0 && (
        <div className="mt-4 border-t border-tema-linha pt-3">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-tema-suave">
            Cadeias extrativistas{!sigla ? ' · Amazônia Legal' : ''}
          </p>
          <Lista itens={extrativas.slice(0, mun ? 4 : 6)} cor="#60B466" />
        </div>
      )}
      <Nota>
        Valor da produção em 2024 · {FONTE_PRODUCAO}
      </Nota>
    </Card>
  );
}
