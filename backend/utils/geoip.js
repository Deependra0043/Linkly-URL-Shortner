/**
 * Resolves country location data using upstream reverse proxy headers.
 * This stateless approach avoids packing massive, memory-heavy GeoIP binary databases 
 * into the application instance, which is standard for deployments on Vercel, Render, or AWS.
 */
const getCountryFromRequest = (req) => {
  // Check industry-standard reverse proxy country headers first
  const country =
    req.headers['cf-ipcountry'] ||          // Cloudflare
    req.headers['x-vercel-ip-country'] ||   // Vercel
    req.headers['x-appengine-country'] ||   // Google App Engine
    req.headers['x-country-code'];          // General custom proxies

  if (country && country !== 'XX') {
    return country.trim().toUpperCase();
  }

  // Fallback check for local development environments
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (ip === '::1' || ip === '127.0.0.1') {
    return 'Localhost';
  }

  return 'Unknown';
};

module.exports = { getCountryFromRequest };