import { useState, useEffect, useCallback } from 'react';
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation, AlertCircle, Recycle, Trash2, FileText, Package, Loader2, LocateFixed, Route, XCircle, Info, CheckCircle, ArrowRightCircle, Sparkles } from "lucide-react";
import binsIllustration from "@/assets/bins-illustration.png";
import { useGoogleMapsApiKey } from "@/hooks/useGoogleMaps";
import GoogleMapView, { BinLocation } from "@/components/maps/GoogleMapView";
import { toast } from "sonner";

// Sample bin locations - in production these would come from a database
const sampleBinLocations: BinLocation[] = [
  {
    id: 1,
    name: "Central Park Recycling Station",
    types: ["plastic", "metal", "paper"],
    address: "Central Park West & 72nd St",
    lat: 40.7764,
    lng: -73.9762,
    isFull: true,
  },
  {
    id: 2,
    name: "Times Square Green Hub",
    types: ["organic", "plastic"],
    address: "Times Square, Manhattan",
    lat: 40.758,
    lng: -73.9855,
  },
  {
    id: 3,
    name: "Bryant Park Eco Center",
    types: ["paper", "plastic", "glass"],
    address: "Bryant Park, 42nd St",
    lat: 40.7536,
    lng: -73.9832,
    isBroken: true,
  },
  {
    id: 4,
    name: "Union Square Recycling Point",
    types: ["metal", "plastic", "paper", "organic"],
    address: "Union Square Park",
    lat: 40.7359,
    lng: -73.9911,
  },
  {
    id: 5,
    name: "Washington Square Bins",
    types: ["plastic", "paper", "electronics"],
    address: "Washington Square Park",
    lat: 40.7308,
    lng: -73.9973,
  },
];

const binTypeIcons: Record<string, { icon: typeof Package; color: string }> = {
  plastic: { icon: Package, color: "text-blue-500" },
  metal: { icon: Recycle, color: "text-muted-foreground" },
  paper: { icon: FileText, color: "text-amber-500" },
  organic: { icon: Trash2, color: "text-primary" },
  glass: { icon: Package, color: "text-purple-500" },
  electronics: { icon: Package, color: "text-red-500" },
};

