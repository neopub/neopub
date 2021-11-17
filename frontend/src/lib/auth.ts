import { useEffect, useState } from "react";
import { bytes2hex } from "core/bytes";
import { getPrivateKeyJWK, getPublicKeyJWK, setIDKeys, setStateKey, setToken, setWorldKey } from "lib/storage";

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

export async function storeCredentials(idKeys: CryptoKeyPair, token: string, worldKey: CryptoKey, stateKey: CryptoKey) {
  setToken(token);
  await setIDKeys(idKeys);
  await setWorldKey(worldKey);
  await setStateKey(stateKey);
}

export function usePublicKeyHex(): { hex?: string, loading: boolean } {
  const [state, setState] = useState<{ hex?: string, loading: boolean}>({ hex: undefined, loading: true })

  useEffect(() => {
    const json = getPublicKeyJWK();
    if (json) {
      json2hex(json).then((hex) => setState({ hex, loading: false }));
    } else {
      setState({ hex: undefined, loading: false })
    }
  }, []);

  return state;
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

export function usePrivateKey(
  keyType: "ECDSA" | "ECDH",
): CryptoKey | undefined {
  const [key, setKey] = useState<CryptoKey>();

  useEffect(() => {
    const usage = keyType === "ECDSA" ? "sign" : "deriveKey";
    const json = getPrivateKeyJWK();
    if (json) {
      json2key(json, keyType, [usage]).then((key) => setKey(key));
    }
  }, [keyType]);

  return key;
}
