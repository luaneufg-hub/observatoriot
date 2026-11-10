'use client';
// Contador animado: conta de 0 até o valor quando entra na tela (uma vez).
// Respeita "reduzir movimento": nesse caso mostra o valor final direto.
import { useEffect, useRef, useState } from 'react';

const facil = (t) => 1 - Math.pow(1 - t, 4); // easeOutQuart

export function useNaTela(ref, { margem = '0px 0px -12% 0px' } = {}) {
  const [visto, setVisto] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visto) return;
    if (typeof IntersectionObserver === 'undefined') return setVisto(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisto(true);
          io.disconnect();
        }
      },
      { rootMargin: margem },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, visto, margem]);
  return visto;
}

export function reduzMovimento() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * @param valor   número final
 * @param casas   casas decimais
 * @param duracao ms
 * @param ativo   começa a contar quando true (ex.: card visível)
 * @param chave   muda → recomeça a contagem a partir do valor anterior (troca de ano/aba)
 */
export function useContagem(valor, { duracao = 1400, ativo = true } = {}) {
  const [atual, setAtual] = useState(0);
  const de = useRef(0);
  useEffect(() => {
    if (!ativo) return;
    if (reduzMovimento()) {
      setAtual(valor);
      de.current = valor;
      return;
    }
    const ini = performance.now();
    const v0 = de.current;
    let raf;
    const passo = (t) => {
      const k = Math.min(1, (t - ini) / duracao);
      const v = v0 + (valor - v0) * facil(k);
      setAtual(v);
      if (k < 1) raf = requestAnimationFrame(passo);
      else de.current = valor;
    };
    raf = requestAnimationFrame(passo);
    return () => {
      cancelAnimationFrame(raf);
      de.current = valor;
    };
  }, [valor, duracao, ativo]);
  return atual;
}

export function formatarNumero(v, casas = 0) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export default function Contador({ valor, casas = 0, prefixo = '', sufixo = '', duracao, ativo = true, className = '' }) {
  const v = useContagem(valor, { duracao, ativo });
  const final = `${prefixo}${formatarNumero(valor, casas)}${sufixo}`;
  return (
    <span className={`tabular-nums ${className}`} aria-label={final}>
      <span aria-hidden>
        {prefixo}
        {formatarNumero(v, casas)}
        {sufixo}
      </span>
    </span>
  );
}
