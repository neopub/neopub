export function hex2bytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0) {
    return null;
  }

  const numBytes = hex.length / 2;
  const bytes = new Uint8Array(numBytes);

  for (let b = 0; b < numBytes; b++) {
    const i = b * 2;
    const pair = hex.slice(i, i + 2);
    const x = parseInt(pair, 16);
    bytes[b] = x;
  }

  return bytes;
}

export function bytes2hex(bytes: Uint8Array): string {
  const hex: string[] = Array.from(bytes).map((b) => {
    const h = b.toString(16).toUpperCase();
    if (h.length < 2) {
      return `0${h}`;
    }
    return h;
  });

  return hex.join("");
}

export function buf2hex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  return bytes2hex(bytes);
}

export function concatArrayBuffers(
  buf1: ArrayBuffer,
  buf2: ArrayBuffer,
): ArrayBuffer {
  const buf1Bytes = new Uint8Array(buf1);
  const buf2Bytes = new Uint8Array(buf2);

  const combined = new Uint8Array(buf1Bytes.length + buf2Bytes.length);
  combined.set(buf1Bytes, 0);
  combined.set(buf2Bytes, buf1Bytes.length);

  return combined;
}
