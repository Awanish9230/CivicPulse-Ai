/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module 'leaflet.heat' {
  import type * as L from 'leaflet';

  export type HeatLatLngTuple = [number, number, number?];

  export interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }

  export function heatLayer(
    latlngs: HeatLatLngTuple[],
    options?: HeatLayerOptions
  ): L.Layer;
}
