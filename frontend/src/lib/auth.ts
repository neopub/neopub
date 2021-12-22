import { getPrivateKeyJWK, getPublicKeyJWK } from "lib/storage";
import { json2hex, json2key } from "core/client/lib";

export function isAuthenticated(): boolean {
  return getPublicKeyJWK() != null;
}

export async function getPublicKeyHex(): Promise<string | undefined> {
  const json = getPublicKeyJWK();
  if (!json) {
    return;
  }

  return json2hex(json, crypto);
}

export async function getPublicKey(): Promise<CryptoKey | undefined> {
  const json = getPublicKeyJWK();
  if (!json) {
    return;
  }
  return json2key(json, "ECDSA", [], crypto);
}

export async function getPrivateKey(keyType: "ECDSA" | "ECDH"): Promise<CryptoKey | undefined> {
  const json = getPrivateKeyJWK();
  if (!json) {
    return;
  }
  const usage = keyType === "ECDSA" ? "sign" : "deriveKey";
  return json2key(json, keyType, [usage], crypto);
}
