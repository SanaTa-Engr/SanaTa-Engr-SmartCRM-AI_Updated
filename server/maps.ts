import { MapLeadPlace, MapSearchResponse } from '../src/types';

/**
 * Access the Google Maps / Places API key strictly from server-side environment variables.
 * Never exposes or falls back to client variables in production.
 */
export function getGoogleMapsApiKey(): string | null {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key || key.trim() === '' || key === 'YOUR_DEMO_OR_TEST_KEY' || key === 'YOUR_KEY_IN_VERCEL_ENV_NOT_GIT') {
    return null;
  }
  return key.trim();
}

/**
 * Returns configuration status without leaking any part of the API key.
 */
export function getMapsConfigStatus(): { configured: boolean; message: string } {
  const isConfigured = Boolean(getGoogleMapsApiKey());
  return {
    configured: isConfigured,
    message: isConfigured
      ? 'Google Places API is configured.'
      : 'Google Places search is not configured.',
  };
}

/**
 * Executes a real Google Places Text Search (New) server-side.
 * Never generates fake/fallback leads.
 * Uses endpoint: POST https://places.googleapis.com/v1/places:searchText
 */
export async function searchGooglePlaces(
  keyword: string,
  location?: string
): Promise<MapSearchResponse> {
  const apiKey = getGoogleMapsApiKey();
  const cleanKeyword = (keyword || '').trim();
  const cleanLocation = (location || '').trim();

  // Validate search input
  if (!cleanKeyword && !cleanLocation) {
    return {
      success: false,
      source: 'google_places',
      places: [],
      query: cleanKeyword,
      location: cleanLocation,
      totalCount: 0,
      configured: Boolean(apiKey),
      error: 'Please enter a business keyword or location to search.',
    };
  }

  // Check if API key is configured
  if (!apiKey) {
    console.warn('[Google Places] GOOGLE_MAPS_API_KEY environment variable is not configured on the server.');
    return {
      success: false,
      source: 'google_places',
      places: [],
      query: cleanKeyword,
      location: cleanLocation,
      totalCount: 0,
      configured: false,
      error: 'Google Places search is not configured.',
    };
  }

  // Construct search query
  let textQuery = cleanKeyword;
  if (cleanKeyword && cleanLocation) {
    textQuery = `${cleanKeyword} in ${cleanLocation}`;
  } else if (cleanLocation) {
    textQuery = cleanLocation;
  }

  try {
    console.log(`[Google Places] Request started for query: "${textQuery}"`);

    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.internationalPhoneNumber,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.primaryType,places.primaryTypeDisplayName,places.businessStatus',
      },
      body: JSON.stringify({
        textQuery,
        pageSize: 20,
      }),
    });

    console.log(`[Google Places] HTTP status: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`[Google Places] API error response (status ${res.status}):`, errText.substring(0, 300));
      return {
        success: false,
        source: 'google_places',
        places: [],
        query: cleanKeyword,
        location: cleanLocation,
        totalCount: 0,
        configured: true,
        error: 'Unable to retrieve verified Google Places results. Please try again.',
      };
    }

    const data: any = await res.json();
    const rawPlaces = data.places || [];
    console.log(`[Google Places] Successfully returned ${rawPlaces.length} real businesses.`);

    if (rawPlaces.length === 0) {
      return {
        success: true,
        source: 'google_places',
        places: [],
        query: cleanKeyword,
        location: cleanLocation,
        totalCount: 0,
        configured: true,
        error: 'No verified businesses were found for this search.',
      };
    }

    const places: MapLeadPlace[] = rawPlaces.map((p: any) => {
      const name = p.displayName?.text || 'Business';
      const address = p.formattedAddress || '';
      const fallbackUrl = address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + address)}`
        : undefined;

      return {
        id: p.id || `place-${Math.random().toString(36).substring(2, 9)}`,
        name,
        formattedAddress: address,
        phone: p.internationalPhoneNumber || p.nationalPhoneNumber || undefined,
        websiteUri: p.websiteUri || undefined,
        rating: typeof p.rating === 'number' ? p.rating : undefined,
        userRatingCount: typeof p.userRatingCount === 'number' ? p.userRatingCount : undefined,
        googleMapsUri: p.googleMapsUri || fallbackUrl,
        category: p.primaryTypeDisplayName?.text || p.primaryType || cleanKeyword || 'Business',
        source: 'google_places',
        businessStatus: p.businessStatus || undefined,
        location: p.location
          ? {
              latitude: p.location.latitude,
              longitude: p.location.longitude,
            }
          : undefined,
      };
    });

    return {
      success: true,
      source: 'google_places',
      places,
      query: cleanKeyword,
      location: cleanLocation,
      totalCount: places.length,
      configured: true,
    };
  } catch (err: any) {
    console.error('[Google Places] Exception during request:', err.message);
    return {
      success: false,
      source: 'google_places',
      places: [],
      query: cleanKeyword,
      location: cleanLocation,
      totalCount: 0,
      configured: true,
      error: 'Unable to retrieve verified Google Places results. Please try again.',
    };
  }
}
