import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import { Draw } from 'ol/interaction';
import { Polygon, Circle, LineString, Point } from 'ol/geom';
import { getArea, getLength } from 'ol/sphere';
import XYZ from 'ol/source/XYZ';
import { Zoom } from 'ol/control';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Feature } from 'ol';
import { Style, Stroke, Fill, Icon } from 'ol/style';
import 'ol/ol.css';
import type { Measurement } from '../pages/Index';
import type { POI } from './POIService';
import { generatePOIsForArea } from './POIService';
import LocationSearch from './LocationSearch';
import GlobeLoader from './GlobeLoader';
import InteractiveMapLegend from './InteractiveMapLegend';

interface MapProps {
  isDrawing: boolean;
  onMeasurementComplete: (measurement: Measurement) => void;
  drawingMode: 'polygon' | 'circle' | 'line';
  onClearAll: () => void;
  shouldClear: boolean;
  generatedPOIs: POI[];
  areaBoundary: number[][];
  areaName: string;
  onPOIsGenerated: (pois: POI[]) => void;
}

const MapComponent = ({ 
  isDrawing, 
  onMeasurementComplete, 
  drawingMode, 
  onClearAll, 
  shouldClear,
  generatedPOIs,
  areaBoundary,
  areaName,
  onPOIsGenerated
}: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const drawInteraction = useRef<Draw | null>(null);
  const vectorSource = useRef(new VectorSource());
  const poiSource = useRef(new VectorSource());
  const boundarySource = useRef(new VectorSource());
  const [showLoader, setShowLoader] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!mapRef.current || mapInstance.current || showLoader) return;

    const vectorLayer = new VectorLayer({
      source: vectorSource.current,
      style: {
        'stroke-color': '#a855f7',
        'stroke-width': 3,
        'fill-color': 'rgba(168, 85, 247, 0.1)',
      },
    });

    const poiLayer = new VectorLayer({
      source: poiSource.current,
      style: (feature) => {
        const poi = feature.get('poi') as POI;
        return new Style({
          image: new Icon({
            src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${poi.color}" stroke="white" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="4" fill="white"/>
              </svg>
            `)}`,
            scale: 1,
            anchor: [0.5, 0.5],
          }),
        });
      },
    });

    const boundaryLayer = new VectorLayer({
      source: boundarySource.current,
      style: new Style({
        stroke: new Stroke({
          color: '#8b5cf6',
          width: 3,
        }),
        fill: new Fill({
          color: 'rgba(139, 92, 246, 0.1)',
        }),
      }),
    });

    const darkBaseLayer = new TileLayer({
      source: new XYZ({
        url: 'https://cartodb-basemaps-{a-c}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
        attributions: ['© OpenStreetMap contributors', '© CartoDB'],
      }),
    });

    const osmParcelLayer = new TileLayer({
      source: new XYZ({
        url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
        attributions: ['© OpenStreetMap contributors'],
      }),
      opacity: 0.2,
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        darkBaseLayer,
        osmParcelLayer,
        boundaryLayer,
        vectorLayer,
        poiLayer,
      ],
      view: new View({
        center: fromLonLat([0, 20]),
        zoom: 2,
        minZoom: 2,
        maxZoom: 20,
      }),
      controls: [
        new Zoom({
          className: 'absolute bottom-32 right-4 bg-black/80 backdrop-blur-sm rounded-xl',
        }),
      ],
    });

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

  // Handle generated POIs
  useEffect(() => {
    if (!poiSource.current) return;

    poiSource.current.clear();
    
    generatedPOIs.forEach(poi => {
      if (visibleCategories.size === 0 || visibleCategories.has(poi.category)) {
        const point = new Point(fromLonLat(poi.coordinates));
        const feature = new Feature({
          geometry: point,
          poi: poi,
        });
        feature.set('name', poi.name);
        feature.set('category', poi.category);
        poiSource.current.addFeature(feature);
      }
    });
  }, [generatedPOIs, visibleCategories]);

  // Handle area boundary
  useEffect(() => {
    if (!boundarySource.current || !mapInstance.current) return;

    boundarySource.current.clear();
    
    if (areaBoundary.length > 0) {
      const coordinates = areaBoundary.map(coord => fromLonLat(coord));
      const polygon = new Polygon([coordinates]);
      const feature = new Feature(polygon);
      boundarySource.current.addFeature(feature);
      
      // Fit map to boundary
      const extent = polygon.getExtent();
      mapInstance.current.getView().fit(extent, { padding: [50, 50, 50, 50] });
    }
  }, [areaBoundary]);

  // Initialize visible categories when POIs are loaded
  useEffect(() => {
    if (generatedPOIs.length > 0 && visibleCategories.size === 0) {
      const categories = new Set(generatedPOIs.map(poi => poi.category));
      setVisibleCategories(categories);
    }
  }, [generatedPOIs]);

  // Clear all features when requested
  useEffect(() => {
    if (shouldClear && vectorSource.current) {
      vectorSource.current.clear();
      onClearAll();
    }
  }, [shouldClear, onClearAll]);

  const handleLocationSelect = async (coordinates: [number, number], placeName: string) => {
    if (!mapInstance.current) return;
    
    setCurrentLocation(placeName);
    
    mapInstance.current.getView().animate({
      center: fromLonLat(coordinates),
      zoom: 16,
      duration: 1500,
    });

    // Generate POIs for the searched location
    try {
      const locationName = placeName.split(',')[0]; // Get the first part of the location name
      const generatedPOIs = await generatePOIsForArea(locationName, []);
      onPOIsGenerated(generatedPOIs);
    } catch (error) {
      console.error('Error generating POIs for location:', error);
    }
  };

  useEffect(() => {
    if (!mapInstance.current) return;

    if (isDrawing) {
      const drawType = drawingMode === 'polygon' ? 'Polygon' : 
                      drawingMode === 'circle' ? 'Circle' : 'LineString';
      
      drawInteraction.current = new Draw({
        source: vectorSource.current,
        type: drawType as any,
        style: {
          'stroke-color': drawingMode === 'polygon' ? '#a855f7' : 
                         drawingMode === 'circle' ? '#10b981' : '#f59e0b',
          'stroke-width': 2,
          'fill-color': drawingMode === 'polygon' ? 'rgba(168, 85, 247, 0.1)' : 
                       drawingMode === 'circle' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
        },
      });

      drawInteraction.current.on('drawend', (event) => {
        const feature = event.feature;
        const geometry = feature.getGeometry();
        
        let measurement: Measurement;
        
        if (drawingMode === 'polygon' && geometry instanceof Polygon) {
          const area = getArea(geometry);
          const perimeter = getLength(geometry);
          const center = geometry.getInteriorPoint().getCoordinates();
          const lonLatCenter = toLonLat(center);
          const coordinates = geometry.getCoordinates()[0].map(coord => {
            const lonLat = toLonLat(coord);
            return [lonLat[0], lonLat[1]];
          });

          measurement = {
            id: crypto.randomUUID(),
            type: 'polygon',
            area,
            perimeter,
            coordinates,
            center_point: [lonLatCenter[0], lonLatCenter[1]] as [number, number],
            location: currentLocation,
          };
        } else if (drawingMode === 'circle' && geometry instanceof Circle) {
          const center = geometry.getCenter();
          const radius = geometry.getRadius();
          const area = Math.PI * radius * radius;
          const perimeter = 2 * Math.PI * radius;
          const lonLatCenter = toLonLat(center);

          // Generate circle coordinates for the coordinates property
          const numPoints = 32;
          const coordinates: number[][] = [];
          for (let i = 0; i <= numPoints; i++) {
            const angle = (i / numPoints) * 2 * Math.PI;
            const x = center[0] + radius * Math.cos(angle);
            const y = center[1] + radius * Math.sin(angle);
            const lonLat = toLonLat([x, y]);
            coordinates.push([lonLat[0], lonLat[1]]);
          }

          measurement = {
            id: crypto.randomUUID(),
            type: 'circle',
            area,
            perimeter,
            radius,
            coordinates,
            center_point: [lonLatCenter[0], lonLatCenter[1]] as [number, number],
            location: currentLocation,
          };
        } else if (drawingMode === 'line' && geometry instanceof LineString) {
          const distance = getLength(geometry);
          const coordinates = geometry.getCoordinates().map(coord => {
            const lonLat = toLonLat(coord);
            return [lonLat[0], lonLat[1]];
          });

          measurement = {
            id: crypto.randomUUID(),
            type: 'line',
            distance,
            coordinates,
            location: currentLocation,
          };
        } else {
          return;
        }

        onMeasurementComplete(measurement);

        if (mapInstance.current && drawInteraction.current) {
          mapInstance.current.removeInteraction(drawInteraction.current);
          drawInteraction.current = null;
        }
      });

      mapInstance.current.addInteraction(drawInteraction.current);
    } else {
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
  }, [isDrawing, onMeasurementComplete, currentLocation, drawingMode]);

  const handleToggleCategory = (category: string, visible: boolean) => {
    setVisibleCategories(prev => {
      const newSet = new Set(prev);
      if (visible) {
        newSet.add(category);
      } else {
        newSet.delete(category);
      }
      return newSet;
    });
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-black to-violet-900">
      {showLoader && <GlobeLoader onComplete={() => setShowLoader(false)} />}
      
      <div ref={mapRef} className="w-full h-full" />
      
      {!showLoader && <LocationSearch onLocationSelect={handleLocationSelect} />}
      
      {generatedPOIs.length > 0 && (
        <InteractiveMapLegend
          pois={generatedPOIs}
          onToggleCategory={handleToggleCategory}
          visibleCategories={visibleCategories}
        />
      )}
      
      {!isDrawing && !showLoader && !areaName && (
        <div className="absolute bottom-24 left-8 right-8 bg-black/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-violet-500/30">
          <p className="text-gray-300 text-center">
            🌍 Search for any location above, then click "Start Measuring" to analyze areas, distances, or draw circles
          </p>
          {currentLocation && (
            <p className="text-violet-400 text-sm text-center mt-2">
              📍 Current location: {currentLocation}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MapComponent;
