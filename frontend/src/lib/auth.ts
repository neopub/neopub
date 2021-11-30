import { bytes2hex } from "core/bytes";
import { getPrivateKeyJWK, getPublicKeyJWK } from "lib/storage";

export function isAuthenticated(): boolean {
  return getPublicKeyJWK() != null;
}

async function json2hex(json: string): Promise<string | undefined> {
  const key = await json2key(json, "ECDSA", []);
  if (!key) {
    return;
  }

  try {
    const raw = await crypto.subtle.exportKey("raw", key);
    const bytes = new Uint8Array(raw);
    return bytes2hex(bytes);
  } catch (e) {
    return undefined;
  }
}

export async function getPublicKeyHex(): Promise<string | undefined> {
  const json = getPublicKeyJWK();
  if (!json) {
    return;
  }

  return json2hex(json);
}

async function json2key(json: string, keyType: "ECDSA" | "ECDH", usages: KeyUsage[]): Promise<CryptoKey | undefined> {
  let jwk;
  try {
    jwk = JSON.parse(json);
  } catch {
    return undefined;
  }

  try {
    if (keyType === "ECDH") {
      jwk.key_ops = ["deriveKey"];
    }
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: keyType, namedCurve: "P-256" },
      true,
      usages,
    );
    return key;
  } catch (e) {
    console.log(e);
    return undefined;
  }
}

export async function getPublicKey(): Promise<CryptoKey | undefined> {
  const json = getPublicKeyJWK();
  if (!json) {
    return;
  }
  return json2key(json, "ECDSA", []);
}

export async function getPrivateKey(keyType: "ECDSA" | "ECDH"): Promise<CryptoKey | undefined> {
  const json = getPrivateKeyJWK();
  if (!json) {
    return;
  }
  const usage = keyType === "ECDSA" ? "sign" : "deriveKey";
  return json2key(json, keyType, [usage]);
}
