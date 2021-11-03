import http from "http";
import { Buffer } from 'buffer';
import { hex2bytes } from "./shared/core/bytes";
import { ECDSA_PUBKEY_BYTES, SOLUTION_BYTES } from "./shared/core/consts";
import { locationHeader, pubKeyHeader, sigHeader, subDhKey, tokenHeader } from "./shared/core/consts";
import Lib from "./shared/lib";
import * as crypto from "crypto";
import fs from "fs";
import path from "path";

const { SESS_TOKEN_SEED, POW_SEED } = process.env;
if (!SESS_TOKEN_SEED || !POW_SEED) {
  console.log("Missing env var(s)");
  process.exit(1);
}

const lib = new Lib(crypto.webcrypto, SESS_TOKEN_SEED, POW_SEED);

const port = 8888;
const host = 'localhost';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
}

async function body2buf(req: http.IncomingMessage): Promise<Buffer> {
  const bufs = [];
  for await (const chunk of req) {
    bufs.push(chunk);
  }
  return Buffer.concat(bufs);
}

function success(body: any, headers: Record<string, string>, res: http.ServerResponse) {
  Object.entries({ ...corsHeaders, ...headers }).forEach(([h, v]) => {
    res.setHeader(h, v);
  })

  res.writeHead(200);
  if (body) {
    res.write(body);
  }
  res.end();
}

function failure(status: number, msg: string, res: http.ServerResponse) {
  Object.entries(corsHeaders).forEach(([h, v]) => {
    res.setHeader(h, v);
  })

  res.writeHead(status, msg);
  res.end();
}

async function auth(req: http.IncomingMessage, res: http.ServerResponse) {
  const rawKey = await body2buf(req);
  const keyBytes = new Uint8Array(rawKey);
  if (!keyBytes) {
    return failure(400, "Missing pubKey", res);
  }

  const chal = await lib.genChal(keyBytes);

  return success(chal, {
    "Content-Type": "application/octet-stream",
    "Content-Length": `${chal.byteLength}`,
  }, res);
}

async function chal(req: http.IncomingMessage, res: http.ServerResponse) {
  const payload = await body2buf(req);
  const rawKey = payload.slice(0, ECDSA_PUBKEY_BYTES);
  const keyBytes = new Uint8Array(rawKey);
  if (!keyBytes) {
    return failure(400, "Missing pubKey", res);
  }

  const solution = payload.slice(ECDSA_PUBKEY_BYTES, ECDSA_PUBKEY_BYTES + SOLUTION_BYTES);
  const sig = payload.slice(ECDSA_PUBKEY_BYTES + SOLUTION_BYTES);

  // Check proof-of-work.
  const valid = await lib.checkPoW(keyBytes, solution)
  if (!valid) {
    return failure(400, "Invalid solution", res);
  }

  // Verify signature of solution.
  const verified = await lib.checkSig(rawKey, sig, solution);
  if (!verified) {
    return failure(400, "Invalid signature", res);
  }

  // Compute token.
  const tokenHex = await lib.genTok(keyBytes);

  success(tokenHex, { "Content-Type": "text/plain" }, res);
}

async function put(req: http.IncomingMessage, res: http.ServerResponse) {
  // Parse public key.
  const pubKeyHex = (req.headers[pubKeyHeader] ?? "") as string;
  const pubKeyBytes = hex2bytes(pubKeyHex);
  if (!pubKeyBytes) {
    return failure(400, "Missing pubKey", res);
  }
  
  // Check token.
  const tokenHex = (req.headers[tokenHeader] ?? "") as string;
  const tokenValid = await lib.checkTok(pubKeyBytes, tokenHex);
  if (!tokenValid) {
    return failure(400, "Invalid token", res);
  }

  // Parse signature.
  const sigHex = (req.headers[sigHeader] ?? "") as string;
  const sigBytes = hex2bytes(sigHex);
  if (!sigBytes) {
    return failure(400, "Missing signature", res);
  }

  // Check signature.
  const data = await body2buf(req);
  const verified = await lib.checkSig(pubKeyBytes, sigBytes, data);
  if (!verified) {
    return failure(400, "Invalid signature", res);
  }

  const loc = (req.headers[locationHeader] ?? "") as string;
  try {
    const fullLoc = `public${loc}`;
    await fs.promises.mkdir(path.dirname(fullLoc), { recursive: true });
    await fs.promises.writeFile(fullLoc, data);
  } catch (e) {
    console.error(e);
    return failure(500, "Error writing data", res);
  }

  success(null, { "Content-Type": "text/plain" }, res);
}

