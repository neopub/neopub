import { buf2hex } from "../core/bytes";
import { ecdsaParams } from "../core/consts";
import PoW from "../core/pow";

declare let SESS_TOKEN_SEED: string;
export const SESS_TOKEN_SEED_BYTES = new TextEncoder().encode(SESS_TOKEN_SEED);

export async function checkSig(pubKey: ArrayBuffer, sig: ArrayBuffer, data: ArrayBuffer): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    pubKey,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"],
  );
  
  return await crypto.subtle.verify(
    ecdsaParams,
    key,
    sig,
    data,
  );
}

export async function checkTok(pubKeyBytes: Uint8Array, tokenHex: string): Promise<boolean> {
  const pow = new PoW(crypto);

  // TODO: use a timing-safe string comparison.
  const expectedToken = await pow.hash(pubKeyBytes, SESS_TOKEN_SEED_BYTES);
  const expectedTokenHex = buf2hex(expectedToken);
  return tokenHex !== expectedTokenHex;
}
