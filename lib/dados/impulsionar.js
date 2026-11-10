// Impulsionar Negócios (estratégia setor-território do Sebrae): links dos relatórios por estado.
// Origem: painel Painéis Ditec (ObservatorioEstado.tsx), nov. 2026.
//  • fase1 — Fase 1: indicadores para alocação de recursos (relatório do estado)
//  • fase2 — Fase 2: planejamento das soluções (diagnóstico setor-território de cada recorte regional);
//            `observatorio: true` quando o link é a página da regional no Observatório;
//            `regiao` = código da regional Sebrae (public/dados/sebrae/regionais-municipio.json)
//  • geral — perfil do estado no Observatório
// ⚠️ SE: o link de Fase 2 do painel aponta para o relatório de RS – Sul; ficou de fora até ser corrigido.

export const FASES = [
  { id: 'fase1', rotulo: 'Fase 1', titulo: 'Indicadores para alocação de recursos', curto: 'Indicadores', icone: 'documento', cor: '#A093D1' },
  { id: 'fase2', rotulo: 'Fase 2', titulo: 'Planejamento das soluções', curto: 'Planejamento', icone: 'direcoes', cor: '#D9ED86' },
  { id: 'geral', rotulo: 'Geral', titulo: 'Perfil do estado no Observatório', curto: 'Observatório', icone: 'setores', cor: '#B2AEA6' },
];
export const FASE_BY_ID = Object.fromEntries(FASES.map((f) => [f.id, f]));