async function get(req: http.IncomingMessage, res: http.ServerResponse) {
  const loc = req.headers[locationHeader] as string;
  if (!loc) {
    return failure(400, "Invalid location", res);
  }

  try {
    const data = await fs.promises.readFile(`public${loc}`);
    if (data === null) {
      return failure(404, "Not found", res);
    }

    success(data, { "Content-Type": "text/plain" }, res);
  } catch (e) {
    console.error(e);
    return failure(404, "Not found", res);
  }
}

async function reqs(req: http.IncomingMessage, res: http.ServerResponse) {
  // Parse public key.
  const pubKeyHex = (req.headers[pubKeyHeader] ?? "") as string;
  const pubKeyBytes = hex2bytes(pubKeyHex);
  if (!pubKeyBytes) {
    return failure(400, "Missing pubKey", res);
  }

  // Check token.
  const tokenHex = (req.headers[tokenHeader] ?? "") as string;
  const tokenValid = await lib.checkTok(pubKeyBytes, tokenHex);
  if (!tokenValid) {
    return failure(400, "Invalid token", res);
  }

  const prefix = `/users/${pubKeyHex}/reqs/`;
  try {
    const fullLoc = `public${prefix}`;
    const dirExists = fs.existsSync(fullLoc);
    if (!dirExists) {
      return success(JSON.stringify([]), { "Content-Type": "text/plain" }, res);
    }

    const keys = await fs.promises.readdir(fullLoc);
    success(JSON.stringify(keys), { "Content-Type": "text/plain" }, res);
  } catch (e) {
    console.error(e);
    return failure(500, "Error listing reqs", res);
  }
}

async function sub(req: http.IncomingMessage, res: http.ServerResponse) {
  // Parse public key.
  const pubKeyHex = (req.headers[pubKeyHeader] ?? "") as string;
  const pubKeyBytes = hex2bytes(pubKeyHex);
  if (!pubKeyBytes) {
    return failure(400, "Missing pubKey", res);
  }

  const dhHex = (req.headers[subDhKey]) as string;
  if (!dhHex) {
    return failure(400, "Invalid DH key", res);
  }

  // NOTE: can't check signature, or server would know identity of subscriber.
  // But it could be signed with subscriber's DH pub key. Does that add anything?
  // Yes. Because sub's DH pub key is used as the path, someone could overwrite
  // a legitimate key if they knew the DH pub key to target. But it's ephemeral,
  // and transmitted over HTTPS, so that doesn't seem like a real risk.

  const reqData = await body2buf(req);

  const loc = `/users/${pubKeyHex}/reqs/${dhHex}`;
  try {
    const fullLoc = `public${loc}`;
    await fs.promises.mkdir(path.dirname(fullLoc), { recursive: true });
    await fs.promises.writeFile(fullLoc, reqData);
  } catch (e) {
    console.error(e);
    return failure(500, "Error writing data", res);
  }
  
  success(null, { "Content-Type": "text/plain" }, res);
}

function handleOptions(req: http.IncomingMessage, res: http.ServerResponse) {
  if (
    host === "localhost" ||
    req.headers["Origin"] != null &&
    req.headers["Access-Control-Request-Method"] !== null &&
    req.headers["Access-Control-Request-Headers"] !== null
  ){
    Object.entries(corsHeaders).forEach(([h, v]) => {
      res.setHeader(h, v);
    })

    res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] ?? "");
  } else {
    res.setHeader("Allow", "GET, POST, OPTIONS");
  }

  res.writeHead(200);
  res.end();
}

const server = http.createServer(async (req, res) => {
  console.log(req.method, req.url);
  
  if (req.method === "OPTIONS") {
    // Handle CORS preflight requests
    return handleOptions(req, res);
  }

  switch (req.url) {
    case "/auth":
      return auth(req, res);
    case "/chal":
      return chal(req, res);
    case "/get":
      return get(req, res);
    case "/put":
      return put(req, res);
    case "/reqs":
      return reqs(req, res);
    case "/sub":
      return sub(req, res);
  }

  res.writeHead(404, "Invalid route");
})

server.listen(port, host, () => {
  console.log(`listening on http://${host}:${port}...`);
});
