import { bytes2hex } from "../bytes";

export async function json2hex(json: string, crypto: Crypto): Promise<string | undefined> {
  const key = await json2key(json, "ECDSA", [], crypto);
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

export async function json2key(json: string, keyType: "ECDSA" | "ECDH", usages: KeyUsage[], crypto: Crypto): Promise<CryptoKey | undefined> {
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