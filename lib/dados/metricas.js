// Métricas da caixa de destaque (CaixaUF) para UF ou município.
import { DADOS, formatar, vocacao, quocienteLocacional, participacaoNoTotal } from '@/lib/dados/indicadores';
import { BIOMA_BY_ID } from '@/lib/dados/biomas';
import { cadeiaUF } from '@/lib/dados/producao';

const num1 = (v) => v.toFixed(1).replace('.', ',');

export function metricasUF(ind, sigla, media) {
  const v = DADOS[sigla][ind.id];
  if (ind.unidade === 'cat') {
    const b = BIOMA_BY_ID[v];
    return { esq: { icone: 'bioma', valor: b.nome, legenda: 'Bioma predominante' }, dir: { icone: 'bioma', valor: cadeiaUF(sigla) ?? '—', legenda: 'Cadeia de referência · IBGE 2024' } };
  }
  if (v == null) {
    const voc = vocacao(sigla);
    return { esq: { icone: ind.icone, valor: '—', legenda: 'sem valor para este estado' }, dir: { icone: voc.icone, valor: voc.rotulo, legenda: `Vocação · QL ${num1(voc.ql)}` } };
  }
  const legEsq =
    ind.unidade === 'n'
      ? `${num1(participacaoNoTotal(sigla, ind.id))}% do Brasil`
      : ind.unidade === '%'
        ? `${v >= media ? '+' : '−'}${num1(Math.abs(v - media))} p.p. em relação ${ind.referencia ?? (ind.brasil != null ? 'ao Brasil' : 'à média')}`
        : `${v >= media ? '+' : '−'}${Math.abs(((v - media) / media) * 100).toFixed(0)}% em relação ${ind.referencia ?? (ind.brasil != null ? 'ao Brasil' : 'à média')}`;
  let dir;
  if (ind.id.startsWith('setor_') && ind.id !== 'setor_admpub') {
    const ql = quocienteLocacional(sigla, ind.id);
    dir = { icone: ind.icone, valor: ind.rotulo, legenda: `QL ${num1(ql)} · ${ql >= 1 ? 'acima' : 'abaixo'} da média` };
  } else {
    const voc = vocacao(sigla);
    // vocação em destaque; o QL fica como apoio
    dir = { icone: voc.icone, valor: voc.rotulo, legenda: `Vocação · QL ${num1(voc.ql)}` };
  }
  return { esq: { icone: ind.icone, valor: formatar(ind, v, { curto: true }), legenda: legEsq }, dir };
}

export function metricasMunicipio(ind, m, v, totalUF, posicao, n) {
  const b = BIOMA_BY_ID[m.pred];
  const cad = m.cadeias?.[0]?.[0];
  const dir = b ? { icone: 'bioma', valor: b.nome, legenda: cad ? `Bioma predominante · cadeia: ${cad}` : 'Bioma predominante' } : { icone: 'bioma', valor: '—', legenda: 'Bioma' };
  if (ind.unidade === 'cat') return { esq: { icone: 'bioma', valor: b?.nome ?? '—', legenda: 'Bioma predominante' }, dir: { icone: 'bioma', valor: cad ?? '—', legenda: 'Cadeia de referência · IBGE 2024' } };
  const legEsq = ind.unidade === 'n' && totalUF ? `${pctPequeno((v / totalUF) * 100)}% do estado · ${posicao}º de ${n}` : `${posicao}º de ${n} no estado`;
  return { esq: { icone: ind.icone, valor: formatar(ind, v, { curto: true }), legenda: legEsq }, dir };
}

// percentuais pequenos não viram "0,0%": até 2 casas, e "< 0,01" no limite
function pctPequeno(p) {
  if (p > 0 && p < 0.01) return '< 0,01';
  return p.toLocaleString('pt-BR', { minimumFractionDigits: p < 1 ? 2 : 1, maximumFractionDigits: p < 1 ? 2 : 1 });
}
