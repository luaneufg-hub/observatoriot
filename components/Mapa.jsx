'use client';
// Mapa — MapLibre GL (API do Mapbox GL) + Deck.gl.
// • Polígonos (UFs, municípios, biomas) como camadas nativas, coloridas com expressões
//   (data-driven styling) que leem o valor do feature-state → trocar indicador não
//   reprocessa geometria. GeoJSON é fatiado em vector tiles no cliente (geojson-vt).
// • Deck.gl (MapboxOverlay) para pontos do Sebrae, siglas das UFs e a prancha (Destaques).
// Para usar Mapbox GL: troque o import por `mapbox-gl`, defina mapboxgl.accessToken e
// (opcional) um style de mapa base em NEXT_PUBLIC_MAP_STYLE.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer, TextLayer, PathLayer } from '@deck.gl/layers';
import { PathStyleExtension } from '@deck.gl/extensions';
import { BIOMAS } from '@/lib/dados/biomas';
import { BASE, DIM, PRANCHA, expressaoCor, expressaoHachura, hexParaRgb } from '@/lib/escalas';
import { geo } from '@/lib/geo';

const BRASIL = [
  [-74.2, -33.9],
  [-34.6, 5.4],
];
const TRANSP = 'rgba(0,0,0,0)';
// valor do indicador → feature-state: número (escala), texto (categoria) ou
// objeto { cat, forte } (Destaques: setor de destaque e hachura quando forte)
const estadoDe = (v) =>
  v && typeof v === 'object' ? { cat: v.cat, v: null, forte: !!v.forte } : typeof v === 'string' ? { cat: v, v: null, forte: false } : { v, cat: null, forte: false };

