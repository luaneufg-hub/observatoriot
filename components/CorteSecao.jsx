'use client';
// Corte entre seções: linha fina com um botão lima ao centro que leva à seção seguinte.
export default function CorteSecao({ para, rotulo }) {
  return (
    <div className="relative z-10 bg-tema-bg px-4 sm:px-8 lg:px-12 print:hidden">
      <div className="mx-auto flex max-w-[1240px] items-center gap-4">
        <span className="h-px flex-1 bg-tema-linha [[data-theme=claro]_&]:bg-[#DDD5C8]" aria-hidden />
        <button
          type="button"
          onClick={() => document.getElementById(para)?.scrollIntoView({ behavior: 'smooth' })}
          aria-label={`Ir para ${rotulo}`}
          title={rotulo}
          className="grid h-11 w-11 flex-none place-items-center rounded-full bg-lima text-navy shadow-flutuante transition hover:translate-y-0.5 hover:brightness-105"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <span className="h-px flex-1 bg-tema-linha [[data-theme=claro]_&]:bg-[#DDD5C8]" aria-hidden />
      </div>
    </div>
  );
}
