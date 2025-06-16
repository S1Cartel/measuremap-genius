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
import { fromLonLat, toLonLat } from 'ol/proj';
import 'ol/ol.css';
import type { Measurement } from '../pages/Index';
import LocationSearch from './LocationSearch';
import GlobeLoader from './GlobeLoader';

interface MapProps {
  isDrawing: boolean;
  onMeasurementComplete: (measurement: Measurement) => void;
}

const MapComponent = ({ isDrawing, onMeasurementComplete }: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const drawInteraction = useRef<Draw | null>(null);
  const vectorSource = useRef(new VectorSource());
  const [showLoader, setShowLoader] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<string>('');

  useEffect(() => {
    if (!mapRef.current || mapInstance.current || showLoader) return;

    // Initialize map with dark styling
    const vectorLayer = new VectorLayer({
      source: vectorSource.current,
      style: {
        'stroke-color': '#00ff88',
        'stroke-width': 3,
        'fill-color': 'rgba(0, 255, 136, 0.1)',
      },
    });

    // Dark styled base map
    const darkBaseLayer = new TileLayer({
      source: new XYZ({
        url: 'https://cartodb-basemaps-{a-c}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
        attributions: ['© OpenStreetMap contributors', '© CartoDB'],
      }),
    });

    // Enhanced property boundaries with better visibility
    const osmParcelLayer = new TileLayer({
      source: new XYZ({
        url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
        attributions: ['© OpenStreetMap contributors'],
      }),
      opacity: 0.3,
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        darkBaseLayer,
        osmParcelLayer,
        vectorLayer,
      ],
      view: new View({
        center: fromLonLat([0, 20]),
        zoom: 2,
        minZoom: 2,
        maxZoom: 20,
      }),
      controls: [
        new Zoom({
          className: 'absolute bottom-20 right-4 bg-black/80 backdrop-blur-sm',
        }),
      ],
    });

    // Add smooth zoom animation from globe view
    setTimeout(() => {
      map.getView().animate({
        center: fromLonLat([0, 20]),
        zoom: 3,
        duration: 2000,
      });
    }, 100);

    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.dispose();
      }
    };
  }, [showLoader]);

  // Handle location search
  const handleLocationSelect = (coordinates: [number, number], placeName: string) => {
    if (!mapInstance.current) return;
    
    setCurrentLocation(placeName);
    
    mapInstance.current.getView().animate({
      center: fromLonLat(coordinates),
      zoom: 16,
      duration: 1500,
    });
  };

  useEffect(() => {
    if (!mapInstance.current) return;

    if (isDrawing) {
      // Add draw interaction
      drawInteraction.current = new Draw({
        source: vectorSource.current,
        type: 'Polygon',
        style: {
          'stroke-color': '#00ff88',
          'stroke-width': 2,
          'fill-color': 'rgba(0, 255, 136, 0.1)',
        },
      });

      drawInteraction.current.on('drawend', (event) => {
        const feature = event.feature;
        const geometry = feature.getGeometry() as Polygon;
        
        // Calculate area in square meters
        const area = getArea(geometry);
        // Calculate perimeter in meters
        const perimeter = getLength(geometry);

        // Get center point for additional location info
        const center = geometry.getInteriorPoint().getCoordinates();
        const lonLatCenter = toLonLat(center);

        // Convert coordinates to array format expected by the application
        const coordinates = geometry.getCoordinates()[0].map(coord => {
          const lonLat = toLonLat(coord);
          return [lonLat[0], lonLat[1]];
        });

        onMeasurementComplete({
          area,
          perimeter,
          coordinates,
          centerPoint: lonLatCenter,
          location: currentLocation,
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
  }, [isDrawing, onMeasurementComplete, currentLocation]);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-black to-blue-900">
      {showLoader && <GlobeLoader onComplete={() => setShowLoader(false)} />}
      
      <div ref={mapRef} className="w-full h-full" />
      
      {!showLoader && <LocationSearch onLocationSelect={handleLocationSelect} />}
      
      {!isDrawing && !showLoader && (
        <div className="absolute bottom-6 left-6 right-6 bg-black/80 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-700">
          <p className="text-gray-300 text-center">
            🌍 Search for any location above, then click "Start Measuring" to draw a polygon and analyze the area
          </p>
          {currentLocation && (
            <p className="text-blue-400 text-sm text-center mt-2">
              📍 Current location: {currentLocation}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MapComponent;
