# Observatório Sebrae · Mapa por território (Fase 1)

Página **Brasil** do Observatório com mapa coroplético interativo e barra lateral de controles.
Fase 1 = mapa + controles. Gráficos (Recharts/ECharts) e relatório A4 (@react-pdf/renderer) ficam para a fase 2.

> **Valores ilustrativos.** Os números dos indicadores são fictícios (gerados de forma determinística) e servem só para validar o layout.
> As malhas e as participações dos biomas são reais (IBGE).

## Como rodar

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # versão de produção
```

Node 18.17+.

**Versão estática (sem servidor):** `npm run build:estatico` gera `dist-estatico/` com os mesmos componentes empacotados pelo Vite (pasta `estatico/`). Dá para abrir em qualquer servidor de arquivos, inclusive numa subpasta. É a versão usada na prévia publicada.

## Stack

| Camada | Escolha | Observação |
|---|---|---|
| Framework | **Next.js 14** (App Router, JS) | `app/page.jsx` → `components/Observatorio.jsx` |
| Mapa base | **MapLibre GL JS 4** | API idêntica ao Mapbox GL. Troca na seção "Migrar para Mapbox" |
| Camadas de dados | **Deck.gl 9** via `MapboxOverlay` | pontos Sebrae, siglas das UFs, moldura da visualização Destaques |
| Estilo | **Tailwind 3** + variáveis CSS por tema | `tailwind.config.js` e `app/globals.css` |
| Escalas | d3-scale / d3-array / d3-interpolate | quintis, rampas, contraste das siglas |

## Estrutura

```
app/                  layout, página e CSS global (temas claro · navy · escuro)
components/
  Observatorio.jsx    estado da página: indicador, UF, município, camadas, tema, visualização
  Mapa.jsx            MapLibre + Deck.gl, data-driven styling, hover, clique, carga sob demanda
  Prancha.jsx         2ª visualização "Destaques" (moldura tracejada, N/S/L/O, carimbo e círculo de foco)
  Controles.jsx       busca global, dropdowns de Indicadores e UF, checkboxes de camadas
  Card.jsx            caixa padrão: ícone + rótulo + ícone de informação (InfoTip)
  CaixaUF.jsx         caixa de destaque do estado/município (bandeira, posição, 2 métricas)
  Icon.jsx            Iconly Regular (sistema) + ícones de conteúdo do kit
lib/
  escalas.js          rampa verde/amarelo/bege, rampas de bioma, expressões MapLibre
  dados/              indicadores, UFs, biomas, municípios e métricas das caixas
public/geo/           malhas otimizadas (ver "Dados geográficos")
```

## Design system

- **Identidade:** do UI kit do Observatório: navy `#070568`/`#0A2474`, azul `#2A4FDA`, lima `#C9DF60`, verdes `#60B466`/`#36BF76`, off-whites. Fontes Proxima Nova (títulos), Aktiv Grotesk (texto), Lato (detalhes), carregadas do kit Adobe Fonts `hpk7hne`. Inter e Lato ficam como reserva.
- **Hierarquia das caixas** (referência FinanceHub): todo card tem ícone, rótulo e **ícone de informação** com tooltip, e depois o número principal, o selo de posição e a nota de fonte e data.
- **Ícones de sistema:** Iconly Regular, *border* por padrão e *duotone* no estado ativo.
- **Temas:** `data-theme="claro|navy|escuro"` na raiz. Os tokens ficam em `tema.*` no Tailwind.
- **Mapa:** rampa de 5 classes bege → amarelo → verdes (`RAMPA_EMPRESAS`). Os biomas usam as cores do kit só nos indicadores de bioma. As siglas usam Lato Black `#232122`, sem contorno, e ficam brancas só sobre os tons escuros. O hover escurece a área e mostra a caixa com cabeçalho rosa.

## Navegação e desempenho

- **Do Brasil ao município:** clique na UF → enquadra o estado e liga “Indicadores municipais” → clique no município → aproxima e mostra a caixa de destaque. A trilha (Território › UF › Município) e o botão voltar sobem um nível.
- **Cor por `feature-state`:** os polígonos são carregados uma vez (`promoteId: 'cod'`). Trocar de indicador só chama `setFeatureState` com o valor e a classe. A geometria não é reprocessada e a cor sai de expressões `step`/`match`.
- **Carga sob demanda:** a malha municipal do Brasil (5.564 municípios, 2 MB, simplificada a 3%) só é baixada quando a camada é ligada sem UF. Cada UF tem um arquivo próprio mais detalhado (`public/geo/municipios/{UF}.json`, de 4 a 430 KB), baixado ao entrar no estado.
- O MapLibre fatia o GeoJSON em tiles no navegador (geojson-vt). Os arquivos de `/geo` têm cache longo (`next.config.mjs`).

