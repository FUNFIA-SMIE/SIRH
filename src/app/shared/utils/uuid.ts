export function uuidv4(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
      return (crypto as any).randomUUID();
    }
  } catch (e) {
    // ignore and fallback
  }

  // Fallback implementation using getRandomValues (RFC4122 v4)
  const getRandomValues = (typeof crypto !== 'undefined' && (crypto as any).getRandomValues)
    ? (n: Uint8Array) => (crypto as any).getRandomValues(n)
    : (n: Uint8Array) => {
      for (let i = 0; i < n.length; i++) n[i] = Math.floor(Math.random() * 256);
      return n;
    };

  const rnds = new Uint8Array(16);
  getRandomValues(rnds);

  // Per RFC4122 v4
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  const byteToHex: string[] = [];
  for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 0x100).toString(16).substr(1));
  }

  return (
    byteToHex[rnds[0]] + byteToHex[rnds[1]] + byteToHex[rnds[2]] + byteToHex[rnds[3]] + '-' +
    byteToHex[rnds[4]] + byteToHex[rnds[5]] + '-' +
    byteToHex[rnds[6]] + byteToHex[rnds[7]] + '-' +
    byteToHex[rnds[8]] + byteToHex[rnds[9]] + '-' +
    byteToHex[rnds[10]] + byteToHex[rnds[11]] + byteToHex[rnds[12]] + byteToHex[rnds[13]] + byteToHex[rnds[14]] + byteToHex[rnds[15]]
  );
}

export default uuidv4;
