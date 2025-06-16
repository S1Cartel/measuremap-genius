
import { useEffect, useState } from 'react';

interface GlobeLoaderProps {
  onComplete: () => void;
}

const GlobeLoader = ({ onComplete }: GlobeLoaderProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-violet-900 z-50 flex items-center justify-center opacity-0 transition-opacity duration-500 pointer-events-none">
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-violet-900 z-50 flex items-center justify-center transition-opacity duration-500">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-violet-500/30 animate-pulse"></div>
          <div className="absolute inset-2 rounded-full border-2 border-violet-400 animate-spin"></div>
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-violet-600 to-purple-400 animate-pulse shadow-lg shadow-violet-500/50"></div>
          <div className="absolute inset-6 rounded-full bg-gradient-to-br from-emerald-500 to-violet-500 opacity-80"></div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">GeoAnalyzer Pro</h2>
        <p className="text-violet-300 animate-pulse">Initializing Advanced 3D Earth View...</p>
      </div>
    </div>
  );
};

export default GlobeLoader;
