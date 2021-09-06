import { useEffect, useState } from "react";
import { bytes2hex } from "core/bytes";
import { getPrivateKeyJWK, getPublicKeyJWK, setIDKeys, setToken, setWorldKey } from "lib/storage";
import solvePoWChallenge from "core/challenge";
import { getAuthChallenge, getSessionToken } from "./api";

export function isAuthenticated(): boolean {
  return getPublicKeyJWK() != null;
}

export async function getToken(pubKey: CryptoKey, privKey: CryptoKey, setStatus: (status: string) => void) {
  setStatus("Initiating challenge...");
  const { chal, diff } = await getAuthChallenge(pubKey);

  setStatus("Searching for solution...");
  const solution = await solvePoWChallenge(chal, diff);
  if (!solution) {
    setStatus("No solution found.");
    return;
  }
  setStatus("Found solution.");

  const token = await getSessionToken(
    privKey,
    pubKey,
    solution,
  );
  setStatus(`Got access token.`);

  return token;
}

export async function storeCredentials(idKeys: CryptoKeyPair, token: string, worldKey: CryptoKey) {
  setToken(token);
  await setIDKeys(idKeys);
  await setWorldKey(worldKey);
}

export function usePublicKeyHex(): string | undefined {
  const [bytes, setBytes] = useState<string>();

  useEffect(() => {
    async function json2bytes(json: string): Promise<string | undefined> {
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

    const json = getPublicKeyJWK();
    if (json) {
      json2bytes(json).then((bytes) => setBytes(bytes));
    }
  }, []);

  return bytes;
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

export function usePublicKey(): CryptoKey | undefined {
  const [key, setKey] = useState<CryptoKey>();

  useEffect(() => {
    const json = getPublicKeyJWK();
    if (json) {
      json2key(json, "ECDSA", []).then((key) => setKey(key));
    }
  }, []);

  return key;
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
