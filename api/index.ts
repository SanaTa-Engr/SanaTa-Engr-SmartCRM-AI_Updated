import app from '../server';

export default function handler(req: any, res: any) {
  const incomingUrl = req.url || '';
  const queryString = incomingUrl.includes('?') ? incomingUrl.slice(incomingUrl.indexOf('?')) : '';

  // If req.url is already a specific api path (e.g. /api/maps/search?...)
  if (req.url && req.url.startsWith('/api/') && req.url.length > 5) {
    return app(req, res);
  }

  // Check headers for the real requested URI
  const candidates = [
    req.headers['x-forwarded-uri'],
    req.originalUrl,
    req.headers['x-vercel-matched-path'],
    req.headers['x-matched-path'],
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'string' && candidate.startsWith('/api/') && candidate.length > 5) {
      req.url = candidate.includes('?') ? candidate : candidate + queryString;
      return app(req, res);
    }
  }

  // If path starts with slash but missing /api prefix (e.g. /maps/search)
  if (req.url && !req.url.startsWith('/api') && req.url !== '/' && !req.url.startsWith('/?')) {
    req.url = '/api' + req.url;
  }

  return app(req, res);
}