### Para produção: vector tiles

Com malhas mais detalhadas (setores censitários, por exemplo), gere tiles vetoriais com **tippecanoe** e sirva PMTiles ou MBTiles:

```bash
tippecanoe -o municipios.pmtiles -l municipios -z12 --coalesce-densest-as-needed \
  --use-attribute-for-id=cod municipios-br-completo.geojson
```

No `Mapa.jsx`, troque as fontes `mun-br`/`mun-uf` por uma fonte `vector` com `promoteId: { municipios: 'cod' }` e informe `'source-layer': 'municipios'` nas camadas. As expressões de cor continuam iguais.

## Migrar para Mapbox

1. `npm i mapbox-gl` e remova `maplibre-gl`.
2. Em `components/Mapa.jsx`, troque o import e o CSS por `mapbox-gl` e defina `mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN`.
3. Opcional: troque o estilo vazio por um estilo do Mapbox Studio, mantendo as camadas de dados por cima.

O `MapboxOverlay` do Deck.gl funciona com os dois.

## Dados geográficos

| Arquivo | Fonte | Licença |
|---|---|---|
| `municipios-br.json`, `municipios/{UF}.json`, `ufs.json` | Malha municipal do IBGE, via [tbrugz/geodata-br](https://github.com/tbrugz/geodata-br), simplificada com mapshaper. As UFs foram dissolvidas a partir dos municípios | dados públicos IBGE |
| `biomas.json`, `municipios-biomas.json`, `uf-biomas` em `lib/dados/ufs.js` | Biomas IBGE 2019 via [geobr](https://github.com/ipeaGIT/geobr) (IPEA). Participações calculadas por interseção de polígonos (shapely) | IBGE · geobr (MIT) |
| Bandeiras das UFs | [pierrelapalu/icones-bandeiras-br-uf](https://github.com/pierrelapalu/icones-bandeiras-br-uf) | CC0 |
| Ícones de sistema | Iconly (arquivo enviado pela equipe) | licença Iconly |

## Sebrae no território

O bloco da barra lateral (`components/SebraeTerritorio.jsx`, dados em `lib/dados/sebraeTerritorio.js`) lista os programas do Sebrae no Brasil, no estado ou no município. Tocar num programa destaca no mapa os municípios participantes. Os programas da dimensão "Jornada" do cube RF são consultados na API do Observatório (`drilldowns=<programa>,<município do programa>`). Os 8 programas dessa dimensão têm retrato real em `public/dados/programas/` (para atualizar: `node scripts/retrato-programa.mjs <resposta-da-api.json>`). Sebrae Delas, ALI e Educação Empreendedora dependem do cube de Atendimentos Sebrae.

## Diagnóstico das micro e pequenas empresas

Abaixo do mapa, duas seções:

- **Micro e Pequenas empresas** (`components/diagnostico/MicroPequenas.jsx`): grandes números em cartões com contador animado (`Contador.jsx`, conta ao entrar na tela e respeita "reduzir movimento"). Cada cartão tem uma microinteração (barra que enche, pictograma, moedas, globo) e um ícone (i) com definição e fonte.
- **Setores** (`components/diagnostico/Setores.jsx`, Recharts, carregado sob demanda): cartões de setor, abas e seletor de período. As barras crescem ao trocar de aba ou de ano. No hover, a barra fica em destaque e as outras esmaecem. Clicar numa barra seleciona o setor e atualiza o resumo.

**Território (Brasil › Estado › Cidade):** a barra `SeletorTerritorio.jsx` fica presa ao topo enquanto a seção está na tela e é sincronizada com o mapa. O botão **Onde estou** pede a localização ao navegador e acha a UF e o município por ponto-no-polígono nas próprias malhas (`lib/geo/localizar.js`), sem serviço externo. Os valores de estados e municípios vêm de `lib/dados/mpeTerritorio.js` e são **fictícios** até a ligação com a API. Cada cartão mostra o selo "fictício". Dados que só existem até o nível do estado (PNAD, pesquisas) mostram o valor do estado quando uma cidade está selecionada.

Os números estão em `lib/dados/mpe.js`, com fonte, data e situação de cada um: `publicado`, `calculado` ou `pendente`. A lista `PENDENCIAS` reúne o que depende de endpoints da API do Observatório. `carregarDiagnostico()` é o ponto único para trocar os valores pelas consultas à API.

## Fase 2 (próximos passos)

- Gráficos fora do mapa (Recharts ou ECharts): série histórica, composição setorial e comparação entre UFs.
- Relatório A4 por estado/município com `@react-pdf/renderer` (ou Puppeteer para imprimir a própria página).
- Ligar os indicadores à API ou base real do Observatório (`lib/dados/indicadores.js` é o único ponto a trocar).
