'use client';
// "Adicionar à agenda": Google Agenda, Outlook (web, Microsoft 365) e arquivo .ics
// (Outlook no computador, Apple Calendar e outros). Os links abrem em nova aba; o .ics é baixado.
import Icon from '../Icon';
import { linkGoogleAgenda, linkOutlook, linkICS, nomeArquivoICS } from '@/lib/dados/calendario';

const estilo = 'inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full border border-tema-linha bg-tema-card px-3 text-[14px] font-semibold text-tema-tinta transition hover:bg-tema-linha focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tema-tinta';

export default function BotoesAgenda({ ev, className = '' }) {
  if (!ev || ev.soMes)
    return <p className={`text-[13px] text-tema-suave ${className}`}>A data ainda está a definir; o evento poderá ser adicionado à agenda quando o dia for confirmado.</p>;
  return (
    <div className={className}>
      <p className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-tema-suave">
        <Icon name="calendario" size={18} /> Adicionar à agenda
      </p>
      <div className="flex flex-wrap gap-2">
        <a href={linkGoogleAgenda(ev)} target="_blank" rel="noopener noreferrer" className={estilo}>
          Google<span className="sr-only"> Agenda (abre em nova aba)</span>
        </a>
        <a href={linkOutlook(ev)} target="_blank" rel="noopener noreferrer" className={estilo}>
          Outlook<span className="sr-only"> (abre em nova aba)</span>
        </a>
        <a href={linkICS(ev)} download={nomeArquivoICS(ev)} className={estilo} title="Para Outlook no computador, Apple Calendar e outros">
          Arquivo .ics
        </a>
      </div>
    </div>
  );
}
