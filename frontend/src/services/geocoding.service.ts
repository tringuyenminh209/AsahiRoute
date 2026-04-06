/**
 * Geocoding service using 国土地理院 (GSI) API
 * Free, no API key required, optimized for Japanese addresses
 * https://msearch.gsi.go.jp/address-search/AddressSearch
 */

export interface GeocodingResult {
  lat: number;
  lng: number;
  title: string;
}

/**
 * Normalize Japanese address for better geocoding accuracy:
 * - Convert full-width numbers to half-width
 * - Convert ２３−１４ → 23-14
 * - Strip 〒postal code prefix
 */
function normalizeAddress(address: string): string {
  return address
    .replace(/〒\d{3}-?\d{4}\s*/g, '')          // strip postal code
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))  // full→half width numbers
    .replace(/[−ー―]/g, '-')                      // normalize dashes
    .trim();
}

export async function geocodeAddress(address: string): Promise<GeocodingResult[]> {
  const normalized = normalizeAddress(address);
  if (!normalized) return [];

  const url = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(normalized)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('住所検索に失敗しました');

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return [];

  return data.slice(0, 5).map((item: any) => ({
    // GeoJSON coordinates are [lng, lat]
    lng: item.geometry.coordinates[0],
    lat: item.geometry.coordinates[1],
    title: item.properties.title,
  }));
}