const LocateBins = () => {
  const { apiKey, loading: apiKeyLoading, error: apiKeyError } = useGoogleMapsApiKey();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedBin, setSelectedBin] = useState<BinLocation | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingDirections, setLoadingDirections] = useState(false);
  const [bins, setBins] = useState<BinLocation[]>(sampleBinLocations);

  // Calculate distance between two points
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  // Get distance string
  const getDistanceString = useCallback((bin: BinLocation): string => {
    if (!userLocation) return '';
    const distance = calculateDistance(userLocation.lat, userLocation.lng, bin.lat, bin.lng);
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  }, [userLocation, calculateDistance]);

  // Get user location
  const getUserLocation = useCallback(() => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          toast.success('Location found!');
          setLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Could not get your location. Using default location.');
          // Default to NYC
          setUserLocation({ lat: 40.7128, lng: -74.006 });
          setLoadingLocation(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
      setUserLocation({ lat: 40.7128, lng: -74.006 });
      setLoadingLocation(false);
    }
  }, []);

  // Get directions to selected bin
  const getDirections = useCallback(async (bin: BinLocation) => {
    if (!userLocation || !apiKey) return;

    setLoadingDirections(true);
    setSelectedBin(bin);

    const directionsService = new google.maps.DirectionsService();

    try {
      const result = await directionsService.route({
        origin: userLocation,
        destination: { lat: bin.lat, lng: bin.lng },
        travelMode: google.maps.TravelMode.WALKING,
      });
      setDirections(result);
      toast.success(`Directions to ${bin.name}`);
    } catch (error) {
      console.error('Error getting directions:', error);
      toast.error('Could not get directions');
    } finally {
      setLoadingDirections(false);
    }
  }, [userLocation, apiKey]);

  // Clear directions
  const clearDirections = useCallback(() => {
    setDirections(null);
    setSelectedBin(null);
  }, []);

  // Auto-get location on mount
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Sort bins by distance when user location changes
  useEffect(() => {
    if (userLocation) {
      const sortedBins = [...sampleBinLocations].sort((a, b) => {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
        return distA - distB;
      });
      setBins(sortedBins);
    }
  }, [userLocation, calculateDistance]);

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              <MapPin className="h-4 w-4" />
              AR Navigation Coming Soon
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Locate <span className="text-gradient-eco">Recycling Bins</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Find the nearest recycling bins and get walking directions.
            </p>
          </div>

          {/* AR Coming Soon Banner */}
          <Card className="mb-8 bg-eco-gradient border-none overflow-hidden animate-fade-in-up delay-100">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="p-4 rounded-2xl bg-card/20 backdrop-blur-sm">
                  <Navigation className="h-12 w-12 text-primary-foreground" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                    <AlertCircle className="h-5 w-5 text-primary-foreground/70" />
                    <span className="text-primary-foreground/70 text-sm font-medium">
                      Coming Soon
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-primary-foreground mb-2">
                    AR Navigation Launching Soon
                  </h2>
                  <p className="text-primary-foreground/80">
                    Walk towards any bin with immersive AR directions overlaid on your camera view. For now, use the interactive map below.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Controls */}
          <div className="flex flex-wrap gap-3 mb-6 animate-fade-in-up delay-150">
            <Button
              variant="outline"
              onClick={getUserLocation}
              disabled={loadingLocation}
              className="gap-2"
            >
              {loadingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LocateFixed className="h-4 w-4" />
              )}
              Update My Location
            </Button>
            {directions && (
              <Button variant="outline" onClick={clearDirections} className="gap-2">
                Clear Directions
              </Button>
            )}
          </div>

          {/* Map Section */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Map */}
            <div className="lg:col-span-2 animate-fade-in-up delay-200">
              <Card className="glass-card h-[500px] overflow-hidden">
                <CardContent className="p-0 h-full relative">
                  {apiKeyLoading ? (
                    <div className="h-full flex items-center justify-center bg-muted/30">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : apiKeyError ? (
                    <div className="h-full flex flex-col items-center justify-center bg-muted/30 p-4">
                      <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                      <p className="text-muted-foreground text-center">{apiKeyError}</p>
                    </div>
                  ) : apiKey ? (
                    <GoogleMapView
                      apiKey={apiKey}
                      bins={bins}
                      userLocation={userLocation}
                      selectedBin={selectedBin}
                      onBinSelect={setSelectedBin}
                      directions={directions}
                    />
                  ) : null}

                  {/* Legend */}
                  <div className="absolute bottom-4 left-4 glass-card rounded-xl p-4">
                    <p className="text-xs font-medium mb-2">Bin Types</p>
                    <div className="flex gap-3 flex-wrap">
                      {Object.entries(binTypeIcons).slice(0, 4).map(([type, { color }]) => (
                        <div key={type} className="flex items-center gap-1">
                          <div className={`w-3 h-3 rounded-full ${type === 'plastic' ? 'bg-blue-500' :
                            type === 'metal' ? 'bg-gray-500' :
                              type === 'paper' ? 'bg-amber-500' :
                                'bg-primary'
                            }`} />
                          <span className="text-xs capitalize">{type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bin List */}
            <div className="space-y-4 animate-fade-in-up delay-300">
              <h3 className="font-semibold text-lg mb-4">Nearby Bins</h3>

              {/* Smart Recommendation Card */}
              {bins.length > 0 && (bins[0].isFull || bins[0].isBroken) && bins.find(b => !b.isFull && !b.isBroken) && (
                <Card className="bg-primary/10 border-primary/20 mb-6 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/20 text-primary mt-1">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary text-sm flex items-center gap-2">
                          Smart Recommendation
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 mb-2">
                          The nearest bin is {bins[0].isFull ? 'full' : 'under maintenance'}. We recommend:
                        </p>
                        <div className="bg-background/50 rounded-lg p-2 border border-primary/10 cursor-pointer hover:bg-background/80 transition-colors"
                          onClick={() => setSelectedBin(bins.find(b => !b.isFull && !b.isBroken) || null)}>
                          <div className="font-medium text-sm">
                            {bins.find(b => !b.isFull && !b.isBroken)?.name}
                          </div>
                          <div className="text-xs text-primary mt-1 flex items-center gap-1">
                            <Navigation className="h-3 w-3" />
                            {getDistanceString(bins.find(b => !b.isFull && !b.isBroken)!)} away
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {bins.map((bin, index) => (
                <Card
                  key={bin.id}
                  className={`glass-card hover:shadow-lg transition-all cursor-pointer group ${selectedBin?.id === bin.id ? 'ring-2 ring-primary' : ''
                    } ${bin.isFull || bin.isBroken ? 'opacity-80' : ''}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => setSelectedBin(bin)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg transition-colors ${bin.isFull ? 'bg-destructive/10' :
                        bin.isBroken ? 'bg-amber-500/10' :
                          'bg-primary/10 group-hover:bg-primary/20'
                        }`}>
                        {bin.isFull ? (
                          <XCircle className="h-5 w-5 text-destructive" />
                        ) : bin.isBroken ? (
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                        ) : (
                          <MapPin className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{bin.name}</h4>
                          {/* Status Badges */}
                          {bin.isFull && (
                            <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full font-medium border border-destructive/20">
                              FULL
                            </span>
                          )}
                          {bin.isBroken && (
                            <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-full font-medium border border-amber-500/20">
                              MAINTENANCE
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground mb-2">
                          {bin.address}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {bin.types.map((type) => {
                            const iconData = binTypeIcons[type];
                            if (!iconData) return null;
                            const IconComponent = iconData.icon;
                            return (
                              <span
                                key={type}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${iconData.color} bg-muted/50`}
                              >
                                <IconComponent className="h-3 w-3" />
                                {type}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        {userLocation && (
                          <span className="text-sm font-medium text-primary">
                            {getDistanceString(bin)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant={bin.isFull || bin.isBroken ? "outline" : "eco"}
                      size="sm"
                      className="w-full mt-3 gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        getDirections(bin);
                      }}
                      disabled={!userLocation || loadingDirections}
                    >
                      {loadingDirections && selectedBin?.id === bin.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Route className="h-4 w-4" />
                      )}
                      {bin.isFull || bin.isBroken ? "Get Directions Anyway" : "Get Directions"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Illustration */}
          <div className="mt-12 text-center animate-fade-in-up delay-400">
            <img
              src={binsIllustration}
              alt="Recycling bins"
              className="w-64 mx-auto opacity-80"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LocateBins;
