import fs from "fs";
import nodeCrypto from "crypto";
import Net from "./shared/core/client/net";
import Crypto from "./shared/core/crypto";
import API from "./shared/core/client/api";
import { ITextPost } from "./shared/core/types";
import PoW, { numHashBits } from "./shared/core/pow";
import { fetch } from "./lib";
import { json2hex } from "./shared/core/client/lib";
import { loadFromJSON } from "./shared/core/client/creds";

const crypto = nodeCrypto.webcrypto as any;
const npCrypto = new Crypto(crypto);
const hostPrefix = "";
const net = new Net(hostPrefix, fetch, npCrypto);

async function yeet(text: string) {
  const id = await fs.promises.readFile("id.json");
  const json = id.toString();
  const creds = JSON.parse(json);

  const result = await loadFromJSON(json, crypto);
  if (result instanceof Error) {
    console.error("uh oh");
    return;
  }

  const pubKeyJWK = JSON.stringify(creds.pubKey);
  const pubKeyHex = await json2hex(pubKeyJWK, crypto);

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
}

let chunks: string[] = [];

process.stdin.on('readable', () => {
  let chunk: string;
  while (chunk = process.stdin.read()) {
    chunks.push(chunk);
  }
});

process.stdin.on('end', () => {
  const input = chunks.join();
  yeet(input);
});
