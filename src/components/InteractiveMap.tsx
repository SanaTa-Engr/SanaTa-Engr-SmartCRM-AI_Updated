import { useState, useEffect, useMemo, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Star,
  Phone,
  Globe,
  Plus,
  CheckCircle2,
  ExternalLink,
  Navigation,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Building2,
  Sparkles,
  ShieldCheck,
  Key,
  Copy,
  Check,
} from 'lucide-react';
import { MapLeadPlace } from '../types';
import { api } from '../api';

export interface InteractiveMapProps {
  places: MapLeadPlace[];
  selectedPlace: MapLeadPlace | null;
  onSelectPlace: (place: MapLeadPlace) => void;
  onAddLead: (place: MapLeadPlace) => void;
  savedPlaceIds: Set<string>;
  isSavingId: string | null;
  hoveredPlaceId?: string | null;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

// Inner helper component to handle map viewport panning and bounds fitting
function MapController({
  places,
  selectedPlace,
}: {
  places: MapLeadPlace[];
  selectedPlace: MapLeadPlace | null;
}) {
  const map = useMap();

  // Smoothly center on selected place
  useEffect(() => {
    if (!map || !selectedPlace?.location) return;
    map.panTo({
      lat: selectedPlace.location.latitude,
      lng: selectedPlace.location.longitude,
    });
    if ((map.getZoom() ?? 0) < 14) {
      map.setZoom(15);
    }
  }, [map, selectedPlace]);

  // Fit bounds when places list changes
  useEffect(() => {
    if (!map || places.length === 0) return;
    const validPlaces = places.filter(p => p.location?.latitude && p.location?.longitude);
    if (validPlaces.length === 0) return;

    if (validPlaces.length === 1 && validPlaces[0].location) {
      map.panTo({
        lat: validPlaces[0].location.latitude,
        lng: validPlaces[0].location.longitude,
      });
      map.setZoom(15);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    validPlaces.forEach(p => {
      if (p.location) {
        bounds.extend({ lat: p.location.latitude, lng: p.location.longitude });
      }
    });
    map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
  }, [map, places]);

  return null;
}

/**
 * Fallback Spatial Radar Map when Google Maps API Key is configured on the backend
 * or pending Vercel environment setup. Allows full navigation, clicking pins,
 * inspecting leads, and adding them to the CRM pipeline without exposing keys on GitHub.
 */
function SpatialFallbackMap({
  places,
  selectedPlace,
  onSelectPlace,
  onAddLead,
  savedPlaceIds,
  isSavingId,
  hoveredPlaceId,
  isFullscreen,
  onToggleFullscreen,
}: InteractiveMapProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [copiedKey, setCopiedKey] = useState(false);

  const validPlaces = useMemo(
    () => places.filter(p => p.location?.latitude && p.location?.longitude),
    [places]
  );

  // Compute lat/lng bounds
  const bounds = useMemo(() => {
    if (validPlaces.length === 0) {
      return { minLat: 37.75, maxLat: 37.8, minLng: -122.45, maxLng: -122.38 };
    }
    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity;
    validPlaces.forEach(p => {
      if (p.location) {
        minLat = Math.min(minLat, p.location.latitude);
        maxLat = Math.max(maxLat, p.location.latitude);
        minLng = Math.min(minLng, p.location.longitude);
        maxLng = Math.max(maxLng, p.location.longitude);
      }
    });
    const latSpan = Math.max(maxLat - minLat, 0.02);
    const lngSpan = Math.max(maxLng - minLng, 0.02);
    return {
      minLat: minLat - latSpan * 0.15,
      maxLat: maxLat + latSpan * 0.15,
      minLng: minLng - lngSpan * 0.15,
      maxLng: maxLng + lngSpan * 0.15,
    };
  }, [validPlaces]);

  return (
    <div className="relative w-full h-full min-h-[460px] bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex flex-col select-none">
      {/* Background Spatial Grid & Radar Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />
      
      {/* Decorative radar concentric rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="w-[300px] h-[300px] rounded-full border border-indigo-500/40" />
        <div className="absolute w-[540px] h-[540px] rounded-full border border-indigo-500/25" />
        <div className="absolute w-[780px] h-[780px] rounded-full border border-indigo-500/15" />
      </div>

      {/* Top Banner explaining safe server-side search and optional browser key */}
      <div className="relative z-10 m-3 px-3.5 py-2.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-indigo-500/30 shadow-md flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-white font-semibold">Private & Secure:</strong> Google Places leads are retrieved securely server-side. Basemap is rendering in spatial radar mode. To render live Google Maps tiles, optionally provide <code className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded font-mono text-[11px] font-bold">VITE_GOOGLE_MAPS_BROWSER_KEY</code> (restricted to Maps JavaScript API with HTTP referrers).
          </span>
        </div>
      </div>

      {/* Interactive Canvas Plane */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <div
          className="absolute inset-0 transition-transform duration-300 ease-out"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
          }}
        >
          {validPlaces.map(place => {
            if (!place.location) return null;
            const latRange = bounds.maxLat - bounds.minLat || 1;
            const lngRange = bounds.maxLng - bounds.minLng || 1;

            // Normalize coordinate to percentage
            const xPct = Math.max(5, Math.min(95, ((place.location.longitude - bounds.minLng) / lngRange) * 100));
            const yPct = Math.max(5, Math.min(95, (1 - (place.location.latitude - bounds.minLat) / latRange) * 100));

            const isSelected = selectedPlace?.id === place.id;
            const isHovered = hoveredPlaceId === place.id;
            const isSaved = savedPlaceIds.has(place.id) || place.isSavedAsLead;

            return (
              <div
                key={place.id}
                onClick={() => onSelectPlace(place)}
                className="absolute -translate-x-1/2 -translate-y-full cursor-pointer group z-10 transition-all hover:z-30"
                style={{ left: `${xPct}%`, top: `${yPct}%` }}
              >
                {/* Ping animation when selected */}
                {(isSelected || isHovered) && (
                  <div className="absolute -inset-2 rounded-full bg-indigo-500/40 animate-ping pointer-events-none" />
                )}

                {/* Marker Pin */}
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-full shadow-lg border transition-transform ${
                    isSelected
                      ? 'scale-110 bg-indigo-600 border-white text-white shadow-indigo-500/50'
                      : isSaved
                      ? 'bg-emerald-600 border-emerald-300 text-white'
                      : 'bg-slate-800/90 border-slate-600 text-slate-200 hover:bg-slate-700 hover:scale-105'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] font-bold truncate max-w-[110px]">{place.name}</span>
                  {place.rating && (
                    <span className="text-[10px] bg-black/30 px-1 rounded flex items-center gap-0.5">
                      ★ {place.rating}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Place Popover Drawer in Fallback Mode */}
        {selectedPlace && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-4 sm:right-auto sm:w-80 bg-slate-900/95 backdrop-blur-md rounded-xl p-3.5 border border-slate-700 text-white shadow-2xl z-20">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 border border-indigo-800/50 px-2 py-0.5 rounded">
                {selectedPlace.category || 'Business'}
              </span>
              {savedPlaceIds.has(selectedPlace.id) || selectedPlace.isSavedAsLead ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  In Pipeline
                </span>
              ) : selectedPlace.source === 'google_places' ? (
                <span className="text-[10px] font-bold text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800/50">
                  Google Places
                </span>
              ) : null}
            </div>

            <h4 className="font-bold text-sm text-slate-100">{selectedPlace.name}</h4>

            {selectedPlace.rating !== undefined && (
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <span className="text-amber-400 font-bold flex items-center gap-0.5">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {selectedPlace.rating.toFixed(1)}
                </span>
                {selectedPlace.userRatingCount !== undefined && (
                  <span className="text-slate-400 text-[11px]">
                    ({selectedPlace.userRatingCount.toLocaleString()} reviews)
                  </span>
                )}
              </div>
            )}

            {selectedPlace.formattedAddress && (
              <p className="text-[11px] text-slate-300 mt-1 flex items-start gap-1">
                <MapPin className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{selectedPlace.formattedAddress}</span>
              </p>
            )}

            {selectedPlace.phone ? (
              <p className="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                <a href={`tel:${selectedPlace.phone}`} className="text-indigo-400 hover:underline">
                  {selectedPlace.phone}
                </a>
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 italic">
                <Phone className="w-3 h-3 text-slate-600 shrink-0" />
                Phone unavailable
              </p>
            )}

            <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <a
                href={selectedPlace.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.name + ' ' + (selectedPlace.formattedAddress || ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Google Maps
              </a>

              {savedPlaceIds.has(selectedPlace.id) || selectedPlace.isSavedAsLead ? (
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                </span>
              ) : (
                <button
                  onClick={() => onAddLead(selectedPlace)}
                  disabled={isSavingId === selectedPlace.id}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isSavingId === selectedPlace.id ? 'Adding...' : 'Add to Pipeline'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Zoom & Navigation Controls */}
        <div className="absolute top-16 right-4 z-20 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 shadow-lg">
          <button
            onClick={() => setZoomLevel(z => Math.min(z + 0.25, 2.5))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(z => Math.max(z - 0.25, 0.75))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoomLevel(1);
              setPanOffset({ x: 0, y: 0 });
            }}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            title="Reset View"
          >
            <Navigation className="w-4 h-4" />
          </button>
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function InteractiveMap({
  places,
  selectedPlace,
  onSelectPlace,
  onAddLead,
  savedPlaceIds,
  isSavingId,
  hoveredPlaceId,
  isFullscreen = false,
  onToggleFullscreen,
}: InteractiveMapProps) {
  // Retrieve API key dynamically: checks client env, then queries backend /api/maps/config
  // Kept server-side and never hardcoded in source files or committed to GitHub!
  // Check solely for the optional client-side browser key.
  // The private server-side Google Maps key is NEVER exposed to or received by the browser.
  const browserKey =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_MAPS_BROWSER_KEY) || '';
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [infoWindowPlace, setInfoWindowPlace] = useState<MapLeadPlace | null>(null);

  // Sync selectedPlace with InfoWindow
  useEffect(() => {
    if (selectedPlace) {
      setInfoWindowPlace(selectedPlace);
    }
  }, [selectedPlace]);

  const validPlaces = places.filter(p => p.location?.latitude && p.location?.longitude);

  const defaultCenter =
    validPlaces.length > 0 && validPlaces[0].location
      ? { lat: validPlaces[0].location.latitude, lng: validPlaces[0].location.longitude }
      : { lat: 37.7749, lng: -122.4194 }; // San Francisco fallback

  // If no visual browser key is configured, display the high-fidelity interactive spatial fallback.
  // This keeps private server keys 100% secure while verified CRM lead discovery operates fully.
  if (!browserKey || browserKey.trim() === '' || browserKey === 'YOUR_DEMO_OR_TEST_KEY') {
    return (
      <SpatialFallbackMap
        places={places}
        selectedPlace={selectedPlace}
        onSelectPlace={onSelectPlace}
        onAddLead={onAddLead}
        savedPlaceIds={savedPlaceIds}
        isSavingId={isSavingId}
        hoveredPlaceId={hoveredPlaceId}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
      />
    );
  }

  return (
    <div className="relative w-full h-full min-h-[460px] bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex flex-col">
      <APIProvider apiKey={browserKey} libraries={['marker', 'places']}>
        <div className="relative w-full h-full flex-1">
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={defaultCenter}
            defaultZoom={13}
            mapTypeId={mapType}
            gestureHandling="greedy"
            disableDefaultUI={false}
            zoomControl={true}
            mapTypeControl={false}
            streetViewControl={true}
            fullscreenControl={false}
            className="w-full h-full"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          >
            <MapController places={places} selectedPlace={selectedPlace} />

            {/* Render Advanced Markers for each business location */}
            {validPlaces.map(place => {
              if (!place.location) return null;
              const isSaved = savedPlaceIds.has(place.id) || place.isSavedAsLead;
              const isSelected = selectedPlace?.id === place.id;
              const isHovered = hoveredPlaceId === place.id;

              return (
                <AdvancedMarker
                  key={place.id}
                  position={{
                    lat: place.location.latitude,
                    lng: place.location.longitude,
                  }}
                  title={place.name}
                  onClick={() => {
                    onSelectPlace(place);
                    setInfoWindowPlace(place);
                  }}
                  zIndex={isSelected ? 100 : isHovered ? 90 : 10}
                >
                  <div className="cursor-pointer group relative">
                    {/* Glowing highlight ring for selected or hovered pin */}
                    {(isSelected || isHovered) && (
                      <div className="absolute -inset-2 rounded-full bg-indigo-500/40 animate-ping pointer-events-none" />
                    )}

                    {isSaved ? (
                      <Pin
                        background="#059669"
                        borderColor="#047857"
                        glyphColor="#ffffff"
                        scale={isSelected ? 1.3 : 1.1}
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </Pin>
                    ) : (
                      <Pin
                        background={isSelected ? '#4f46e5' : '#2563eb'}
                        borderColor={isSelected ? '#312e81' : '#1d4ed8'}
                        glyphColor="#ffffff"
                        scale={isSelected ? 1.3 : 1.05}
                      >
                        <Building2 className="w-4 h-4 text-white" />
                      </Pin>
                    )}

                    {/* Compact Name Tag on Hover */}
                    <div
                      className={`absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-900/90 text-white text-[10px] font-semibold rounded shadow-md whitespace-nowrap pointer-events-none transition-opacity duration-150 ${
                        isSelected || isHovered ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {place.name}
                      {place.rating ? ` ★ ${place.rating}` : ''}
                    </div>
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* InfoWindow for selected place */}
            {infoWindowPlace && infoWindowPlace.location && (
              <InfoWindow
                position={{
                  lat: infoWindowPlace.location.latitude,
                  lng: infoWindowPlace.location.longitude,
                }}
                onCloseClick={() => setInfoWindowPlace(null)}
                maxWidth={320}
              >
                <div className="p-1 max-w-[280px] text-slate-800 font-sans">
                  {/* Category and saved status */}
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {infoWindowPlace.category || 'Business'}
                    </span>
                    {savedPlaceIds.has(infoWindowPlace.id) || infoWindowPlace.isSavedAsLead ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        In Pipeline
                      </span>
                    ) : infoWindowPlace.source === 'google_places' ? (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                        Google Places
                      </span>
                    ) : null}
                  </div>

                  {/* Business Name */}
                  <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                    {infoWindowPlace.name}
                  </h4>

                  {/* Rating & Reviews */}
                  {infoWindowPlace.rating !== undefined && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs">
                      <div className="flex items-center text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="font-bold text-slate-900 ml-1">
                          {infoWindowPlace.rating.toFixed(1)}
                        </span>
                      </div>
                      {infoWindowPlace.userRatingCount !== undefined && (
                        <span className="text-slate-500 text-[11px]">
                          ({infoWindowPlace.userRatingCount.toLocaleString()} reviews)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Address */}
                  {infoWindowPlace.formattedAddress && (
                    <p className="text-[11px] text-slate-600 mt-1.5 flex items-start gap-1 leading-tight">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span>{infoWindowPlace.formattedAddress}</span>
                    </p>
                  )}

                  {/* Phone */}
                  {infoWindowPlace.phone ? (
                    <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <a
                        href={`tel:${infoWindowPlace.phone}`}
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        {infoWindowPlace.phone}
                      </a>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 italic">
                      <Phone className="w-3 h-3 text-slate-300 shrink-0" />
                      Phone unavailable
                    </p>
                  )}

                  {/* Links and Actions */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px]">
                      {infoWindowPlace.websiteUri ? (
                        <a
                          href={infoWindowPlace.websiteUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold"
                        >
                          <Globe className="w-3 h-3" />
                          Website
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Website unavailable</span>
                      )}

                      <a
                        href={infoWindowPlace.googleMapsUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open in Google Maps
                      </a>
                    </div>

                    {/* Add to Pipeline CTA */}
                    {savedPlaceIds.has(infoWindowPlace.id) || infoWindowPlace.isSavedAsLead ? (
                      <div className="w-full py-1.5 px-3 bg-emerald-50 text-emerald-800 border border-emerald-200 text-center text-xs font-bold rounded-lg flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Saved in CRM Pipeline
                      </div>
                    ) : (
                      <button
                        onClick={() => onAddLead(infoWindowPlace)}
                        disabled={isSavingId === infoWindowPlace.id}
                        className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>
                          {isSavingId === infoWindowPlace.id ? 'Adding to Leads...' : 'Add to Leads Pipeline'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>

          {/* Floating Map Controls Overlay (Top Right) */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-white/95 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-slate-200">
            {/* Map Style Selector */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMapType('roadmap')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  mapType === 'roadmap'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Google Maps Standard Roadmap"
              >
                Map
              </button>
              <button
                onClick={() => setMapType('satellite')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  mapType === 'satellite'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Satellite Imagery"
              >
                Satellite
              </button>
              <button
                onClick={() => setMapType('terrain')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  mapType === 'terrain'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Terrain View"
              >
                Terrain
              </button>
            </div>

            {/* Fullscreen Toggle */}
            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className="w-full mt-1 pt-1 border-t border-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen Map' : 'Expand Map Fullscreen'}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Collapse</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Fullscreen</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Floating Map Attribution & Stats Badge (Bottom Left) */}
          <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-lg border border-slate-700/80 flex items-center gap-3 text-xs pointer-events-auto">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-slate-100">Google Maps Platform</span>
            </div>
            <div className="h-3 w-px bg-slate-700" />
            <span className="text-slate-300 font-medium">
              {validPlaces.length} {validPlaces.length === 1 ? 'place' : 'places'} on map
            </span>
            {selectedPlace && (
              <>
                <div className="h-3 w-px bg-slate-700" />
                <span className="text-indigo-300 font-bold truncate max-w-[140px]">
                  {selectedPlace.name}
                </span>
              </>
            )}
          </div>
        </div>
      </APIProvider>
    </div>
  );
}
