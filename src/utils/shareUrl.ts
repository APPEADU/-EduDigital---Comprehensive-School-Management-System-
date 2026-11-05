export function getPublicShareOrigin(): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  if (origin.startsWith('https://ais-dev-')) {
    return origin.replace('https://ais-dev-', 'https://ais-pre-');
  }
  return origin;
}

export function buildPublicShareUrl(queryOrHash = ''): string {
  const origin = getPublicShareOrigin();
  const pathname = typeof window !== 'undefined' ? window.location.pathname || '/' : '/';
  if (!queryOrHash) {
    return `${origin}${pathname}`;
  }
  if (queryOrHash.startsWith('?') || queryOrHash.startsWith('#')) {
    return `${origin}${pathname}${queryOrHash}`;
  }
  return `${origin}/${queryOrHash.replace(/^\/+/, '')}`;
}
