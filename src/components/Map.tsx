import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf';
import type { Measurement } from '../pages/Index';

interface MapProps {
  isDrawing: boolean;
  onMeasurementComplete: (measurement: Measurement) => void;
}

const Map = ({ isDrawing, onMeasurementComplete }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<any[]>([]);
  const [mapboxToken, setMapboxToken] = useState('');

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken || 'YOUR_MAPBOX_TOKEN';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [-74.5, 40],
      zoom: 18,
      pitch: 0,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (!map.current) return;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (!isDrawing) return;

      const coordinates = e.lngLat;
      draw.current.push([coordinates.lng, coordinates.lat]);

      // Draw point
      const pointFeature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [coordinates.lng, coordinates.lat],
        },
        properties: {},
      };

      if (!map.current?.getSource('points')) {
        map.current?.addSource('points', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [pointFeature],
          },
        });

        map.current?.addLayer({
          id: 'points',
          type: 'circle',
          source: 'points',
          paint: {
            'circle-radius': 6,
            'circle-color': '#fff',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#2563eb',
          },
        });
      } else {
        const source = map.current?.getSource('points') as mapboxgl.GeoJSONSource;
        const features = source?._data?.features || [];
        source?.setData({
          type: 'FeatureCollection',
          features: [...features, pointFeature],
        });
      }

      // Draw line if we have at least 2 points
      if (draw.current.length > 1) {
        const lineFeature = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: draw.current,
          },
          properties: {},
        };

        if (!map.current?.getSource('lines')) {
          map.current?.addSource('lines', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [lineFeature],
            },
          });

          map.current?.addLayer({
            id: 'lines',
            type: 'line',
            source: 'lines',
            paint: {
              'line-color': '#2563eb',
              'line-width': 2,
            },
          });
        } else {
          const source = map.current?.getSource('lines') as mapboxgl.GeoJSONSource;
          source?.setData({
            type: 'FeatureCollection',
            features: [lineFeature],
          });
        }
      }

      // Complete polygon if we have at least 3 points and clicked near start
      if (draw.current.length >= 3) {
        const start = draw.current[0];
        const end = [coordinates.lng, coordinates.lat];
        const distance = turf.distance(start, end, { units: 'meters' });

        if (distance < 5) {
          draw.current.push(start);
          const polygon = turf.polygon([draw.current]);
          const area = turf.area(polygon);
          const perimeter = turf.length(turf.lineString(draw.current), { units: 'meters' });

          onMeasurementComplete({
            area,
            perimeter,
            coordinates: draw.current,
          });

          // Reset drawing
          draw.current = [];
          map.current?.getSource('points')?.setData({
            type: 'FeatureCollection',
            features: [],
          });
          map.current?.getSource('lines')?.setData({
            type: 'FeatureCollection',
            features: [],
          });
        }
      }
    };

    map.current.on('click', handleClick);

    return () => {
      map.current?.off('click', handleClick);
    };
  }, [isDrawing, onMeasurementComplete]);

  return (
    <>
      {!mapboxToken && (
        <div className="absolute top-4 left-4 right-4 z-10 bg-white p-4 rounded-lg shadow">
          <input
            type="text"
            placeholder="Enter your Mapbox token"
            className="w-full p-2 border rounded"
            onChange={(e) => setMapboxToken(e.target.value)}
          />
          <p className="text-sm text-gray-500 mt-2">
            Get your token at{' '}
            <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-blue-500">
              mapbox.com
            </a>
          </p>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
    </>
  );
};

export default Map;