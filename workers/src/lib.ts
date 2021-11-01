import { ecdsaParams } from "../core/consts";

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