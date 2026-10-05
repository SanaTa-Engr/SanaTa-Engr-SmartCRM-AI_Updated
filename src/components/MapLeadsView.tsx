import { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapPin,
  Search,
  Star,
  Globe,
  Phone,
  CheckCircle2,
  ExternalLink,
  Plus,
  Loader2,
  AlertCircle,
  Building2,
  Sparkles,
  ArrowLeft,
  Info,
  Filter,
  SlidersHorizontal,
  Layers,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Lead, MapLeadPlace } from '../types';
import { api } from '../api';
import { InteractiveMap } from './InteractiveMap';

interface MapLeadsViewProps {
  existingLeads: Lead[];
  onLeadCreated: (lead: Lead) => void;
  onBackToLeads?: () => void;
}

const PRESET_KEYWORDS = [
  { label: 'Restaurants', query: 'restaurants' },
  { label: 'Cafes & Bakeries', query: 'cafes and bakeries' },
  { label: 'Software & Tech', query: 'software tech companies' },
  { label: 'Real Estate', query: 'real estate agencies' },
  { label: 'Dental & Clinics', query: 'dental clinics' },
  { label: 'Law Firms', query: 'law firms' },
  { label: 'Retail & Boutiques', query: 'retail boutiques' },
  { label: 'Fitness & Gyms', query: 'gyms and fitness' },
];

const PRESET_LOCATIONS = [
  'San Francisco, CA',
  'Austin, TX',
  'New York, NY',
  'Chicago, IL',
  'Miami, FL',
  'Seattle, WA',
];

