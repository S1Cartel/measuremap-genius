
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LocationSearchProps {
  onLocationSelect: (coordinates: [number, number], placeName: string) => void;
}

const LocationSearch = ({ onLocationSelect }: LocationSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Using Nominatim API (free OpenStreetMap geocoding service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const coordinates: [number, number] = [parseFloat(result.lon), parseFloat(result.lat)];
        onLocationSelect(coordinates, result.display_name);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="absolute top-6 left-6 right-6 z-10 flex gap-2">
      <div className="flex-1 relative">
        <Input
          type="text"
          placeholder="Search for a location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full bg-black/80 border-gray-600 text-white placeholder:text-gray-400 backdrop-blur-sm"
        />
      </div>
      <Button 
        onClick={handleSearch}
        disabled={isSearching}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default LocationSearch;
