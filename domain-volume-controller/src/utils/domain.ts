/**
 * Domain utility functions
 */

/**
 * Extract domain from URL
 * @param url - Full URL string
 * @returns Domain name (hostname) or empty string if invalid
 */
export function extractDomain(url: string): string {
  if (!url) {
    return '';
  }

  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return '';
  }
}

/**
 * Normalize domain by converting to lowercase and removing www prefix
 * @param domain - Domain name
 * @returns Normalized domain name
 */
export function normalizeDomain(domain: string): string {
  if (!domain) {
    return '';
  }

  let normalized = domain.toLowerCase();

  // Remove www prefix (only at the beginning)
  if (normalized.startsWith('www.')) {
    normalized = normalized.substring(4);
  }

  return normalized;
}
