import { buf2hex, concatArrayBuffers } from "../core/bytes";
import { ecdsaParams, POW_DIFF } from "../core/consts";
import PoW, { numHashBits } from "../core/pow";

declare let SESS_TOKEN_SEED: string;
export const SESS_TOKEN_SEED_BYTES = new TextEncoder().encode(SESS_TOKEN_SEED);

declare let POW_SEED: string;
export const POW_SEED_BYTES = new TextEncoder().encode(POW_SEED);

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
  return tokenHex === expectedTokenHex;
}

export async function checkPoW(keyBytes: Uint8Array, solution: ArrayBuffer): Promise<boolean> {
  const pow = new PoW(crypto);
  const chal = await pow.hash(keyBytes, POW_SEED_BYTES);
  const hash = await pow.hash(new Uint8Array(solution), chal);

  const N = numHashBits - POW_DIFF;
  return pow.lessThan2ToN(hash, N);
}

export async function genTok(keyBytes: Uint8Array): Promise<string> {
  const pow = new PoW(crypto);
  const token = await pow.hash(keyBytes, SESS_TOKEN_SEED_BYTES);
  const hex = buf2hex(token);
  return hex;
}

export async function genChal(keyBytes: Uint8Array): Promise<ArrayBuffer> {
  const pow = new PoW(crypto);
  const chal = await pow.hash(keyBytes, POW_SEED_BYTES);

  return concatArrayBuffers(chal, new Uint8Array([POW_DIFF]));
}