import { hex2bytes } from "../bytes";

export interface ICreds {
  idKeys: CryptoKeyPair;
  stateKey: CryptoKey;
  worldKey: CryptoKey;
}

export async function loadFromJSON(json: string, crypto: Crypto): Promise<ICreds | Error> {
  try {
    const id = JSON.parse(json);

    const publicKey = await crypto.subtle.importKey("jwk", id.pubKey, { name: "ECDSA", namedCurve: "P-256" }, true, ["verify"]);
    const privateKey = await crypto.subtle.importKey("jwk", id.privKey, { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);

    const idKeys = { publicKey, privateKey };

    const worldKeyBufResult = hex2bytes(id.worldKey);
    if (worldKeyBufResult == null) {
      return new Error("Parsing world key");
    }
    const worldKey = await crypto.subtle.importKey("raw", worldKeyBufResult, { name: "AES-CBC", length: 256 }, true, ["encrypt", "decrypt"]);

    const stateKeyBufResult = hex2bytes(id.stateKey);
    if (stateKeyBufResult == null) {
      return new Error("Parsing state key");
    }
    const stateKey = await crypto.subtle.importKey("raw", stateKeyBufResult, { name: "AES-CBC", length: 256 }, false, ["encrypt", "decrypt"]);

    return { idKeys, stateKey, worldKey };
  } catch (e) {
    console.error(e)
    return new Error("dunno");
  }
}