export const IMPULSIONAR = {
  AC: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/acre",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/ac_relatorio_fase1.html",
    fase2: [],
  },
  AL: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/alagoas",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/al_relatorio_fase1.html",
    fase2: [{"rotulo": "Maceió", "href": "https://observatorio.sebrae.com.br/profile/geo/al-maceio", "observatorio": true, "regiao": "0351"}],
  },
  AM: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/amazonas",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/am_relatorio_fase1.html",
    fase2: [{"rotulo": "PA Zona Leste", "href": "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio%2Ffase2%2F0359%20-%20AM%20-%20Pa%20Sebrae-Am%20-%20Pa%20Zona%20Leste%20-%20Diagnostico_setor_territorio.html?generation=1780083650719888&alt=media", "observatorio": false, "regiao": "0359"}],
  },
  AP: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/amapa",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/ap_relatorio_fase1.html",
    fase2: [],
  },
  BA: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/bahia",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/ba_relatorio_fase1.html",
    fase2: [{"rotulo": "Salvador", "href": "https://observatorio.sebrae.com.br/profile/geo/ba-salvador", "observatorio": true, "regiao": "0340"}],
  },
  CE: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/ceara",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/ce_relatorio_fase1.html",
    fase2: [{"rotulo": "Metropolitano de Fortaleza", "href": "https://observatorio.sebrae.com.br/profile/geo/ce-metropolitano-de-fortaleza", "observatorio": true, "regiao": "0371"}],
  },
  DF: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/distrito-federal",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/df_relatorio_fase1.html",
    fase2: [{"rotulo": "Regiões Sebrae", "href": "https://observatorio.sebrae.com.br/explore?report=Geography&variant=Region+Sebrae", "observatorio": true, "regiao": "0373"}],
  },
  ES: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/espirito-santo",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/es_relatorio_fase1.html",
    fase2: [],
  },
  GO: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/goias",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/go_relatorio_fase1.html",
    fase2: [{"rotulo": "Central", "href": "https://observatorio.sebrae.com.br/profile/geo/go-central", "observatorio": true, "regiao": "0385"}],
  },
  MA: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/maranhao",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/ma_relatorio_fase1.html",
    fase2: [{"rotulo": "Lençóis-Munim", "href": "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio%2Ffase2%2F0393%20-%20MA%20-%20Lenc%CC%A7o%CC%81is-Munim%20-%20Diagnostico_setor_territorio.html?generation=1780083691694228&alt=media", "observatorio": false, "regiao": "0393"}],
  },
  MG: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/minas-gerais",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/mg_relatorio_fase1.html",
    fase2: [{"rotulo": "Triângulo", "href": "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio%2Ffase2%2F0082%20-%20MG%20-%20Tria%CC%82ngulo%20-%20Diagnostico_setor_territorio.html?generation=1780083539638057&alt=media", "observatorio": false, "regiao": "0082"}],
  },
  MS: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/mato-grosso-do-sul",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/ms_relatorio_fase1.html",
    fase2: [{"rotulo": "URC", "href": "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio%2Ffase2%2F0397%20-%20MS%20-%20URC%20-%20Diagnostico_setor_territorio.html?generation=1780083696733204&alt=media", "observatorio": false, "regiao": "0397"}],
  },
  MT: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/mato-grosso",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/mt_relatorio_fase1.html",
    fase2: [{"rotulo": "Metropolitana", "href": "https://observatorio.sebrae.com.br/profile/geo/mt-metropolitana", "observatorio": true, "regiao": "0398"}],
  },
  PA: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/para",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/pa_relatorio_fase1.html",
    fase2: [{"rotulo": "Baixo Amazonas", "href": "https://observatorio.sebrae.com.br/profile/geo/pa-b-amazonas", "observatorio": true, "regiao": "0405"}],
  },
  PB: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/paraiba",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/pb_relatorio_fase1.html",
    fase2: [{"rotulo": "João Pessoa", "href": "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio%2Ffase2%2F0422%20-%20PB%20-%20Joa%CC%83o%20Pessoa%20-%20Diagnostico_setor_territorio.html?generation=1780083725119316&alt=media", "observatorio": false, "regiao": "0422"}],
  },
  PE: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/pernambuco",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/pe_relatorio_fase1.html",
    fase2: [{"rotulo": "RMR", "href": "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio%2Ffase2%2F0431%20-%20PE%20-%20RMR%20-%20Diagnostico_setor_territorio.html?generation=1780083735207663&alt=media", "observatorio": false, "regiao": "0431"}],
  },
  PI: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/piaui",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/pi_relatorio_fase1.html",
    fase2: [],
  },
  PR: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/parana",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/pr_relatorio_fase1.html",
    fase2: [{"rotulo": "Norte", "href": "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio%2Ffase2%2F0438%20-%20PR%20-%20Norte%20-%20Diagnostico_setor_territorio.html?generation=1780083744558233&alt=media", "observatorio": false, "regiao": "0438"}, {"rotulo": "Noroeste", "href": "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio%2Ffase2%2F0437%20-%20PR%20-%20Noroeste%20-%20Diagnostico_setor_territorio.html?generation=1780083743338120&alt=media", "observatorio": false, "regiao": "0437"}],
  },
  RJ: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/rio-de-janeiro",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/rj_relatorio_fase1.html",
    fase2: [{"rotulo": "Rio de Janeiro", "href": "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio%2Ffase2%2F0442%20-%20RJ%20-%20Rio%20De%20Janeiro%20-%20Diagnostico_setor_territorio.html?generation=1780083749439829&alt=media", "observatorio": false, "regiao": "0442"}],
  },
  RN: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/rio-grande-do-norte",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/rn_relatorio_fase1.html",
    fase2: [{"rotulo": "Natal – Sede", "href": "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio%2Ffase2%2F0443%20-%20RN%20-%20Natal%20-%20Sede%20-%20Diagnostico_setor_territorio.html?generation=1780083750421991&alt=media", "observatorio": false, "regiao": "0443"}],
  },
  RO: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/rondonia",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/ro_relatorio_fase1.html",
    fase2: [{"rotulo": "Porto Velho", "href": "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio%2Ffase2%2F0450%20-%20RO%20-%20Porto%20Velho%20-%20Diagnostico_setor_territorio.html?generation=1780083759935620&alt=media", "observatorio": false, "regiao": "0450"}],
  },
  RR: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/roraima",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/rr_relatorio_fase1.html",
    fase2: [],
  },
  RS: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/rio-grande-do-sul",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/rs_relatorio_fase1.html",
    fase2: [{"rotulo": "Metropolitana", "href": "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio%2Ffase2%2F0457%20-%20RS%20-%20Metropolitana%20-%20Diagnostico_setor_territorio.html?generation=1782164697322621&alt=media", "observatorio": false, "regiao": "0457"}, {"rotulo": "Noroeste", "href": "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio%2Ffase2%2F0458%20-%20RS%20-%20Noroeste%20-%20Diagnostico_setor_territorio.html?generation=1782164697577390&alt=media", "observatorio": false, "regiao": "0458"}, {"rotulo": "Norte", "href": "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio%2Ffase2%2F0459%20-%20RS%20-%20Norte%20-%20Diagnostico_setor_territorio.html?generation=1782164697666722&alt=media", "observatorio": false, "regiao": "0459"}, {"rotulo": "Sul", "href": "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio%2Ffase2%2F0462%20-%20RS%20-%20Sul%20-%20Diagnostico_setor_territorio.html?generation=1782164697247121&alt=media", "observatorio": false, "regiao": "0462"}],
  },
  SC: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/santa-catarina",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/sc_relatorio_fase1.html",
    fase2: [{"rotulo": "Sul", "href": "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio%2Ffase2%2F0472%20-%20SC%20-%20Sul%20-%20Diagnostico_setor_territorio.html?generation=1780083504291184&alt=media", "observatorio": false, "regiao": "0472"}, {"rotulo": "Norte", "href": "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio%2Ffase2%2F0469%20-%20SC%20-%20Norte%20-%20Diagnostico_setor_territorio.html?generation=1780083500748845&alt=media", "observatorio": false, "regiao": "0469"}, {"rotulo": "Vale do Itajaí", "href": "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio%2Ffase2%2F0474%20-%20SC%20-%20Vale%20do%20Itajai%CC%81%20-%20Diagnostico_setor_territorio.html?generation=1780083504577276&alt=media", "observatorio": false, "regiao": "0474"}],
  },
  SE: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/sergipe",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/se_relatorio_fase1.html",
    fase2: [],
  },
  SP: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/sao-paulo",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/sp_relatorio_fase1.html",
    fase2: [{"rotulo": "Capital", "href": "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio%2Ffase2%2F0200%20-%20SP%20-%20Capital%20-%20Diagnostico_setor_territorio.html?generation=1780083567963871&alt=media", "observatorio": false, "regiao": "0200"}],
  },
  TO: {
    geral: "https://observatorio.sebrae.com.br/profile/geo/tocantins",
    fase1: "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio/fase1/to_relatorio_fase1.html",
    fase2: [{"rotulo": "Norte", "href": "https://storage.googleapis.com/ucomp-na/Estrategia_Setor_Territorio%2Ffase2%2F0226%20-%20TO%20-%20Norte%20-%20Diagnostico_setor_territorio.html?generation=1780083592311644&alt=media", "observatorio": false, "regiao": "0226"}],
  },
};
