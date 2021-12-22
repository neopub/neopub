import fs from "fs";
import { bytes2hex, hex2bytes } from "./shared/core/bytes";
import nodeCrypto from "crypto";
import Net from "./shared/core/client/net";
import Crypto from "./shared/core/crypto";
import API from "./shared/core/client/api";
import { ITextPost } from "./shared/core/types";
import solvePoWChallenge from "./shared/core/challenge";
import PoW, { numHashBits } from "./shared/core/pow";
import { fetch } from "./lib";

const hostPrefix = "";

const crypto = nodeCrypto.webcrypto as any;

const npCrypto = new Crypto(crypto);
const net = new Net(hostPrefix, fetch, npCrypto, crypto);

async function yeet() {
  const id = await fs.promises.readFile("id.json");
  const json = id.toString();
  const creds = JSON.parse(json);
  // console.log(creds)

  const result = await loadFromJSON(json);
  if (result instanceof Error) {
    console.error("uh oh");
    return;
  }

  // console.log(result);

  const pubKeyJWK = JSON.stringify(creds.pubKey);
  const pubKeyHex = await json2hex(pubKeyJWK);
  // console.log(pubKeyHex);

  if (!pubKeyHex) {
    console.error("asdf");
    return;
  }

  const pubKey = result.idKeys.publicKey;
  if (!pubKey) {
    return;
  }
  const res = await net.getIndex(pubKeyHex, hostPrefix)
  if (!res || res === "notfound") {
    console.error("shit");
    return;
  }

  console.log(res)

  const api = new API(net, npCrypto);

  // Get token.
  const { chal, diff } = await api.getUserAuthChallenge(pubKey);

  const pow = new PoW(crypto);
  const solution = await pow.solve(chal, numHashBits - diff);

  if (!solution) {
    console.error("insoluble");
    return;
  }

  const privKey = result.idKeys.privateKey;
  if (!privKey) {
    return;
  }

  const token = await api.getSessionToken(
    privKey,
    pubKey,
    solution
  );


  // Publish post.
  const now = new Date();
  const text = "yeet";
  const post: ITextPost = {
    createdAt: now.toISOString(),
    type: "text",
    content: {
      text,
    },
  };

  const postKey = await npCrypto.genSymmetricKey();
  const [newIndex, postHash] = await api.publishPost(post, postKey, pubKeyHex, privKey, token);

  // Publish world key.
  await api.publishPostKey(postKey, postHash, result.worldKey, pubKeyHex, privKey, token);

  console.log(newIndex);
}

export interface ICreds {
  idKeys: CryptoKeyPair;
  stateKey: CryptoKey;
  worldKey: CryptoKey;
}

export async function loadFromJSON(json: string): Promise<ICreds | Error> {
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

yeet();
