import { ECDSA_PUBKEY_BYTES, SOLUTION_BYTES } from "../shared/core/consts";
import { hex2bytes } from "../shared/core/bytes";
import { locationHeader, pubKeyHeader, sigHeader, subDhKey, tokenHeader } from "../shared/core/consts";
import Lib from "../shared/lib";
import { corsHeaders, handleOptions } from "./cors";

declare let KV: KVNamespace;
declare let SESS_TOKEN_SEED: string;
declare let POW_SEED: string;

const lib = new Lib(crypto, SESS_TOKEN_SEED, POW_SEED);

function success(body: BodyInit | null, headers: HeadersInit = {}): Response {
  return new Response(body, {
    headers: {
      ...corsHeaders,
      ...headers,
    },
    status: 200,
  });
}

async function auth(req: Request): Promise<Response> {
  const rawKey = await req.arrayBuffer();
  const keyBytes = new Uint8Array(rawKey);
  if (!keyBytes) {
    return new Response("Missing pubKey", { status: 400 });
  }

  const chal = await lib.genChal(keyBytes);
  return success(chal, {
    "Content-Type": "application/octet-stream",
    "Content-Length": `${chal.byteLength}`,
  });
}

async function chal(req: Request): Promise<Response> {
  const payload = await req.arrayBuffer();
  const rawKey = payload.slice(0, ECDSA_PUBKEY_BYTES);
  const keyBytes = new Uint8Array(rawKey);
  if (!keyBytes) {
    return new Response("Missing pubKey", { status: 400 });
  }

  const solution = payload.slice(ECDSA_PUBKEY_BYTES, ECDSA_PUBKEY_BYTES + SOLUTION_BYTES);
  const sig = payload.slice(ECDSA_PUBKEY_BYTES + SOLUTION_BYTES);

  // Check proof-of-work.
  const valid = await lib.checkPoW(keyBytes, solution)
  if (!valid) {
    return new Response("Invalid solution", { status: 400 });
  }

  // Verify signature of solution.
  const verified = await lib.checkSig(rawKey, sig, solution);
  if (!verified) {
    return new Response("Invalid signature", { status: 400 });
  }

  // Compute token.
  const tokenHex = await lib.genTok(keyBytes);

  return success(tokenHex, { "Content-Type": "text/plain" });
}

async function put(req: Request): Promise<Response> {
  // Parse public key.
  const pubKeyHex = req.headers.get(pubKeyHeader) ?? "";
  const pubKeyBytes = hex2bytes(pubKeyHex);
  if (!pubKeyBytes) {
    return new Response("Missing pubKey", { status: 400 });
  }
  
  // Check token.
  const tokenHex = req.headers.get(tokenHeader) ?? "";
  const tokenValid = await lib.checkTok(pubKeyBytes, tokenHex);
  if (!tokenValid) {
    return new Response(`Invalid token`, { status: 400 });
  }

  // Parse signature.
  const sigHex = req.headers.get(sigHeader) ?? "";
  const sigBytes = hex2bytes(sigHex);
  if (!sigBytes) {
    return new Response("Missing signature", { status: 400 });
  }

  // Check signature.
  const data = await req.arrayBuffer();
  const verified = await lib.checkSig(pubKeyBytes, sigBytes, data);
  if (!verified) {
    return new Response("Invalid signature", { status: 400 });
  }

  const loc = req.headers.get(locationHeader) ?? "";
  try {
    await KV.put(loc, data)
  } catch (e) {
    console.error(e);
    return new Response("Error writing data", { status: 500 });
  }

  return success(null, { "Content-Type": "text/plain" });
}

async function get(req: Request): Promise<Response> {
  const loc = req.headers.get(locationHeader);
  if (!loc) {
    return new Response("Invalid location", { status: 400 });
  }

  const data = await KV.get(loc, "stream");
  if (data === null) {
    return new Response("Not found", { status: 404, headers: corsHeaders })
  }

  return success(data, { "Content-Type": "text/plain" });
}

async function reqs(req: Request): Promise<Response> {
  // Parse public key.
  const pubKeyHex = req.headers.get(pubKeyHeader) ?? "";
  const pubKeyBytes = hex2bytes(pubKeyHex);
  if (!pubKeyBytes) {
    return new Response("Missing pubKey", { status: 400 });
  }

  // Check token.
  const tokenHex = req.headers.get(tokenHeader) ?? "";
  const tokenValid = await lib.checkTok(pubKeyBytes, tokenHex);
  if (!tokenValid) {
    return new Response(`Invalid token`, { status: 400 });
  }

  const prefix = `/users/${pubKeyHex}/reqs/`;
  try {
    const list = await KV.list({ prefix });
    const keys = list.keys.map(k => k.name.substr(prefix.length));
    return success(JSON.stringify(keys), { "Content-Type": "text/plain" });
  } catch (e) {
    console.error(e);
    return new Response("Error listing reqs", { status: 500 });
  }
}

async function sub(req: Request): Promise<Response> {
  // Parse public key.
  const pubKeyHex = req.headers.get(pubKeyHeader) ?? "";
  const pubKeyBytes = hex2bytes(pubKeyHex);
  if (!pubKeyBytes) {
    return new Response("Missing pubKey", { status: 400 });
  }

  const dhHex = req.headers.get(subDhKey);
  if (!dhHex) {
    return new Response(`Invalid DH key`, { status: 400 });
  }

  // NOTE: can't check signature, or server would know identity of subscriber.
  // But it could be signed with subscriber's DH pub key. Does that add anything?
  // Yes. Because sub's DH pub key is used as the path, someone could overwrite
  // a legitimate key if they knew the DH pub key to target. But it's ephemeral,
  // and transmitted over HTTPS, so that doesn't seem like a real risk.

  const reqData = await req.arrayBuffer();

  const loc = `/users/${pubKeyHex}/reqs/${dhHex}`;
  try {
    await KV.put(loc, reqData)
  } catch (e) {
    console.error(e);
    return new Response("Error writing data", { status: 500 });
  }
  
  return success(null, { "Content-Type": "text/plain" });
}

export async function handleRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    // Handle CORS preflight requests
    return handleOptions(request);
  }

  const url = new URL(request.url);
  switch (url.pathname) {
    case "/auth":
      return auth(request);
    case "/chal":
      return chal(request);
    case "/get":
      return get(request);
    case "/put":
      return put(request);
    case "/reqs":
      return reqs(request);
    case "/sub":
      return sub(request);
  }

  return new Response("Invalid route", { status: 404 })
}
