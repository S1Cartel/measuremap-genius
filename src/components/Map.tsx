import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import { Draw } from 'ol/interaction';
import { Polygon } from 'ol/geom';
import { getArea, getLength } from 'ol/sphere';
import XYZ from 'ol/source/XYZ';
import { Zoom } from 'ol/control';
import 'ol/ol.css';
import type { Measurement } from '../pages/Index';

interface MapProps {
  isDrawing: boolean;
  onMeasurementComplete: (measurement: Measurement) => void;
}

const MapComponent = ({ isDrawing, onMeasurementComplete }: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const drawInteraction = useRef<Draw | null>(null);
  const vectorSource = useRef(new VectorSource());

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Initialize map
    const vectorLayer = new VectorLayer({
      source: vectorSource.current,
    });

    // Add OSM property boundaries layer
    const osmParcelLayer = new TileLayer({
      source: new XYZ({
        url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
        attributions: ['© OpenStreetMap contributors'],
      }),
      opacity: 0.7,
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        osmParcelLayer,
        vectorLayer,
      ],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
      controls: [
        new Zoom({
          className: 'absolute bottom-16 right-4',
        }),
      ],
    });

    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;

    if (isDrawing) {
      // Add draw interaction
      drawInteraction.current = new Draw({
        source: vectorSource.current,
        type: 'Polygon',
      });

      drawInteraction.current.on('drawend', (event) => {
        const feature = event.feature;
        const geometry = feature.getGeometry() as Polygon;
        
        // Calculate area in square meters
        const area = getArea(geometry);
        // Calculate perimeter in meters
        const perimeter = getLength(geometry);

        // Convert coordinates to array format expected by the application
        const coordinates = geometry.getCoordinates()[0].map(coord => [coord[0], coord[1]]);

        onMeasurementComplete({
          area,
          perimeter,
          coordinates,
        });

        // Remove draw interaction after completion
        if (mapInstance.current && drawInteraction.current) {
          mapInstance.current.removeInteraction(drawInteraction.current);
          drawInteraction.current = null;
        }
      });

      mapInstance.current.addInteraction(drawInteraction.current);
    } else {
      // Remove draw interaction when not drawing
      if (drawInteraction.current) {
        mapInstance.current.removeInteraction(drawInteraction.current);
        drawInteraction.current = null;
      }
    }

    return () => {
      if (mapInstance.current && drawInteraction.current) {
        mapInstance.current.removeInteraction(drawInteraction.current);
      }
    };
  }, [isDrawing, onMeasurementComplete]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {!isDrawing && (
        <div className="absolute top-4 left-4 right-4 bg-white p-4 rounded-lg shadow text-center">
          <p className="text-gray-600">
            Click "Start Measuring" to begin drawing a polygon on the map. Property boundaries are shown as an overlay.
          </p>
        </div>
      )}
    </div>
  );
};

export default MapComponent;