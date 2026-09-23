import React from 'react';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';

interface Props {
  start: { latitude: number; longitude: number } | null;
  end: { latitude: number; longitude: number } | null;
  mode: string;
  calcType: string;
}

import React from 'react';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';

interface Props {
  start: { latitude: number; longitude: number } | null;
  end: { latitude: number; longitude: number } | null;
  mode: string;
  calcType: string;
}

export default function MapContainer({ start, end, mode, calcType }: Props) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [midpoint, setMidpoint] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;
    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: start ? [start.longitude, start.latitude] : [-122.420679, 37.772537],
      zoom: 13,
    });
    setMap(m);
    return () => m.remove();
  }, []);

  useEffect(() => {
    if (!map || !start || !end) return;
    const fetchRoute = async () => {
      const resp = await fetch(`https://api.mapbox.com/directions/v5/mapbox.${mode}/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?steps=true&geometries=geojson&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`);
      const data = await resp.json();
      const route = data.routes[0];
      const coords = route.geometry.coordinates as [number, number][];
      setRouteCoords(coords);

      // Calculate midpoint
      const calcMidpoint = () => {
        if (!coords.length) return;
        const totalDistance = route.distance; // in meters
        const target = totalDistance / 2;
        let acc = 0;
        for (let i = 0; i < coords.length - 1; i++) {
          const d = haversineDistance(coords[i][1], coords[i][0], coords[i + 1][1], coords[i + 1][0]);
          if (acc + d >= target) {
            const remaining = target - acc;
            const f = remaining / d;
            const lat = coords[i][1] + f * (coords[i + 1][1] - coords[i][1]);
            const lng = coords[i][0] + f * (coords[i + 1][0] - coords[i][0]);
            setMidpoint({ latitude: lat, longitude: lng });
            return;
          }
          acc += d;
        }
        setMidpoint({ latitude: coords[coords.length - 1][1], longitude: coords[coords.length - 1][0] });
      };
      calcMidpoint();
    };
    fetchRoute();
  }, [map, start, end, mode, calcType]);

  // Haversine helper
  const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Render route and midpoint marker when map ready and routeCoords available
  useEffect(() => {
    if (!map) return;
    if (!routeCoords.length) return;
    if (map.getSource('route')) {
      (map.getSource('route') as mapboxgl.GeoJSONSource).setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: routeCoords } });
    } else {
      map.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: routeCoords } } });
      map.addLayer({ id: 'route', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#888', 'line-width': 6 } });
    }
    if (midpoint) {
      if (map.getSource('midpoint')) {
        (map.getSource('midpoint') as mapboxgl.GeoJSONSource).setData({ type: 'Feature', geometry: { type: 'Point', coordinates: [midpoint.longitude, midpoint.latitude] } });
      } else {
        map.addSource('midpoint', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Point', coordinates: [midpoint.longitude, midpoint.latitude] } } });
        map.addLayer({ id: 'midpoint', type: 'circle', source: 'midpoint', paint: { 'circle-radius': 10, 'circle-color': '#ff0000' } });
      }
    }
    // Fit bounds
    if (start && end) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([start.longitude, start.latitude]);
      bounds.extend([end.longitude, end.latitude]);
      map.fitBounds(bounds, { padding: 50 });
    }
  }, [map, routeCoords, midpoint, start, end]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
