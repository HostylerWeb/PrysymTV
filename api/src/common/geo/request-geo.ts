import { Request } from 'express';
import geoip from 'geoip-lite';

export type RequestGeo = {
  city: string | null;
  region: string | null;
  regionName: string | null;
  countryCode: string | null;
  label: string;
};

const US_STATES: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'District of Columbia',
};

function isPrivateIp(ip: string): boolean {
  const normalized = ip.replace(/^::ffff:/, '');
  if (normalized === '127.0.0.1' || normalized === '::1') return true;
  if (normalized.startsWith('10.')) return true;
  if (normalized.startsWith('192.168.')) return true;
  const parts = normalized.split('.').map(Number);
  if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
    return true;
  }
  return false;
}

function clientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    const ip = forwarded.split(',')[0]?.trim();
    if (ip) return ip;
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim();
  return req.ip ?? req.socket?.remoteAddress ?? null;
}

function expandRegion(
  countryCode: string | null,
  region: string | null,
): string | null {
  if (!region) return null;
  const code = region.toUpperCase();
  if (countryCode === 'US' && US_STATES[code]) return US_STATES[code];
  return region;
}

function buildGeo(
  city: string | null,
  regionCode: string | null,
  countryCode: string | null,
  regionNameOverride?: string | null,
): RequestGeo {
  const regionName =
    regionNameOverride ?? expandRegion(countryCode, regionCode);
  let label = 'Unknown location';
  if (city && regionName) label = `${city}, ${regionName}`;
  else if (city) label = city;
  else if (regionName) label = regionName;
  else if (countryCode) label = countryCode;

  return {
    city,
    region: regionCode,
    regionName,
    countryCode,
    label,
  };
}

export function resolveRequestGeo(
  req: Request,
  headerCountry?: string,
): RequestGeo {
  const cfCity = req.headers['cf-ipcity'];
  const cfRegion = req.headers['cf-region'];
  const cfCountry = req.headers['cf-ipcountry'];

  if (typeof cfCity === 'string' || typeof cfRegion === 'string') {
    const countryCode = (
      typeof cfCountry === 'string' ? cfCountry : headerCountry
    )
      ?.toUpperCase()
      .slice(0, 2) ?? null;
    const city = typeof cfCity === 'string' ? cfCity : null;
    const regionName = typeof cfRegion === 'string' ? cfRegion : null;
    const regionCode =
      countryCode === 'US' && regionName
        ? (Object.entries(US_STATES).find(([, name]) => name === regionName)?.[0] ??
          null)
        : null;
    return buildGeo(city, regionCode, countryCode, regionName);
  }

  const ip = clientIp(req);
  if (ip && !isPrivateIp(ip)) {
    const lookup = geoip.lookup(ip);
    if (lookup) {
      const countryCode =
        lookup.country ?? headerCountry?.toUpperCase().slice(0, 2) ?? null;
      return buildGeo(
        lookup.city ?? null,
        lookup.region ?? null,
        countryCode,
      );
    }
  }

  if (headerCountry) {
    const countryCode = headerCountry.toUpperCase().slice(0, 2);
    return buildGeo(null, null, countryCode);
  }

  return buildGeo(null, null, null);
}

export type ViewerGeoHint = {
  city?: string | null;
  region?: string | null;
  regionName?: string | null;
  countryCode?: string | null;
};

export function geoFromClientHint(hint: ViewerGeoHint): RequestGeo | null {
  const countryCode = hint.countryCode?.toUpperCase().slice(0, 2) ?? null;
  const city = hint.city?.trim() || null;
  const region = hint.region?.trim() || null;
  const regionName = hint.regionName?.trim() || null;
  const geo = buildGeo(city, region, countryCode, regionName || undefined);
  return geo.label === 'Unknown location' ? null : geo;
}

export function geoFromMetadata(
  metadata: unknown,
): RequestGeo | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const location = (metadata as { location?: RequestGeo }).location;
  if (!location?.label) return null;
  return location;
}
