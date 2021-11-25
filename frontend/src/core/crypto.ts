import { concatArrayBuffers, hex2bytes } from "./bytes";

export async function genIDKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"],
  );
}

export async function deriveDHKey(
  publicKey: CryptoKey,
  privateKey: CryptoKey,
  usages: KeyUsage[],
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-CBC", length: 256 },
    true,
    usages,
  );
}

export async function pubECDSA2ECDH(pubKey: CryptoKey): Promise<CryptoKey> {
  // HACK: dump ECDSA pub key and load it as an ECDH pub key.
  // This is only used 1-way, for a subscriber to send a request to the pub key's owner.
  // Is this a problem?
  const dump = await crypto.subtle.exportKey("jwk", pubKey);
  return await crypto.subtle.importKey(
    "jwk",
    dump,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    [],
  );
}

export async function genECDHKeys(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"],
  );
}

export async function importAESKey(
  buf: ArrayBuffer,
  usages: KeyUsage[],
): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", buf, { name: "AES-CBC" }, true, usages);
}

export async function hex2ECDHKey(hex: string): Promise<CryptoKey | undefined> {
  const bytes = hex2bytes(hex);
  if (!bytes) {
    return;
  }
  return crypto.subtle.importKey(
    "raw",
    bytes,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    [],
  );
}

export async function hex2ECDSAKey(
  hex: string,
): Promise<CryptoKey | undefined> {
  const bytes = hex2bytes(hex);
  if (!bytes) {
    return;
  }
  return crypto.subtle.importKey(
    "raw",
    bytes,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"],
  );
}

export async function sign(
  ecdsaPrivKey: CryptoKey,
  bytes: ArrayBuffer,
): Promise<ArrayBuffer> {
  return crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    ecdsaPrivKey,
    bytes,
  );
}

export async function key2buf(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey("raw", key);
}

export async function sha(data: ArrayBuffer): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", data);
}

export async function genSymmetricKey(): Promise<CryptoKey> {
  // Generate a new key.
  const key = await window.crypto.subtle.generateKey(
    {
      name: "AES-CBC",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
  return key;
}

const numIvBytes = 16;

async function genIV(
  plaintext: ArrayBuffer,
  key: CryptoKey,
): Promise<ArrayBuffer> {
  const rawKey = await window.crypto.subtle.exportKey("raw", key);

  const combined = concatArrayBuffers(rawKey, plaintext);

  const sha = await window.crypto.subtle.digest("SHA-256", combined);
  const iv = sha.slice(0, numIvBytes);

  return iv;
}

export async function encryptString(
  data: string,
  key: CryptoKey,
): Promise<ArrayBuffer> {
  const plaintext = new TextEncoder().encode(data);
  const iv = await genIV(plaintext, key);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-CBC",
      iv,
    },
    key,
    plaintext,
  );

  const payload = concatArrayBuffers(iv, ciphertext);
  return payload;
}

export async function decryptString(
  payload: ArrayBuffer,
  key: CryptoKey,
): Promise<string> {
  const bytes = new Uint8Array(payload);
  const iv = bytes.slice(0, numIvBytes);
  const ciphertext = bytes.slice(numIvBytes);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-CBC",
      iv,
    },
    key,
    ciphertext,
  );

  const plaintext = new TextDecoder().decode(decrypted);

  return plaintext;
}
