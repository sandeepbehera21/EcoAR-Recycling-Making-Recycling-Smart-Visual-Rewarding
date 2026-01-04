import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';

export interface BinLocation {
  id: number;
  name: string;
  types: string[];
  address: string;
  lat: number;
  lng: number;
  isFull?: boolean;
  isBroken?: boolean;
}

interface GoogleMapViewProps {
  apiKey: string;
  bins: BinLocation[];
  userLocation: { lat: number; lng: number } | null;
  selectedBin: BinLocation | null;
  onBinSelect: (bin: BinLocation | null) => void;
  directions: google.maps.DirectionsResult | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.006,
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

const binTypeColors: Record<string, string> = {
  plastic: '#3b82f6',
  metal: '#6b7280',
  paper: '#f59e0b',
  organic: '#22c55e',
  glass: '#8b5cf6',
  electronics: '#ef4444',
};

const GoogleMapView = ({
  apiKey,
  bins,
  userLocation,
  selectedBin,
  onBinSelect,
  directions,
}: GoogleMapViewProps) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ['places'],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  useEffect(() => {
    if (map && userLocation) {
      map.panTo(userLocation);
      map.setZoom(15);
    }
  }, [map, userLocation]);

  useEffect(() => {
    if (map && selectedBin) {
      map.panTo({ lat: selectedBin.lat, lng: selectedBin.lng });
      map.setZoom(16);
    }
  }, [map, selectedBin]);

  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/30">
        <p className="text-destructive">Error loading map</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const center = userLocation || defaultCenter;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={14}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={mapOptions}
    >
      {/* User location marker */}
      {userLocation && (
        <Marker
          position={userLocation}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          }}
          title="Your location"
        />
      )}

      {/* Bin markers */}
      {bins.map((bin) => (
        <Marker
          key={bin.id}
          position={{ lat: bin.lat, lng: bin.lng }}
          onClick={() => onBinSelect(bin)}
          icon={{
            url: `data:image/svg+xml,${encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z" fill="${binTypeColors[bin.types[0]] || '#22c55e'}"/>
                <circle cx="16" cy="14" r="8" fill="white"/>
                <path d="M12 11h8v2H12zM13 14h6v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" fill="${binTypeColors[bin.types[0]] || '#22c55e'}"/>
              </svg>
            `)}`,
            scaledSize: new google.maps.Size(32, 40),
            anchor: new google.maps.Point(16, 40),
          }}
        />
      ))}

      {/* Info Window for selected bin */}
      {selectedBin && (
        <InfoWindow
          position={{ lat: selectedBin.lat, lng: selectedBin.lng }}
          onCloseClick={() => onBinSelect(null)}
        >
          <div className="p-2">
            <h3 className="font-semibold text-sm">{selectedBin.name}</h3>
            <p className="text-xs text-gray-600">{selectedBin.address}</p>
            <div className="flex gap-1 mt-1 flex-wrap">
              {selectedBin.types.map((type) => (
                <span
                  key={type}
                  className="text-xs px-1.5 py-0.5 rounded capitalize"
                  style={{ backgroundColor: binTypeColors[type] + '20', color: binTypeColors[type] }}
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </InfoWindow>
      )}

      {/* Directions renderer */}
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: '#22c55e',
              strokeWeight: 5,
            },
          }}
        />
      )}
    </GoogleMap>
  );
};

export default GoogleMapView;
