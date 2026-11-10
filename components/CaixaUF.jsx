'use client';
import './caixa.css';
// Caixa de destaque do estado — segue "estilo_de_destaque.svg":
// cabeçalho verde com nome, quadrado magenta com a bandeira, corpo claro
// com duas métricas grandes (ícone + valor + legenda).
import BANDEIRAS from '@/lib/icones/bandeiras';
import BANDEIRAS_Q from '@/lib/icones/bandeiras-quadradas';
import Icon from './Icon';

export const CAIXA_VERDE = '#36BF76';
export const CAIXA_MAGENTA = '#D81E5B';

export function Bandeira({ uf, className, title }) {
  const b = BANDEIRAS[uf];
  if (!b) return null;
  return (
    <svg
      className={className}
      viewBox={b.vb}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={title || `Bandeira ${uf}`}
      dangerouslySetInnerHTML={{ __html: b.svg }}
    />
  );
}

// Bandeira em quadrado de cantos arredondados (estilo "square-rounded" do repositório)
export function BandeiraQuadrada({ uf, className }) {
  const b = BANDEIRAS_Q[uf];
  if (!b) return null;
  return <svg className={className} viewBox={b.vb} role="img" aria-label={`Bandeira ${uf}`} dangerouslySetInnerHTML={{ __html: b.svg }} />;
}

/**
 * @param uf        sigla (bandeira)
 * @param titulo    texto do cabeçalho (nome da UF ou do bioma)
 * @param n         número/posição (opcional, aparece à direita do cabeçalho)
 * @param esq, dir  { icone, valor, legenda }
 * @param cab, quadro  cores do cabeçalho e do quadrado da bandeira (padrão: verde e magenta)
 * @param tamanho   'sm' (etiqueta do mapa) | 'lg' (painel)
 */
export default function CaixaUF({ uf, titulo, n, esq, dir, cab = CAIXA_VERDE, quadro = CAIXA_MAGENTA, tamanho = 'sm', className = '', ...rest }) {
  return (
    <div className={`cx cx--${tamanho} ${className}`} style={{ '--cx-cab': cab, '--cx-quadro': quadro }} {...rest}>
      <div className="cx__cab">
        <span className="cx__quadro">
          <span className="cx__bandeira">
            <Bandeira uf={uf} />
          </span>
        </span>
        <span className={`cx__titulo${titulo?.length > 22 ? ' cx__titulo--mlongo' : titulo?.length > 13 ? ' cx__titulo--longo' : ''}`}>{titulo}</span>
        {n != null && <span className="cx__n">{n}º</span>}
      </div>
      <div className="cx__corpo">
        {[esq, dir].filter(Boolean).map((m, i) => (
          <div className="cx__met" key={i}>
            <Icon name={m.icone} size={tamanho === 'lg' ? 34 : 24} className="cx__ic" />
            <div className="cx__txt">
              <span className={`cx__valor${String(m.valor).length > 9 ? ' cx__valor--longo' : ''}`}>{m.valor}</span>
              <span className="cx__leg">{m.legenda}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
