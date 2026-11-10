'use client';
// Raiz do site: escolhe entre a versão desktop (Observatorio, intacta) e a versão mobile auxiliar.
//   #/m…           → versão mobile
//   tela pequena   → abre a versão mobile, a menos que a pessoa tenha escolhido a versão avançada
//   demais casos   → versão desktop (a "versão avançada", responsiva)
import { lazy, Suspense, useEffect, useState } from 'react';
import Observatorio from './Observatorio';

const AppMobile = lazy(() => import('./mobile/AppMobile'));

function escolheuAvancada() {
  try {
    return window.sessionStorage.getItem('obs-versao') === 'avancada';
  } catch {
    return window.__obsVersao === 'avancada';
  }
}

function modoAtual() {
  const h = window.location.hash;
  if (h.startsWith('#/m')) return 'mobile';
  const inicio = h === '' || h === '#' || h === '#/';
  if (inicio && window.innerWidth < 768 && !escolheuAvancada()) return 'mobile';
  return 'desktop';
}

export default function Raiz() {
  const [modo, setModo] = useState(null);
  useEffect(() => {
    const ler = () => {
      const m = modoAtual();
      if (m === 'mobile' && !window.location.hash.startsWith('#/m')) history.replaceState(null, '', '#/m');
      if (m === 'mobile') {
        try {
          window.sessionStorage.removeItem('obs-versao');
        } catch {
          window.__obsVersao = null;
        }
      }
      setModo(m);
    };
    ler();
    window.addEventListener('hashchange', ler);
    return () => window.removeEventListener('hashchange', ler);
  }, []);
  if (!modo) return null;
  if (modo === 'mobile')
    return (
      <Suspense fallback={null}>
        <AppMobile />
      </Suspense>
    );
  return <Observatorio />;
}
