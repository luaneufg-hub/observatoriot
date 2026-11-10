'use client';
// Botão "Adicionar ao Google Agenda" (abre o Google Agenda com o evento preenchido, em nova aba).
import Icon from '../Icon';

export default function BotaoGoogleAgenda({ href, className = '' }) {
  if (!href)
    return <p className={`text-[13px] text-tema-suave ${className}`}>A data ainda está a definir; o evento poderá ser adicionado à agenda quando o dia for confirmado.</p>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-full border border-tema-linha bg-tema-card px-5 text-[15px] font-semibold text-tema-tinta transition hover:bg-tema-linha focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tema-tinta ${className}`}
    >
      <Icon name="calendario" size={20} />
      Adicionar ao Google Agenda
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  );
}
