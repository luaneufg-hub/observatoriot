// Substitui `next/dynamic` na versão estática (sem Next.js): carrega o componente sob demanda.
import { lazy, Suspense, forwardRef } from 'react';

export default function dynamic(carregar) {
  const Comp = lazy(carregar);
  return forwardRef(function Dinamico(props, ref) {
    return (
      <Suspense fallback={null}>
        <Comp ref={ref} {...props} />
      </Suspense>
    );
  });
}
