import PoW, { numHashBits } from "../core/pow";
import { ECDSA_PUBKEY_BYTES, POW_DIFF, SOLUTION_BYTES, ecdsaParams } from "../core/consts";
import { buf2hex, concatArrayBuffers, hex2bytes } from "../core/bytes";
import { locationHeader, pubKeyHeader, sigHeader, subDhKey, tokenHeader } from "../core/consts";

declare let SESS_TOKEN_SEED: string;
const SESS_TOKEN_SEED_BYTES = new TextEncoder().encode(SESS_TOKEN_SEED);

declare let POW_SEED: string;
const POW_SEED_BYTES = new TextEncoder().encode(POW_SEED);


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
}

async function auth(req: Request): Promise<Response> {
  const rawKey = await req.arrayBuffer();
  const keyBytes = new Uint8Array(rawKey);
  if (!keyBytes) {
    return new Response("Missing pubKey", { status: 400 });
  }

  const pow = new PoW(crypto);
  const chal = await pow.hash(keyBytes, POW_SEED_BYTES);

  const resBytes = concatArrayBuffers(chal, new Uint8Array([POW_DIFF]));
  return new Response(resBytes, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/octet-stream",
      "Content-Length": `${chal.byteLength + 1}`,
    },
    status: 200,
  })
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
  const pow = new PoW(crypto);
  const chal = await pow.hash(keyBytes, POW_SEED_BYTES);
  const hash = await pow.hash(new Uint8Array(solution), chal);

  const N = numHashBits - POW_DIFF;
  const valid = pow.lessThan2ToN(hash, N);
  if (!valid) {
    return new Response("Invalid solution", { status: 400 });
  }

  // Verify signature of solution.
  const pubKey = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"],
  );
  const verified = await crypto.subtle.verify(
    ecdsaParams,
    pubKey,
    sig,
    solution,
  );
  if (!verified) {
    return new Response("Invalid signature", { status: 400 });
  }

  // Compute token.
  const token = await pow.hash(keyBytes, SESS_TOKEN_SEED_BYTES);
  const tokenHex = buf2hex(token);

  // Return to client.
  return new Response(tokenHex, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/plain",
    },
    status: 200,
  })
}

declare let KV: KVNamespace;

async function put(req: Request): Promise<Response> {
  // Parse public key.
  const pubKeyHex = req.headers.get(pubKeyHeader) ?? "";
  const pubKeyBytes = hex2bytes(pubKeyHex);
  if (!pubKeyBytes) {
    return new Response("Missing pubKey", { status: 400 });
  }

  // Parse token.
  const tokenHex = req.headers.get(tokenHeader) ?? "";

  // Check token.
  const pow = new PoW(crypto);

  // TODO: use a timing-safe string comparison.
  const expectedToken = await pow.hash(pubKeyBytes, SESS_TOKEN_SEED_BYTES);
  const expectedTokenHex = buf2hex(expectedToken);
  if (tokenHex !== expectedTokenHex) {
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

  const pubKey = await crypto.subtle.importKey(
    "raw",
    pubKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"],
  );
  const verified = await crypto.subtle.verify(
    ecdsaParams,
    pubKey,
    sigBytes,
    data,
  );
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

  return new Response(tokenHex, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/plain",
    },
    status: 200,
  })
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

  return new Response(data, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/plain",
    },
    status: 200,
  })
}

async function reqs(req: Request): Promise<Response> {
  // Parse public key.
  const pubKeyHex = req.headers.get(pubKeyHeader) ?? "";
  const pubKeyBytes = hex2bytes(pubKeyHex);
  if (!pubKeyBytes) {
    return new Response("Missing pubKey", { status: 400 });
  }

  // Parse token.
  const tokenHex = req.headers.get(tokenHeader) ?? "";

  // Check token.
  const pow = new PoW(crypto);

  // TODO: use a timing-safe string comparison.
  const expectedToken = await pow.hash(pubKeyBytes, SESS_TOKEN_SEED_BYTES);
  const expectedTokenHex = buf2hex(expectedToken);
  if (tokenHex !== expectedTokenHex) {
    return new Response(`Invalid token`, { status: 400 });
  }

  const prefix = `/users/${pubKeyHex}/reqs/`;
  try {
    const list = await KV.list({ prefix });
    const keys = list.keys.map(k => k.name.substr(prefix.length));
    return new Response(JSON.stringify(keys), {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain",
      },
      status: 200,
    })
  } catch (e) {
    console.error(e);
    return new Response("Error listing reqs", { status: 500 });
  }

  return new Response(tokenHex, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/plain",
    },
    status: 200,
  })
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
  
  return new Response(null, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/plain",
    },
    status: 200,
  })
}

function handleOptions(request: Request): Response {
  const headers = request.headers;
  if (
    headers.get("Origin") !== null &&
    headers.get("Access-Control-Request-Method") !== null &&
    headers.get("Access-Control-Request-Headers") !== null
  ){
    const respHeaders = {
      ...corsHeaders,
      "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") ?? "",
    }

    return new Response(null, {
      headers: respHeaders,
    })
  }
  else {
    return new Response(null, {
      headers: {
        Allow: "GET, POST, OPTIONS",
      },
    })
  }
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
