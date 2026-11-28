import React, { useEffect, useRef } from 'react';
import {
    GeoJSONSource,
    LngLatBounds,
    Map as MapLibreMap,
    MapLayerMouseEvent,
    Marker,
    NavigationControl,
    Popup,
    setWorkerUrl
} from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';

setWorkerUrl(maplibreWorkerUrl);

export type VectorMapStyle = 'bright' | 'liberty' | 'positron';
export type VectorMapMode = 'both' | 'heatmap' | 'pins';

export const OPENFREEMAP_STYLES: Record<VectorMapStyle, { label: string; url: string }> = {
    bright: {
        label: 'Street (Bright)',
        url: 'https://tiles.openfreemap.org/styles/bright'
    },
    liberty: {
        label: 'Detailed',
        url: 'https://tiles.openfreemap.org/styles/liberty'
    },
    positron: {
        label: 'Minimal Light',
        url: 'https://tiles.openfreemap.org/styles/positron'
    }
};

export interface VectorMapPoint {
    id: string;
    lat: number;
    lng: number;
    category: string;
    description: string;
    status: string;
    priority?: string;
    area?: string;
    supportCount?: number;
    reportCount?: number;
    timeAgo?: string;
    weight?: number;
}

interface CivicVectorMapProps {
    points: VectorMapPoint[];
    styleKey?: VectorMapStyle;
    mode?: VectorMapMode;
    userLocation?: [number, number] | null; // [lat, lng]
    focusMode?: 'nearMe' | 'allReports' | 'center';
    defaultCenter?: [number, number]; // [lat, lng]
    defaultZoom?: number;
    radiusKm?: number | null;
    showRadius?: boolean;
    onSelectPoint?: (pointId: string) => void;
}

const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const getStatusHex = (status: string): string => {
    switch (status) {
        case 'Resolved':
        case 'Closed':
            return '#10B981';
        case 'In Progress':
            return '#F59E0B';
        case 'Assigned':
        case 'Verified':
            return '#2563EB';
        case 'Rejected':
            return '#EF4444';
        default:
            return '#4F46E5';
    }
};

const buildCirclePolygon = (
    lat: number,
    lng: number,
    radiusKm: number,
    steps = 64
): GeoJSON.Feature<GeoJSON.Polygon> => {
    const coords: Array<[number, number]> = [];
    const earthRadiusKm = 6371;
    const latRad = (lat * Math.PI) / 180;
    const lngRad = (lng * Math.PI) / 180;
    const angularDist = radiusKm / earthRadiusKm;

    for (let i = 0; i <= steps; i++) {
        const bearing = (i * 2 * Math.PI) / steps;
        const pLat = Math.asin(
            Math.sin(latRad) * Math.cos(angularDist) +
            Math.cos(latRad) * Math.sin(angularDist) * Math.cos(bearing)
        );
        const pLng =
            lngRad +
            Math.atan2(
                Math.sin(bearing) * Math.sin(angularDist) * Math.cos(latRad),
                Math.cos(angularDist) - Math.sin(latRad) * Math.sin(pLat)
            );
        coords.push([(pLng * 180) / Math.PI, (pLat * 180) / Math.PI]);
    }

    return {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Polygon',
            coordinates: [coords]
        }
    };
};

const toPointsGeoJson = (
    points: VectorMapPoint[]
): GeoJSON.FeatureCollection<GeoJSON.Point> => ({
    type: 'FeatureCollection',
    features: points.map((pt) => ({
        type: 'Feature',
        properties: {
            id: pt.id,
            category: pt.category,
            description: pt.description,
            status: pt.status,
            priority: pt.priority || 'Medium',
            area: pt.area || 'Verified Location',
            supportCount: pt.supportCount ?? 1,
            reportCount: pt.reportCount ?? 1,
            timeAgo: pt.timeAgo || 'Recent',
            weight: pt.weight ?? 1,
            color: getStatusHex(pt.status)
        },
        geometry: {
            type: 'Point',
            coordinates: [pt.lng, pt.lat]
        }
    }))
});

