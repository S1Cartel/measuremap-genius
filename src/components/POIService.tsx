
import { Building, TreePine, Car, Utensils, Hospital, School, ShoppingBag, MapPin } from 'lucide-react';

export interface POI {
  id: string;
  name: string;
  category: string;
  coordinates: [number, number];
  icon: React.ReactNode;
  color: string;
}

export const generatePOIsForArea = async (areaName: string, boundingBox: number[][]): Promise<POI[]> => {
  // Simulate API call to get points of interest
  // In a real app, this would call Overpass API, Google Places, or similar
  
  const categories = [
    { name: 'restaurant', icon: <Utensils className="h-4 w-4" />, color: '#8b5cf6' },
    { name: 'park', icon: <TreePine className="h-4 w-4" />, color: '#10b981' },
    { name: 'shopping', icon: <ShoppingBag className="h-4 w-4" />, color: '#f59e0b' },
    { name: 'healthcare', icon: <Hospital className="h-4 w-4" />, color: '#ef4444' },
    { name: 'education', icon: <School className="h-4 w-4" />, color: '#3b82f6' },
    { name: 'transport', icon: <Car className="h-4 w-4" />, color: '#6b7280' },
  ];

  const pois: POI[] = [];
  
  if (boundingBox.length > 0) {
    const minLat = Math.min(...boundingBox.map(coord => coord[1]));
    const maxLat = Math.max(...boundingBox.map(coord => coord[1]));
    const minLng = Math.min(...boundingBox.map(coord => coord[0]));
    const maxLng = Math.max(...boundingBox.map(coord => coord[0]));
    
    // Generate sample POIs within the bounding box
    for (let i = 0; i < 20; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const lat = minLat + Math.random() * (maxLat - minLat);
      const lng = minLng + Math.random() * (maxLng - minLng);
      
      pois.push({
        id: `poi_${i}`,
        name: `${category.name.charAt(0).toUpperCase() + category.name.slice(1)} ${i + 1}`,
        category: category.name,
        coordinates: [lng, lat],
        icon: category.icon,
        color: category.color
      });
    }
  }
  
  return pois;
};

export const fetchAreaBoundary = async (areaName: string): Promise<number[][]> => {
  try {
    // Use Nominatim API to get area boundary
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(areaName)}&polygon_geojson=1&limit=1`
    );
    const data = await response.json();
    
    if (data && data.length > 0 && data[0].geojson) {
      const geojson = data[0].geojson;
      if (geojson.type === 'Polygon') {
        return geojson.coordinates[0].map((coord: number[]) => [coord[0], coord[1]]);
      } else if (geojson.type === 'MultiPolygon') {
        return geojson.coordinates[0][0].map((coord: number[]) => [coord[0], coord[1]]);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching area boundary:', error);
    return [];
  }
};
