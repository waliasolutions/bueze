import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { searchByPostalCode } from '@/lib/swissPostalCodes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface ServiceAreaMapProps {
  serviceAreas: string[];
}

// Swiss center coordinates
const SWISS_CENTER: [number, number] = [8.2275, 46.8182];

const ServiceAreaMap: React.FC<ServiceAreaMapProps> = ({ serviceAreas }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [apiKey, setApiKey] = useState<string>('');
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !apiKey) return;

    mapboxgl.accessToken = apiKey;
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: SWISS_CENTER,
        zoom: 7.5,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      map.current.on('load', () => {
        setMapReady(true);
      });

      return () => {
        markers.current.forEach(marker => marker.remove());
        markers.current = [];
        map.current?.remove();
      };
    } catch (error) {
      console.error('Map initialization error:', error);
    }
  }, [apiKey]);

  // Update markers when service areas change
  useEffect(() => {
    if (!map.current || !mapReady || serviceAreas.length === 0) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    const addMarkersForServiceAreas = async () => {
      const bounds = new mapboxgl.LngLatBounds();
      let hasValidCoordinates = false;

      for (const area of serviceAreas) {
        // Handle range: "8000-8099"
        if (area.includes('-')) {
          const [start, end] = area.split('-').map(p => parseInt(p.trim()));
          
          // Sample a few postal codes from the range for visualization
          const sampleSize = Math.min(5, end - start + 1);
          const step = Math.max(1, Math.floor((end - start) / sampleSize));
          
          for (let plz = start; plz <= end; plz += step) {
            const results = await searchByPostalCode(plz.toString().padStart(4, '0'));
            if (results.length > 0) {
              // Use OpenPLZ API to get coordinates (approximate from city name)
              const location = results[0];
              // Simple geocoding approximation - in production, use proper geocoding
              const marker = createMarker(location.city, area);
              if (marker) {
                markers.current.push(marker);
                const lngLat = marker.getLngLat();
                bounds.extend([lngLat.lng, lngLat.lat]);
                hasValidCoordinates = true;
              }
            }
          }
        } 
        // Handle single PLZ: "8000"
        else {
          const results = await searchByPostalCode(area);
          if (results.length > 0) {
            const location = results[0];
            const marker = createMarker(location.city, area);
            if (marker) {
              markers.current.push(marker);
              const lngLat = marker.getLngLat();
              bounds.extend([lngLat.lng, lngLat.lat]);
              hasValidCoordinates = true;
            }
          }
        }
      }

      // Fit map to show all markers
      if (hasValidCoordinates && !bounds.isEmpty()) {
        map.current?.fitBounds(bounds, {
          padding: 50,
          maxZoom: 11,
        });
      }
    };

    addMarkersForServiceAreas();
  }, [serviceAreas, mapReady]);

  // Create marker with Swiss city coordinates (approximate)
  const createMarker = (cityName: string, plz: string): mapboxgl.Marker | null => {
    if (!map.current) return null;

    // Approximate coordinates for major Swiss cities
    const swissCities: Record<string, [number, number]> = {
      'Zürich': [8.5417, 47.3769],
      'Genève': [6.1432, 46.2044],
      'Basel': [7.5886, 47.5596],
      'Bern': [7.4474, 46.9480],
      'Lausanne': [6.6323, 46.5197],
      'Winterthur': [8.7240, 47.5000],
      'Luzern': [8.3093, 47.0502],
      'St. Gallen': [9.3767, 47.4239],
      'Lugano': [8.9511, 46.0037],
      'Biel': [7.2444, 47.1375],
    };

    // Find matching city or use Swiss center
    let coordinates: [number, number] = SWISS_CENTER;
    
    for (const [city, coords] of Object.entries(swissCities)) {
      if (cityName.includes(city)) {
        coordinates = coords;
        break;
      }
    }

    // Create custom marker element
    const el = document.createElement('div');
    el.className = 'service-area-marker';
    el.style.backgroundColor = 'hsl(var(--primary))';
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.borderRadius = '50%';
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    el.style.cursor = 'pointer';

    const marker = new mapboxgl.Marker(el)
      .setLngLat(coordinates)
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<strong>PLZ ${plz}</strong><br/>${cityName}`)
      )
      .addTo(map.current);

    return marker;
  };

  if (!apiKey) {
    return (
      <Card className="p-4">
        <Label htmlFor="mapbox-key">Mapbox API Key (optional)</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Um eine Kartenvorschau Ihrer Einsatzgebiete zu sehen, geben Sie einen Mapbox API Key ein. 
          Erstellen Sie einen kostenlosen Account auf{' '}
          <a 
            href="https://mapbox.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            mapbox.com
          </a>
        </p>
        <Input
          id="mapbox-key"
          type="text"
          placeholder="pk.ey..."
          onChange={(e) => setApiKey(e.target.value)}
          className="font-mono text-sm"
        />
      </Card>
    );
  }

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden border">
      <div ref={mapContainer} className="absolute inset-0" />
      {serviceAreas.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <p className="text-muted-foreground text-sm">
            Fügen Sie Einsatzgebiete hinzu, um sie auf der Karte zu sehen
          </p>
        </div>
      )}
    </div>
  );
};

export default ServiceAreaMap;
