export function isLocalRuntime(hostname = globalThis.location?.hostname || '') {
  const normalizedHostname = hostname.toLowerCase();

  if (
    normalizedHostname === 'localhost' ||
    normalizedHostname === '0.0.0.0' ||
    normalizedHostname === '::1' ||
    normalizedHostname.endsWith('.localhost') ||
    normalizedHostname.startsWith('127.')
  ) {
    return true;
  }

  if (
    normalizedHostname.startsWith('10.') ||
    normalizedHostname.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalizedHostname)
  ) {
    return true;
  }

  return false;
}