export function MapLeadsView({
  existingLeads,
  onLeadCreated,
  onBackToLeads,
}: MapLeadsViewProps) {
  const [keyword, setKeyword] = useState('restaurants');
  const [location, setLocation] = useState('San Francisco, CA');
  const [places, setPlaces] = useState<MapLeadPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<MapLeadPlace | null>(null);
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSavingId, setIsSavingId] = useState<string | null>(null);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewLayout, setViewLayout] = useState<'split' | 'map' | 'list'>('split');

  // Filter States
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyUnsaved, setOnlyUnsaved] = useState(false);
  const [requirePhone, setRequirePhone] = useState(false);
  const [requireWebsite, setRequireWebsite] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'name'>('rating');

  const [apiConfig, setApiConfig] = useState<{
    configured: boolean;
    message?: string;
  } | null>(null);

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const cardListRef = useRef<HTMLDivElement>(null);

  // Compute set of saved place IDs and names for duplicate prevention
  const savedPlaceIds = useMemo(() => {
    const ids = new Set<string>();
    existingLeads.forEach(l => {
      if (l.mapsPlaceId) ids.add(l.mapsPlaceId);
    });
    return ids;
  }, [existingLeads]);

  const savedCompanyNames = useMemo(() => {
    const names = new Set<string>();
    existingLeads.forEach(l => {
      if (l.company) names.add(l.company.trim().toLowerCase());
    });
    return names;
  }, [existingLeads]);

  const isPlaceSaved = (place: MapLeadPlace): boolean => {
    if (place.id && savedPlaceIds.has(place.id)) return true;
    if (place.name && savedCompanyNames.has(place.name.trim().toLowerCase())) return true;
    return Boolean(place.isSavedAsLead);
  };

  // Check backend Google Maps API config on mount
  useEffect(() => {
    api.getMapsStatus()
      .then(res => {
        setApiConfig(res);
      })
      .catch(() => {
        setApiConfig({
          configured: false,
          message: 'Google Places search is not configured.',
        });
      });

    // Run initial search
    handleSearch('restaurants', 'San Francisco, CA');
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleSearch = async (kw?: string, loc?: string) => {
    const searchKw = (kw !== undefined ? kw : keyword).trim();
    const searchLoc = (loc !== undefined ? loc : location).trim();

    if (!searchKw && !searchLoc) {
      setErrorMessage('Please enter a business keyword or location to search.');
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);

    try {
      const response = await api.searchMapLeads(searchKw, searchLoc);

      if (response && response.success && Array.isArray(response.places)) {
        if (response.places.length > 0) {
          setPlaces(response.places);
          setSelectedPlace(response.places[0]);
          showToast(
            'success',
            `Found ${response.places.length} verified businesses matching "${searchKw}" in ${searchLoc || 'area'}`
          );
        } else {
          setPlaces([]);
          setSelectedPlace(null);
          const emptyMsg = response.error || 'No verified businesses were found for this search.';
          setErrorMessage(emptyMsg);
          showToast('info', emptyMsg);
        }
      } else {
        setPlaces([]);
        setSelectedPlace(null);
        const errorText = response?.error || 'Unable to retrieve verified Google Places results. Please try again.';
        setErrorMessage(errorText);
        showToast('error', errorText);
      }
    } catch (err: any) {
      setPlaces([]);
      setSelectedPlace(null);
      const msg = err.message || 'Unable to retrieve verified Google Places results. Please try again.';
      setErrorMessage(msg);
      showToast('error', msg);
    } finally {
      setIsSearching(false);
    }
  };

  // Convert place to lead
  const handleAddLeadFromPlace = async (place: MapLeadPlace) => {
    if (isPlaceSaved(place)) {
      showToast('info', `"${place.name}" is already in your leads pipeline.`);
      return;
    }

    setIsSavingId(place.id);
    try {
      const res = await api.createLeadFromMap(place);
      if (res && res.lead) {
        onLeadCreated(res.lead);
        // Mark as saved locally
        setPlaces(prev =>
          prev.map(p => (p.id === place.id ? { ...p, isSavedAsLead: true } : p))
        );
        showToast(
          'success',
          `Added "${place.name}" to your Leads Pipeline with AI Fit Score ${res.lead.score}!`
        );
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to add place to leads pipeline');
    } finally {
      setIsSavingId(null);
    }
  };

  // Bulk add all unsaved places in current filtered view
  const handleBulkAdd = async () => {
    const unsaved = filteredPlaces.filter(p => !isPlaceSaved(p));
    if (unsaved.length === 0) {
      showToast('info', 'All visible places are already in your pipeline.');
      return;
    }

    setIsBulkAdding(true);
    let addedCount = 0;

    for (const place of unsaved) {
      try {
        const res = await api.createLeadFromMap(place);
        if (res && res.lead) {
          onLeadCreated(res.lead);
          addedCount++;
        }
      } catch {
        // continue with next
      }
    }

    // Update places state
    setPlaces(prev =>
      prev.map(p => (unsaved.some(u => u.id === p.id) ? { ...p, isSavedAsLead: true } : p))
    );

    setIsBulkAdding(false);
    showToast('success', `Successfully added ${addedCount} new leads to your pipeline!`);
  };

  // Filtered and Sorted Places
  const filteredPlaces = useMemo(() => {
    return places
      .filter(p => {
        if (onlyUnsaved && isPlaceSaved(p)) return false;
        if (minRating > 0 && (!p.rating || p.rating < minRating)) return false;
        if (requirePhone && !p.phone) return false;
        if (requireWebsite && !p.websiteUri) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return (b.rating || 0) - (a.rating || 0);
        }
        if (sortBy === 'reviews') {
          return (b.userRatingCount || 0) - (a.userRatingCount || 0);
        }
        return a.name.localeCompare(b.name);
      });
  }, [places, onlyUnsaved, minRating, requirePhone, requireWebsite, sortBy, savedPlaceIds, savedCompanyNames]);

  const unsavedCount = useMemo(() => {
    return filteredPlaces.filter(p => !isPlaceSaved(p)).length;
  }, [filteredPlaces, savedPlaceIds, savedCompanyNames]);

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-md transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : notification.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-300'
              : 'bg-indigo-50 text-indigo-900 border-indigo-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600" />}
            {notification.type === 'info' && <Info className="w-4 h-4 text-indigo-600" />}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs text-slate-400 hover:text-slate-700 ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Controls Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBackToLeads && (
              <button
                onClick={onBackToLeads}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                title="Back to Pipeline Kanban View"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  <span>Google Maps Lead Discovery</span>
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Platform
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Explore real businesses, view interactive Google Maps pins, and add high-fit prospects directly into your pipeline with predictive AI scoring.
              </p>
            </div>
          </div>

          {/* Layout mode switcher */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewLayout('split')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  viewLayout === 'split' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setViewLayout('map')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  viewLayout === 'map' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Map Only
              </button>
              <button
                onClick={() => setViewLayout('list')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  viewLayout === 'list' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                List Only
              </button>
            </div>

            {onBackToLeads && (
              <button
                onClick={onBackToLeads}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Pipeline View</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar & Location Inputs */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSearch();
          }}
          className="grid grid-cols-1 md:grid-cols-12 gap-3"
        >
          {/* Keyword search input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="e.g. Restaurants, Software Companies, Dental Clinics..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
            />
          </div>

          {/* Location input */}
          <div className="md:col-span-4 relative">
            <MapPin className="w-4 h-4 text-rose-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="City, State, or Area (e.g. San Francisco, CA)"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
            />
          </div>

          {/* Search CTA */}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSearching}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Find Leads</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Preset Categories & Location Chips */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Popular Niches:
            </span>
            {PRESET_KEYWORDS.map(preset => (
              <button
                key={preset.query}
                onClick={() => {
                  setKeyword(preset.query);
                  handleSearch(preset.query, location);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  keyword.toLowerCase() === preset.query.toLowerCase()
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Target Markets:
            </span>
            {PRESET_LOCATIONS.map(city => (
              <button
                key={city}
                onClick={() => {
                  setLocation(city);
                  handleSearch(keyword, city);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  location.toLowerCase() === city.toLowerCase()
                    ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                📍 {city}
              </button>
            ))}
          </div>
        </div>

        {/* Filter and Sorting Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 bg-slate-50/70 p-3 rounded-xl">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Unsaved leads only toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={onlyUnsaved}
                onChange={e => setOnlyUnsaved(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span>Unsaved Only</span>
            </label>

            <div className="h-4 w-px bg-slate-300 hidden sm:block" />

            {/* Minimum Rating */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Rating:</span>
              <select
                value={minRating}
                onChange={e => setMinRating(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer focus:ring-1 focus:ring-indigo-500"
              >
                <option value={0}>All Ratings</option>
                <option value={4.0}>★ 4.0 & above</option>
                <option value={4.5}>★ 4.5 & above</option>
                <option value={4.8}>★ 4.8 & above</option>
              </select>
            </div>

            {/* Has Phone */}
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={requirePhone}
                onChange={e => setRequirePhone(e.target.checked)}
                className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span>Has Phone</span>
            </label>

            {/* Has Website */}
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={requireWebsite}
                onChange={e => setRequireWebsite(e.target.checked)}
                className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span>Has Website</span>
            </label>

            <div className="h-4 w-px bg-slate-300 hidden sm:block" />

            {/* Sort by */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer focus:ring-1 focus:ring-indigo-500"
              >
                <option value="rating">Top Rated</option>
                <option value="reviews">Most Reviews</option>
                <option value="name">Company Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Quick summary and Bulk Add CTA */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600 font-medium">
              Showing <strong className="text-slate-900">{filteredPlaces.length}</strong> places
              {unsavedCount > 0 && (
                <span className="text-indigo-600 font-bold ml-1">({unsavedCount} new)</span>
              )}
            </span>

            {unsavedCount > 0 && (
              <button
                onClick={handleBulkAdd}
                disabled={isBulkAdding}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Add all currently filtered unsaved businesses into CRM leads"
              >
                {isBulkAdding ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add All ({unsavedCount}) to Pipeline</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area: Split View, Map Only, or List Only */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Side: Business Leads List (Visible in 'split' and 'list' modes) */}
        {viewLayout !== 'map' && (
          <div
            className={`${
              viewLayout === 'split' ? 'lg:col-span-5' : 'lg:col-span-12'
            } flex flex-col space-y-3 max-h-[750px] overflow-y-auto pr-1`}
            ref={cardListRef}
          >
            {isSearching ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
                <p className="text-sm font-bold text-slate-800">
                  Querying Google Places API...
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Retrieving verified local business intelligence for "{keyword}" in {location}
                </p>
              </div>
            ) : filteredPlaces.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center">
                <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                <h3 className="text-sm font-bold text-slate-800">
                  {errorMessage || 'No verified businesses were found for this search.'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {errorMessage
                    ? 'Verify that Google Places API is configured in your server environment variables.'
                    : 'Try adjusting your search keywords, location query, or reset applied filters.'}
                </p>
                <button
                  onClick={() => {
                    setMinRating(0);
                    setOnlyUnsaved(false);
                    setRequirePhone(false);
                    setRequireWebsite(false);
                  }}
                  className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredPlaces.map(place => {
                const isSaved = isPlaceSaved(place);
                const isSelected = selectedPlace?.id === place.id;
                const isSaving = isSavingId === place.id;

                return (
                  <div
                    key={place.id}
                    onMouseEnter={() => setHoveredPlaceId(place.id)}
                    onMouseLeave={() => setHoveredPlaceId(null)}
                    onClick={() => setSelectedPlace(place)}
                    className={`bg-white p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 relative ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md bg-indigo-50/20'
                        : 'border-slate-200/90 shadow-2xs hover:border-indigo-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Header: Title, Category, Rating */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
                            {place.category || 'Local Business'}
                          </span>
                          {place.source === 'google_places' && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              Google Places
                            </span>
                          )}
                          {isSaved && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              In CRM
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-extrabold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                          {place.name}
                        </h3>
                      </div>

                      {/* Rating pill */}
                      {place.rating !== undefined ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-extrabold shrink-0 shadow-2xs">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{place.rating.toFixed(1)}</span>
                          {place.userRatingCount !== undefined && (
                            <span className="text-[10px] text-amber-700 font-normal">
                              ({place.userRatingCount.toLocaleString()})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic shrink-0">
                          Rating unavailable
                        </span>
                      )}
                    </div>

                    {/* Address with map pin */}
                    {place.formattedAddress && (
                      <p className="text-xs text-slate-600 flex items-start gap-1.5 leading-snug">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{place.formattedAddress}</span>
                      </p>
                    )}

                    {/* Contact row: Phone & Website */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 py-1">
                      {place.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <a
                            href={`tel:${place.phone}`}
                            onClick={e => e.stopPropagation()}
                            className="hover:text-indigo-600 hover:underline font-medium"
                          >
                            {place.phone}
                          </a>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-400 italic">
                          <Phone className="w-3 h-3 text-slate-300" />
                          Phone unavailable
                        </span>
                      )}

                      {place.websiteUri ? (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-400" />
                          <a
                            href={place.websiteUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-indigo-600 hover:underline font-medium"
                          >
                            Website
                          </a>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-400 italic">
                          <Globe className="w-3 h-3 text-slate-300" />
                          Website unavailable
                        </span>
                      )}

                      <a
                        href={place.googleMapsUri || (place.formattedAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.formattedAddress)}` : '#')}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-slate-500 hover:text-slate-800 ml-auto flex items-center gap-1 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Maps
                      </a>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                      <div className="text-[11px] text-slate-500">
                        {isSaved ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Active in Pipeline
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            Fit Score: <strong className="text-indigo-600">~{Math.min(95, Math.round(((place.rating || 4.0) * 16) + 15))}/100</strong>
                          </span>
                        )}
                      </div>

                      {isSaved ? (
                        <button
                          disabled
                          className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-default"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Saved Lead</span>
                        </button>
                      ) : (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleAddLeadFromPlace(place);
                          }}
                          disabled={isSaving}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Adding...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Convert to Lead</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Right Side: Google Maps Interactive View (Visible in 'split' and 'map' modes) */}
        {viewLayout !== 'list' && (
          <div
            className={`${
              viewLayout === 'split' ? 'lg:col-span-7' : 'lg:col-span-12'
            } h-[650px] lg:h-[750px] sticky top-4`}
          >
            <InteractiveMap
              places={filteredPlaces}
              selectedPlace={selectedPlace}
              onSelectPlace={place => {
                setSelectedPlace(place);
                // Also scroll card into view if in split mode
                const element = document.getElementById(`place-card-${place.id}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
              }}
              onAddLead={handleAddLeadFromPlace}
              savedPlaceIds={savedPlaceIds}
              isSavingId={isSavingId}
              hoveredPlaceId={hoveredPlaceId}
              isFullscreen={viewLayout === 'map'}
              onToggleFullscreen={() =>
                setViewLayout(prev => (prev === 'map' ? 'split' : 'map'))
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