const Mapa = forwardRef(function Mapa(
  { tema, modo, ufsGeo, centros, uf, municipio, camadas, valoresUF, valoresMun, classesUF, classesMun, rotulosUF, sebrae, prancha, onHover, onSelecionarUF, onSelecionarMunicipio, apiRef, destaque, onModo },
  ref,
) {
  const el = useRef(null);
  const mapRef = useRef(null);
  const deckRef = useRef(null);
  const hoverRef = useRef(null); // {source, id}
  const [pronto, setPronto] = useState(false);
  const [ctrlModo, setCtrlModo] = useState(null);
  const [, setTick] = useState(0); // re-render da prancha ao mover a câmera
  const cb = useRef({});
  cb.current = { onHover, onSelecionarUF, onSelecionarMunicipio, uf, camadas };

  /* ------------------------------------------------ criação do mapa */
  useEffect(() => {
    const map = new maplibregl.Map({
      container: el.current,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: 'fundo', type: 'background', paint: { 'background-color': 'rgba(0,0,0,0)' } }],
      },
      bounds: BRASIL,
      fitBoundsOptions: { padding: pad() },
      renderWorldCopies: false,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      maxZoom: 11,
      minZoom: 2.5,
      // a página rola: o zoom pela roda do mouse pede Ctrl/⌘ e, no celular, dois dedos
      cooperativeGestures: true,
      locale: {
        'CooperativeGesturesHandler.WindowsHelpText': 'Use Ctrl + rolagem para dar zoom no mapa',
        'CooperativeGesturesHandler.MacHelpText': 'Use ⌘ + rolagem para dar zoom no mapa',
        'CooperativeGesturesHandler.MobileHelpText': 'Use dois dedos para mover o mapa',
        'NavigationControl.ZoomIn': 'Aproximar',
        'NavigationControl.ZoomOut': 'Afastar',
        'FullscreenControl.Enter': 'Tela cheia',
        'FullscreenControl.Exit': 'Sair da tela cheia',
      },
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: 'Malhas: IBGE · Biomas: IBGE/geobr (IPEA)' }), 'bottom-right');
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(new maplibregl.FullscreenControl({ container: el.current.closest('[data-mapa-area]') || el.current }), 'bottom-right');
    // modos de visualização, na mesma coluna dos controles de zoom (acima deles)
    map.addControl(
      {
        onAdd: () => {
          const d = document.createElement('div');
          d.className = 'maplibregl-ctrl maplibregl-ctrl-group ctrl-modo';
          d.setAttribute('role', 'group');
          d.setAttribute('aria-label', 'Visualização');
          setCtrlModo(d);
          return d;
        },
        onRemove: () => setCtrlModo(null),
      },
      'bottom-right',
    );

    map.on('load', () => {
      // hachura (prancha): diagonal 45°
      const c = document.createElement('canvas');
      c.width = c.height = 8;
      const g = c.getContext('2d');
      g.strokeStyle = 'rgba(20,20,24,0.6)';
      g.lineWidth = 1.1;
      g.beginPath();
      g.moveTo(0, 8);
      g.lineTo(8, 0);
      g.moveTo(-2, 2);
      g.lineTo(2, -2);
      g.moveTo(6, 10);
      g.lineTo(10, 6);
      g.stroke();
      map.addImage('hachura', { width: 8, height: 8, data: g.getImageData(0, 0, 8, 8).data });

      map.addSource('ufs', { type: 'geojson', data: geo('ufs.json'), promoteId: 'cod' });
      map.addSource('mun-br', { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, promoteId: 'cod', tolerance: 0.6 });
      map.addSource('mun-uf', { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, promoteId: 'cod' });
      map.addSource('biomas', { type: 'geojson', data: geo('biomas.json') });

      const hover = (src) => ({
        id: `${src}-hover`,
        type: 'fill',
        source: src,
        paint: { 'fill-color': '#4A4542', 'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.16, 0] },
      });
      const hach = (src) => ({ id: `${src}-hachura`, type: 'fill', source: src, layout: { visibility: 'none' }, paint: { 'fill-pattern': 'hachura', 'fill-opacity': 0 } });

      map.addLayer({ id: 'ufs-fill', type: 'fill', source: 'ufs', paint: { 'fill-color': BASE } });
      map.addLayer(hach('ufs'));
      map.addLayer({ id: 'mun-br-fill', type: 'fill', source: 'mun-br', layout: { visibility: 'none' }, paint: { 'fill-color': BASE } });
      map.addLayer(hach('mun-br'));
      map.addLayer({ id: 'mun-uf-fill', type: 'fill', source: 'mun-uf', layout: { visibility: 'none' }, paint: { 'fill-color': BASE } });
      map.addLayer(hach('mun-uf'));
      map.addLayer(hover('ufs'));
      map.addLayer(hover('mun-br'));
      map.addLayer(hover('mun-uf'));
      map.addLayer({ id: 'mun-br-line', type: 'line', source: 'mun-br', layout: { visibility: 'none' }, paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.15, 6, 0.5], 'line-opacity': 0.85 } });
      map.addLayer({ id: 'mun-uf-line', type: 'line', source: 'mun-uf', layout: { visibility: 'none' }, paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.4, 8, 1] } });
      map.addLayer({
        id: 'biomas-fill',
        type: 'fill',
        source: 'biomas',
        layout: { visibility: 'none' },
        paint: { 'fill-color': ['match', ['get', 'id'], ...BIOMAS.flatMap((b) => [b.id, b.cor]), '#999'], 'fill-opacity': 0.16 },
      });
      map.addLayer({
        id: 'biomas-line',
        type: 'line',
        source: 'biomas',
        layout: { visibility: 'none', 'line-join': 'round' },
        paint: { 'line-color': ['match', ['get', 'id'], ...BIOMAS.flatMap((b) => [b.id, b.cor]), '#999'], 'line-width': 1.6, 'line-dasharray': [2, 1.5] },
      });
      map.addLayer({ id: 'ufs-line', type: 'line', source: 'ufs', layout: { 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.1, 7, 2.4] } });
      // destaque de programa Sebrae (municípios participantes)
      for (const src of ['mun-uf', 'mun-br']) {
        map.addLayer({ id: `prog-${src}-dim`, type: 'fill', source: src, layout: { visibility: 'none' }, filter: ['!', ['in', ['get', 'cod'], ['literal', []]]], paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.62 } });
        map.addLayer({ id: `prog-${src}-fill`, type: 'fill', source: src, layout: { visibility: 'none' }, filter: ['in', ['get', 'cod'], ['literal', []]], paint: { 'fill-color': '#D81E5B', 'fill-opacity': 0.88 } });
        map.addLayer({ id: `prog-${src}-line`, type: 'line', source: src, layout: { visibility: 'none' }, filter: ['in', ['get', 'cod'], ['literal', []]], paint: { 'line-color': '#D81E5B', 'line-width': src === 'mun-uf' ? 1.4 : 0.7 } });
      }
      map.addLayer({ id: 'mun-sel-line', type: 'line', source: 'mun-uf', filter: ['==', ['get', 'cod'], -1], paint: { 'line-color': '#232122', 'line-width': 2 } });
      map.addLayer({ id: 'uf-sel-line', type: 'line', source: 'ufs', filter: ['==', ['get', 'uf'], ''], paint: { 'line-color': '#232122', 'line-width': 1.6 } });

      const deck = new MapboxOverlay({ interleaved: false, layers: [] });
      map.addControl(deck);
      deckRef.current = deck;

      /* ---------------- interação */
      const interativas = () => ['mun-uf-fill', 'mun-br-fill', 'ufs-fill'].filter((l) => map.getLayoutProperty(l, 'visibility') !== 'none');
      const limparHover = () => {
        if (hoverRef.current) map.setFeatureState(hoverRef.current, { hover: false });
        hoverRef.current = null;
      };
      map.on('mousemove', (e) => {
        const f = map.queryRenderedFeatures(e.point, { layers: interativas() })[0];
        if (!f || f.id == null) {
          limparHover();
          map.getCanvas().style.cursor = '';
          cb.current.onHover(null);
          return;
        }
        // UF selecionada no modo municipal fica "transparente": o hover vale para o município
        if (f.source === 'ufs' && cb.current.uf === f.properties.uf && cb.current.camadas.municipais) return;
        const alvo = { source: f.source, id: f.id };
        if (!hoverRef.current || hoverRef.current.source !== alvo.source || hoverRef.current.id !== alvo.id) {
          limparHover();
          map.setFeatureState(alvo, { hover: true });
          hoverRef.current = alvo;
        }
        map.getCanvas().style.cursor = 'pointer';
        cb.current.onHover({ tipo: f.source === 'ufs' ? 'uf' : 'mun', id: f.source === 'ufs' ? f.properties.uf : f.properties.cod, uf: f.properties.uf, x: e.point.x, y: e.point.y });
      });
      map.on('mouseout', () => {
        limparHover();
        cb.current.onHover(null);
      });
      map.on('click', (e) => {
        const f = map.queryRenderedFeatures(e.point, { layers: interativas() })[0];
        if (!f) return;
        if (f.source === 'ufs') {
          if (f.properties.uf !== cb.current.uf) cb.current.onSelecionarUF(f.properties.uf);
        } else cb.current.onSelecionarMunicipio(f.properties.cod, f.properties.uf);
      });
      let raf = 0;
      map.on('move', () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => setTick((t) => t + 1));
      });
      setPronto(true);
    });

    mapRef.current = map;
    if (process.env.NODE_ENV !== 'production') window.__mapa = map; // depuração
    return () => map.remove();
  }, []);

  // next/dynamic não repassa `ref`, por isso a API imperativa também vai por `apiRef`
  useImperativeHandle(apiRef || ref, () => ({
    brasil: () => mapRef.current?.fitBounds(BRASIL, { padding: pad(), duration: 800 }),
    enquadrar: (b, opts = {}) => mapRef.current?.fitBounds(b, { padding: pad(opts.lado), duration: 900, maxZoom: opts.maxZoom ?? 8 }),
    project: (lnglat) => mapRef.current?.project(lnglat),
    zoom: () => mapRef.current?.getZoom(),
    map: () => mapRef.current,
  }));
  const pad = (lado) => {
    const w = el.current?.clientWidth || 800;
    const base = Math.max(24, Math.min(60, w * 0.05));
    return { top: base + 80, bottom: base + 20, left: base, right: base + (lado === 'direita' ? Math.min(330, w * 0.4) : 0) };
  };

  /* ------------------------------------------------ carga sob demanda */
  const munBR = camadas.municipais && !uf;
  const munUF = camadas.municipais && !!uf;
  useEffect(() => {
    if (!pronto || !munBR) return;
    const src = mapRef.current.getSource('mun-br');
    if (!src._carregado) {
      src.setData(geo('municipios-br.json'));
      src._carregado = true;
    }
  }, [pronto, munBR]);
  useEffect(() => {
    if (!pronto) return;
    const src = mapRef.current.getSource('mun-uf');
    if (uf && src._uf !== uf) {
      src.setData(geo(`municipios/${uf}.json`));
      src._uf = uf;
    }
  }, [pronto, uf]);

  /* ------------------------------------------------ valores → feature-state */
  useEffect(() => {
    if (!pronto || !valoresUF) return;
    const map = mapRef.current;
    for (const [sigla, v] of valoresUF) {
      const cod = centros[sigla]?.cod;
      if (cod) map.setFeatureState({ source: 'ufs', id: cod }, estadoDe(v));
    }
  }, [pronto, valoresUF, centros]);
  useEffect(() => {
    if (!pronto || !valoresMun) return;
    const map = mapRef.current;
    for (const [cod, v] of valoresMun) {
      const st = estadoDe(v);
      if (munBR) map.setFeatureState({ source: 'mun-br', id: cod }, st);
      if (uf) map.setFeatureState({ source: 'mun-uf', id: cod }, st);
    }
  }, [pronto, valoresMun, munBR, uf]);

  /* ------------------------------------------------ estilos e visibilidade */
  useEffect(() => {
    if (!pronto) return;
    const map = mapRef.current;
    const prancha = modo === 'destaques';
    const vis = (id, on) => map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
    const fundoUF = prancha ? PRANCHA.dim : DIM;

    // UFs
    let corUF;
    if (munBR) corUF = fundoUF;
    else if (munUF) corUF = ['case', ['==', ['get', 'uf'], uf], TRANSP, fundoUF];
    else corUF = expressaoCor(classesUF, { base: prancha ? PRANCHA.base : BASE });
    map.setPaintProperty('ufs-fill', 'fill-color', corUF);

    // municípios
    if (classesMun) {
      const e = expressaoCor(classesMun, { base: prancha ? PRANCHA.base : BASE });
      map.setPaintProperty('mun-br-fill', 'fill-color', e);
      map.setPaintProperty('mun-uf-fill', 'fill-color', e);
    }
    vis('mun-br-fill', munBR);
    vis('mun-br-line', munBR);
    vis('mun-br-hover', munBR);
    vis('mun-uf-fill', munUF);
    vis('mun-uf-line', munUF);
    vis('mun-uf-hover', munUF);
    vis('mun-sel-line', munUF);

    // hachura no quintil superior (prancha)
    vis('ufs-hachura', prancha && !munBR && !munUF);
    vis('mun-br-hachura', prancha && munBR);
    vis('mun-uf-hachura', prancha && munUF);
    if (prancha) {
      if (classesUF) map.setPaintProperty('ufs-hachura', 'fill-opacity', expressaoHachura(classesUF));
      if (classesMun) {
        map.setPaintProperty('mun-br-hachura', 'fill-opacity', expressaoHachura(classesMun));
        map.setPaintProperty('mun-uf-hachura', 'fill-opacity', expressaoHachura(classesMun));
      }
    }

    // camadas do controle
    vis('ufs-line', camadas.limites);
    vis('biomas-fill', camadas.bioma);
    vis('biomas-line', camadas.bioma);
    map.setFilter('uf-sel-line', ['==', ['get', 'uf'], uf && !munUF ? uf : '']);
    map.setFilter('mun-sel-line', ['==', ['get', 'cod'], municipio ?? -1]);
  }, [pronto, modo, uf, municipio, camadas, classesUF, classesMun, munBR, munUF]);

  /* ------------------------------------------------ destaque de programa */
  useEffect(() => {
    if (!pronto) return;
    const map = mapRef.current;
    const filtro = ['in', ['get', 'cod'], ['literal', destaque?.cods || []]];
    for (const src of ['mun-uf', 'mun-br']) {
      const on = !!destaque && (src === 'mun-uf' ? munUF : munBR);
      for (const t of ['fill', 'line']) {
        const id = `prog-${src}-${t}`;
        map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
        map.setFilter(id, filtro);
        if (destaque) map.setPaintProperty(id, `${t}-color`, destaque.cor);
      }
      map.setLayoutProperty(`prog-${src}-dim`, 'visibility', on ? 'visible' : 'none');
      map.setFilter(`prog-${src}-dim`, ['!', filtro]);
    }
  }, [pronto, destaque, munUF, munBR]);

  /* ------------------------------------------------ Deck.gl: Sebrae, siglas e prancha */
  useEffect(() => {
    if (!pronto || !deckRef.current) return;
    const layers = [];

    if (prancha) layers.push(...prancha.camadasDeck);

    if (camadas.sebrae && sebrae) {
      layers.push(
        new ScatterplotLayer({
          id: 'sebrae',
          data: sebrae,
          getPosition: (d) => d.pos,
          getRadius: (d) => (d.sede ? 7 : 4),
          radiusUnits: 'pixels',
          getFillColor: (d) => (d.sede ? [7, 5, 104, 255] : [42, 79, 218, 230]),
          getLineColor: (d) => (d.sede ? [201, 223, 96, 255] : [255, 255, 255, 255]),
          lineWidthUnits: 'pixels',
          getLineWidth: (d) => (d.sede ? 2.5 : 1.5),
          stroked: true,
          pickable: true,
          onHover: (i) => cb.current.onHover(i.object ? { tipo: 'sebrae', id: i.object.id, obj: i.object, x: i.x, y: i.y } : null),
        }),
      );
    }

    if (rotulosUF?.length) {
      layers.push(
        new TextLayer({
          id: 'siglas',
          data: rotulosUF,
          getPosition: (d) => d.pos,
          getText: (d) => d.texto,
          getColor: (d) => d.cor,
          getSize: 10,
          sizeUnits: 'pixels',
          fontFamily: 'Lato, Inter, sans-serif',
          fontWeight: 900,
          characterSet: 'auto',
          getTextAnchor: 'middle',
          getAlignmentBaseline: 'center',
          fontSettings: { sdf: false },
        }),
      );
    }
    deckRef.current.setProps({ layers });
  }, [pronto, camadas.sebrae, sebrae, rotulosUF, prancha]);

  const map = mapRef.current;
  return (
    <div className="absolute inset-0">
      <div ref={el} className="absolute inset-0" aria-label="Mapa do Brasil" role="region" />
      {pronto && prancha?.html && map ? prancha.html((ll) => map.project(ll)) : null}
      {ctrlModo &&
        createPortal(
          <>
            {[
              { id: 'coropletico', rotulo: 'Coroplético', icone: 'coropletico' },
              { id: 'destaques', rotulo: 'Destaques setoriais', icone: 'recentrar' },
            ].map((o) => (
              <button
                key={o.id}
                type="button"
                aria-pressed={modo === o.id}
                aria-label={o.rotulo}
                data-rotulo={o.rotulo}
                onClick={() => onModo?.(o.id)}
                className="ctrl-modo__btn"
              >
                <Icon name={o.icone} size={18} />
              </button>
            ))}
          </>,
          ctrlModo,
        )}
    </div>
  );
});

export default Mapa;
export { PathLayer, TextLayer, ScatterplotLayer, PathStyleExtension, hexParaRgb };