const SOURCE_HEAT = 'civic-heat-src';
const SOURCE_CLUSTER = 'civic-cluster-src';
const SOURCE_RADIUS = 'civic-radius-src';
const LAYER_HEAT = 'civic-heat-layer';
const LAYER_CLUSTER_CIRCLE = 'civic-cluster-circles';
const LAYER_CLUSTER_COUNT = 'civic-cluster-counts';
const LAYER_POINT_HALO = 'civic-point-halos';
const LAYER_POINT_CORE = 'civic-point-cores';
const LAYER_RADIUS_FILL = 'civic-radius-fill';
const LAYER_RADIUS_LINE = 'civic-radius-line';

const CivicVectorMap: React.FC<CivicVectorMapProps> = ({
    points,
    styleKey = 'bright',
    mode = 'both',
    userLocation = null,
    focusMode = 'nearMe',
    defaultCenter = [22.7196, 75.8577],
    defaultZoom = 12,
    radiusKm = null,
    showRadius = false,
    onSelectPoint
}) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const popupRef = useRef<Popup | null>(null);
    const userMarkerRef = useRef<Marker | null>(null);
    const currentStyleRef = useRef<VectorMapStyle>(styleKey);
    const styleReadyRef = useRef<boolean>(false);

    const pointsRef = useRef<VectorMapPoint[]>(points);
    const modeRef = useRef<VectorMapMode>(mode);
    const userLocationRef = useRef<[number, number] | null>(userLocation);
    const radiusKmRef = useRef<number | null>(radiusKm);
    const showRadiusRef = useRef<boolean>(showRadius);
    const onSelectPointRef = useRef(onSelectPoint);

    pointsRef.current = points;
    modeRef.current = mode;
    userLocationRef.current = userLocation;
    radiusKmRef.current = radiusKm;
    showRadiusRef.current = showRadius;
    onSelectPointRef.current = onSelectPoint;

    const getAvailableStyleFont = (map: MapLibreMap): string[] => {
        try {
            const style = map.getStyle();
            const symbolLayer = style?.layers?.find(
                (l) => l.type === 'symbol' && l.layout && 'text-font' in l.layout
            );
            const fontVal = (symbolLayer?.layout as Record<string, unknown> | undefined)?.['text-font'];
            if (Array.isArray(fontVal) && typeof fontVal[0] === 'string') {
                return [fontVal[0]];
            }
        } catch {
            // fallback below
        }
        return ['Noto Sans Regular'];
    };

    const syncLayersAndVisibility = (map: MapLibreMap) => {
        if (!styleReadyRef.current) return;

        const geoData = toPointsGeoJson(pointsRef.current);
        const radiusFeatures: GeoJSON.Feature<GeoJSON.Polygon>[] =
            showRadiusRef.current && userLocationRef.current && radiusKmRef.current && radiusKmRef.current > 0
                ? [buildCirclePolygon(userLocationRef.current[0], userLocationRef.current[1], radiusKmRef.current)]
                : [];
        const radiusData: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
            type: 'FeatureCollection',
            features: radiusFeatures
        };

        if (!map.getSource(SOURCE_RADIUS)) {
            map.addSource(SOURCE_RADIUS, { type: 'geojson', data: radiusData });
            map.addLayer({
                id: LAYER_RADIUS_FILL,
                type: 'fill',
                source: SOURCE_RADIUS,
                paint: {
                    'fill-color': '#3B82F6',
                    'fill-opacity': 0.07
                }
            });
            map.addLayer({
                id: LAYER_RADIUS_LINE,
                type: 'line',
                source: SOURCE_RADIUS,
                paint: {
                    'line-color': '#2563EB',
                    'line-width': 1.5,
                    'line-dasharray': [3, 3],
                    'line-opacity': 0.65
                }
            });
        } else {
            (map.getSource(SOURCE_RADIUS) as GeoJSONSource).setData(radiusData);
        }

        if (!map.getSource(SOURCE_HEAT)) {
            map.addSource(SOURCE_HEAT, { type: 'geojson', data: geoData });
            map.addLayer({
                id: LAYER_HEAT,
                type: 'heatmap',
                source: SOURCE_HEAT,
                maxzoom: 19,
                paint: {
                    'heatmap-weight': [
                        'interpolate',
                        ['linear'],
                        ['get', 'weight'],
                        0.5,
                        0.45,
                        2.5,
                        1.4
                    ],
                    'heatmap-intensity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        8,
                        0.9,
                        15,
                        1.8
                    ],
                    'heatmap-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        9,
                        24,
                        13,
                        38,
                        17,
                        54
                    ],
                    'heatmap-opacity': 0.85,
                    'heatmap-color': [
                        'interpolate',
                        ['linear'],
                        ['heatmap-density'],
                        0,
                        'rgba(37, 99, 235, 0)',
                        0.18,
                        'rgba(59, 130, 246, 0.58)',
                        0.38,
                        'rgba(16, 185, 129, 0.72)',
                        0.6,
                        'rgba(245, 158, 11, 0.86)',
                        0.82,
                        'rgba(249, 115, 22, 0.94)',
                        1,
                        'rgba(225, 29, 72, 0.98)'
                    ]
                }
            });
        } else {
            (map.getSource(SOURCE_HEAT) as GeoJSONSource).setData(geoData);
        }

        if (!map.getSource(SOURCE_CLUSTER)) {
            map.addSource(SOURCE_CLUSTER, {
                type: 'geojson',
                data: geoData,
                cluster: true,
                clusterMaxZoom: 16,
                clusterRadius: 42
            });

            map.addLayer({
                id: LAYER_CLUSTER_CIRCLE,
                type: 'circle',
                source: SOURCE_CLUSTER,
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': [
                        'step',
                        ['get', 'point_count'],
                        '#F97316',
                        5,
                        '#E11D48'
                    ],
                    'circle-radius': [
                        'step',
                        ['get', 'point_count'],
                        16,
                        5,
                        20,
                        12,
                        24
                    ],
                    'circle-stroke-width': 2.5,
                    'circle-stroke-color': '#FFFFFF'
                }
            });

            map.addLayer({
                id: LAYER_CLUSTER_COUNT,
                type: 'symbol',
                source: SOURCE_CLUSTER,
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': ['get', 'point_count_abbreviated'],
                    'text-font': getAvailableStyleFont(map),
                    'text-size': 12,
                    'text-allow-overlap': true
                },
                paint: {
                    'text-color': '#FFFFFF'
                }
            });

            map.addLayer({
                id: LAYER_POINT_HALO,
                type: 'circle',
                source: SOURCE_CLUSTER,
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-color': ['get', 'color'],
                    'circle-radius': 13,
                    'circle-opacity': 0.22
                }
            });

            map.addLayer({
                id: LAYER_POINT_CORE,
                type: 'circle',
                source: SOURCE_CLUSTER,
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-color': ['get', 'color'],
                    'circle-radius': 7,
                    'circle-stroke-width': 2.2,
                    'circle-stroke-color': '#FFFFFF'
                }
            });
        } else {
            (map.getSource(SOURCE_CLUSTER) as GeoJSONSource).setData(geoData);
        }

        const activeMode = modeRef.current;
        const showHeat = activeMode === 'heatmap' || activeMode === 'both';
        const showPins = activeMode === 'pins' || activeMode === 'both';

        if (map.getLayer(LAYER_HEAT)) {
            map.setLayoutProperty(LAYER_HEAT, 'visibility', showHeat ? 'visible' : 'none');
        }
        [LAYER_CLUSTER_CIRCLE, LAYER_CLUSTER_COUNT, LAYER_POINT_CORE].forEach((layerId) => {
            if (map.getLayer(layerId)) {
                map.setLayoutProperty(layerId, 'visibility', showPins ? 'visible' : 'none');
            }
        });
        if (map.getLayer(LAYER_POINT_HALO)) {
            map.setLayoutProperty(
                LAYER_POINT_HALO,
                'visibility',
                activeMode === 'pins' ? 'visible' : 'none'
            );
        }
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const initCenter: [number, number] = userLocation
            ? [userLocation[1], userLocation[0]]
            : [defaultCenter[1], defaultCenter[0]];

        const map = new MapLibreMap({
            container,
            style: OPENFREEMAP_STYLES[styleKey].url,
            center: initCenter,
            zoom: defaultZoom
        });

        currentStyleRef.current = styleKey;
        styleReadyRef.current = false;
        map.addControl(new NavigationControl({ showCompass: true, showZoom: true }), 'top-left');

        const markReadyAndSync = () => {
            styleReadyRef.current = true;
            syncLayersAndVisibility(map);
        };

        map.on('style.load', markReadyAndSync);
        map.on('load', markReadyAndSync);
        map.on('idle', () => {
            if (!map.getSource(SOURCE_CLUSTER) && map.getStyle()) {
                styleReadyRef.current = true;
                syncLayersAndVisibility(map);
            }
        });

        map.on('click', LAYER_CLUSTER_CIRCLE, async (e: MapLayerMouseEvent) => {
            const features = map.queryRenderedFeatures(e.point, { layers: [LAYER_CLUSTER_CIRCLE] });
            const feature = features[0];
            if (!feature) return;

            const clusterId = feature.properties?.cluster_id as number | undefined;
            const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
            const source = map.getSource(SOURCE_CLUSTER) as GeoJSONSource;

            if (clusterId === undefined || !source) return;

            try {
                const currentZoom = map.getZoom();
                const expansionZoom = await source.getClusterExpansionZoom(clusterId);

                if (expansionZoom <= 16 && expansionZoom - currentZoom > 0.6 && currentZoom < 14) {
                    map.easeTo({ center: coords, zoom: Math.min(15.5, expansionZoom + 0.5), duration: 500 });
                    return;
                }

                const leaves = await source.getClusterLeaves(clusterId, 12, 0);
                const rowsHtml = leaves
                    .map((leaf) => {
                        const props = leaf.properties || {};
                        const color = escapeHtml(String(props.color || '#4F46E5'));
                        const cat = escapeHtml(String(props.category || 'Issue'));
                        const status = escapeHtml(String(props.status || 'Submitted'));
                        const desc = escapeHtml(String(props.description || ''));
                        return `
                            <div style="padding:6px 0;border-bottom:1px solid #f1f5f9;">
                                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:2px;">
                                    <span style="font-size:11px;font-weight:700;color:#0f172a;">${cat}</span>
                                    <span style="font-size:10px;font-weight:700;color:${color};">${status}</span>
                                </div>
                                <div style="font-size:11px;color:#475569;line-height:1.35;">${desc.slice(0, 90)}${desc.length > 90 ? '...' : ''}</div>
                            </div>
                        `;
                    })
                    .join('');

                popupRef.current?.remove();
                popupRef.current = new Popup({ offset: 14, maxWidth: '280px' })
                    .setLngLat(coords)
                    .setHTML(`
                        <div style="font-family:Inter,system-ui,sans-serif;max-height:220px;overflow-y:auto;">
                            <div style="font-size:11px;font-weight:800;text-transform:uppercase;color:#e11d48;padding-bottom:6px;border-bottom:1px solid #e2e8f0;">
                                ${leaves.length} Reports at Hotspot
                            </div>
                            ${rowsHtml}
                        </div>
                    `)
                    .addTo(map);
            } catch (err) {
                console.error('Cluster interaction failed:', err);
            }
        });

        map.on('click', LAYER_POINT_CORE, (e: MapLayerMouseEvent) => {
            const feature = e.features?.[0];
            if (!feature) return;
            const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
            const props = feature.properties || {};
            const id = String(props.id || '');
            const color = escapeHtml(String(props.color || '#4F46E5'));
            const category = escapeHtml(String(props.category || 'Issue'));
            const status = escapeHtml(String(props.status || 'Submitted'));
            const description = escapeHtml(String(props.description || ''));
            const area = escapeHtml(String(props.area || 'Verified Location'));
            const supportCount = Number(props.supportCount ?? 1);
            const reportCount = Number(props.reportCount ?? 1);
            const timeAgo = escapeHtml(String(props.timeAgo || 'Recent'));
            const reportersLine = reportCount >= 2
                ? `<div style="margin-bottom:6px;padding:3px 8px;border-radius:999px;background:#eef2ff;color:#4338ca;font-size:10px;font-weight:700;display:inline-block;">${reportCount} people reported this issue</div>`
                : '';

            popupRef.current?.remove();
            popupRef.current = new Popup({ offset: 12, maxWidth: '270px' })
                .setLngLat(coords)
                .setHTML(`
                    <div style="font-family:Inter,system-ui,sans-serif;space-y:6px;">
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
                            <span style="padding:2px 8px;border-radius:6px;background:#f8fafc;border:1px solid #e2e8f0;font-size:11px;font-weight:700;color:#0f172a;">${category}</span>
                            <span style="padding:2px 8px;border-radius:999px;background:#f8fafc;border:1px solid #e2e8f0;font-size:10px;font-weight:700;color:${color};">${status}</span>
                        </div>
                        ${reportersLine}
                        <p style="font-size:12px;color:#334155;line-height:1.4;margin:0 0 8px 0;">${description.slice(0, 120)}${description.length > 120 ? '...' : ''}</p>
                        <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#64748b;padding-top:6px;border-top:1px solid #f1f5f9;">
                            <span style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${area}</span>
                            <span style="font-weight:700;color:#0f172a;">▲ ${supportCount} · ${timeAgo}</span>
                        </div>
                    </div>
                `)
                .addTo(map);

            if (id && onSelectPointRef.current) {
                onSelectPointRef.current(id);
            }
        });

        [LAYER_CLUSTER_CIRCLE, LAYER_POINT_CORE].forEach((layerId) => {
            map.on('mouseenter', layerId, () => {
                map.getCanvas().style.cursor = 'pointer';
            });
            map.on('mouseleave', layerId, () => {
                map.getCanvas().style.cursor = '';
            });
        });

        const resizeObserver = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(() => map.resize())
            : null;
        resizeObserver?.observe(container);
        const initResizeTimer = window.setTimeout(() => map.resize(), 250);

        mapRef.current = map;

        return () => {
            window.clearTimeout(initResizeTimer);
            resizeObserver?.disconnect();
            popupRef.current?.remove();
            userMarkerRef.current?.remove();
            map.remove();
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        if (currentStyleRef.current !== styleKey) {
            currentStyleRef.current = styleKey;
            styleReadyRef.current = false;
            map.setStyle(OPENFREEMAP_STYLES[styleKey].url);
        }
    }, [styleKey]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        syncLayersAndVisibility(map);
    }, [points, mode, userLocation, radiusKm, showRadius]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        userMarkerRef.current?.remove();
        userMarkerRef.current = null;

        if (userLocation) {
            const el = document.createElement('div');
            el.style.width = '18px';
            el.style.height = '18px';
            el.style.borderRadius = '9999px';
            el.style.background = '#2563EB';
            el.style.border = '3px solid #FFFFFF';
            el.style.boxShadow = '0 0 0 6px rgba(37, 99, 235, 0.22)';

            userMarkerRef.current = new Marker({ element: el })
                .setLngLat([userLocation[1], userLocation[0]])
                .setPopup(
                    new Popup({ offset: 12 }).setHTML(
                        '<div style="font-family:Inter,system-ui,sans-serif;font-size:12px;font-weight:700;color:#0f172a;">Your Current Location</div>'
                    )
                )
                .addTo(map);
        }
    }, [userLocation]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        if (focusMode === 'nearMe' && userLocation) {
            map.flyTo({ center: [userLocation[1], userLocation[0]], zoom: defaultZoom, duration: 800 });
            return;
        }

        if (focusMode === 'center') {
            map.flyTo({ center: [defaultCenter[1], defaultCenter[0]], zoom: defaultZoom, duration: 800 });
            return;
        }

        if (points.length === 0) {
            if (userLocation) {
                map.flyTo({ center: [userLocation[1], userLocation[0]], zoom: defaultZoom, duration: 800 });
            }
            return;
        }

        if (points.length === 1) {
            map.flyTo({ center: [points[0].lng, points[0].lat], zoom: 14, duration: 800 });
            return;
        }

        const bounds = new LngLatBounds();
        points.forEach((pt) => bounds.extend([pt.lng, pt.lat]));
        if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: 55, maxZoom: 15, duration: 800 });
        }
    }, [focusMode, points, userLocation, defaultCenter, defaultZoom]);

    return <div ref={containerRef} className="w-full h-full" />;
};

export default CivicVectorMap;
