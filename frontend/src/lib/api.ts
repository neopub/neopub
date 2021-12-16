import { hex2bytes, concatArrayBuffers, buf2hex } from "core/bytes";
import Crypto from "lib/crypto";
import {
  TPost,
  IIndex,
  PostVisibility,
  IAuthChallenge,
  ISubReq,
} from "core/types";
import { getSubscriberPubKeyList } from "lib/storage";
import Net from "lib/net";
import DB from "./db";
import { sendMessage } from "models/message";

async function fetchAndDecryptPostWithOuterKey(
  posterPubKeyHex: string,
  outerKey: CryptoKey,
  encBuf: ArrayBuffer,
  postHash: Uint8Array,
): Promise<TPost | undefined> {
  const postKeyLocHex = await postKeyLocation(outerKey, postHash);
  const postKeyEncBytes = await Net.fetchPostKey(posterPubKeyHex, postKeyLocHex);
  if (!postKeyEncBytes) {
    return;
  }

  const postKeyHex = await Crypto.decryptString(postKeyEncBytes, outerKey);
  const postKeyBytes = hex2bytes(postKeyHex);
  if (!postKeyBytes) {
    return;
  }

  const decKey = await Crypto.importAESKey(postKeyBytes, ["decrypt"]);
  const postJson = await Crypto.decryptString(encBuf, decKey);
  const post = JSON.parse(postJson);
  return post;
}

async function fetchAndDecryptPostWithSubKey(
  privDH: CryptoKey,
  posterPubKeyHex: string,
  encBuf: ArrayBuffer,
  postHash: Uint8Array,
) {
  const pubECDH = await Crypto.hex2ECDHKey(posterPubKeyHex);
  if (!pubECDH) {
    return;
  }

  const outerKey = await Crypto.deriveDHKey(pubECDH, privDH, ["decrypt"]);

  return fetchAndDecryptPostWithOuterKey(
    posterPubKeyHex,
    outerKey,
    encBuf,
    postHash,
  );
}

async function fetchAndDecryptPost(
  posterPubKeyHex: string,
  worldKeyHex: string,
  encBuf: ArrayBuffer,
  postHash: Uint8Array,
) {
  const outerKeyBytes = hex2bytes(worldKeyHex);
  if (!outerKeyBytes) {
    return;
  }
  const outerKey = await Crypto.importAESKey(outerKeyBytes, ["decrypt"]);

  return fetchAndDecryptPostWithOuterKey(
    posterPubKeyHex,
    outerKey,
    encBuf,
    postHash,
  );
}

export async function fetchAndDecryptWorldOrSubPost(
  postHashHex: string,
  posterPubKeyHex: string,
  privDH: CryptoKey | undefined,
  worldKeyHex?: string,
): Promise<{ post: TPost, encBuf: ArrayBuffer } | undefined> {
  const postHash = hex2bytes(postHashHex);
  if (!postHash) {
    return;
  }

  const encBuf = await Net.fetchPost(posterPubKeyHex, postHashHex);
  if (!encBuf) {
    return;
  }

  // TODO: use world key or sub key as appropriate--not both.
  if (worldKeyHex) {
    const worldPost = await fetchAndDecryptPost(
      posterPubKeyHex,
      worldKeyHex,
      encBuf,
      postHash,
    );
    if (worldPost) {
      return { post: worldPost, encBuf };
    }
  }

  if (privDH) {
    const subPost = await fetchAndDecryptPostWithSubKey(
      privDH,
      posterPubKeyHex,
      encBuf,
      postHash,
    );
    if (subPost) {
      return { post: subPost, encBuf };
    }
  }
}

export async function publishPostAndKeys(
  post: TPost,
  worldKeyHex: string,
  privDH: CryptoKey,
  pubKey: string,
  privKey: CryptoKey,
  token: string,
  visibility: PostVisibility,
) {
  const postKey = await Crypto.genSymmetricKey();

  const [newIndex, postHash] = await publishPost(
    post,
    postKey,
    pubKey,
    privKey,
    token,
  );

  const postHashHex = buf2hex(postHash)
  DB.posts.add({ post, hash: postHashHex, publisherPubKey: pubKey }, postHashHex);

  if (visibility === "world") {
    await publishPostWorldKey(
      worldKeyHex,
      postKey,
      postHash,
      pubKey,
      privKey,
      token,
    );
  } else if (visibility === "subs") {
    const subs = await getSubscriberPubKeyList();
    const subPubKeys = subs.map(sub => sub.pubKey);

    // Encrypt post for self, to allow refetching from host, without local post cache (e.g. after re-login).
    const targetPubKeys = subPubKeys.concat(pubKey);

    const promises = targetPubKeys.map((subPubKey) =>
      publishPostSubKey(
        privDH,
        subPubKey,
        postKey,
        postHash,
        pubKey,
        privKey,
        token,
      ),
    );
    await Promise.all(promises);
  }

  return newIndex;
}

export async function publishPostWorldKey(
  worldKeyHex: string,
  postKey: CryptoKey,
  postHash: ArrayBuffer,
  pubKeyHex: string,
  privKey: CryptoKey,
  token: string,
) {
  const worldKeyBytes = hex2bytes(worldKeyHex);
  if (!worldKeyBytes) {
    return;
  }
  const worldKey = await Crypto.importAESKey(worldKeyBytes, ["encrypt"]);

  // TODO: cleanup.
  const keyLoc = await postKeyLocation(worldKey, postHash);
  await DB.postKeys.put({
    postHash: buf2hex(postHash),
    subPubKey: worldKeyHex,
    keyLoc,
  });

  await publishPostKey(postKey, postHash, worldKey, pubKeyHex, privKey, token);
}

export async function publishPostSubKey(
  privDH: CryptoKey,
  subPubKey: string,
  postKey: CryptoKey,
  postHash: ArrayBuffer,
  pubKey: string,
  privKey: CryptoKey,
  token: string,
) {
  const subDHPub = await Crypto.hex2ECDHKey(subPubKey);
  if (!subDHPub) {
    return;
  }

  const encDH = await Crypto.deriveDHKey(subDHPub, privDH, ["encrypt", "decrypt"]);

  // TODO: cleanup.
  const keyLoc = await postKeyLocation(encDH, postHash);
  await DB.postKeys.put({
    postHash: buf2hex(postHash),
    subPubKey,
    keyLoc,
  });

  await publishPostKey(postKey, postHash, encDH, pubKey, privKey, token);
}

export async function sendSubRequest(
  pubPubKeyHex: string,
  subPubKeyHex: string,
  msg: string,
  destHost: string,
  srcHost: string,
): Promise<void> {
  const message: ISubReq = {
    type: "subscribe",
    pubKey: subPubKeyHex,
    msg,
    host: srcHost,
  };

  return sendMessage(pubPubKeyHex, message, destHost);
}

export async function publishPost(
  post: TPost,
  postKey: CryptoKey,
  pubKey: string,
  privKey: CryptoKey,
  token: string,
): Promise<[IIndex, ArrayBuffer]> {
  const body = JSON.stringify(post);
  const ciphertext = await Crypto.encryptString(body, postKey);

  let index: IIndex = { posts: [], updatedAt: new Date().toISOString() };
  const idx = await Net.getIndex(pubKey);
  if (idx && idx !== "notfound") {
    index = idx;
  }

  // Compute content-based ID.
  const hash = await Crypto.sha(ciphertext);
  const hashHex = await buf2hex(hash);

  // Put post.
  await putFile(pubKey, `posts/${hashHex}`, privKey, token, ciphertext, "application/octet-stream");

  // Update index.
  index.posts.push({ id: hashHex });
  const indexEnc = new TextEncoder().encode(JSON.stringify(index));
  const indexSig = await Crypto.sign(privKey, indexEnc);
  const signedIndex = concatArrayBuffers(indexSig, indexEnc);
  // putFile already signs the file for the host to check. Redundant? Cleaner way?

  await putFile(pubKey, `index.json`, privKey, token, signedIndex, "application/json");

  return [index, hash];
}

export async function postKeyLocation(
  outerKey: CryptoKey,
  postHash: ArrayBuffer,
): Promise<string> {
  const encKeyBytes = await Crypto.key2buf(outerKey);
  const locBytes = await Crypto.sha(concatArrayBuffers(encKeyBytes, postHash)); // TODO: don't stick post hash on end of this... that makes it trivial to analyze number of distinct posts and people with access to each.
  const locHex = buf2hex(locBytes);
  return locHex;
}

export async function publishPostKey(
  postKey: CryptoKey,
  postHash: ArrayBuffer,
  encKey: CryptoKey,
  pubKey: string,
  privKey: CryptoKey,
  token: string,
): Promise<void> {
  const locHex = await postKeyLocation(encKey, postHash);

  const postKeyRaw = await Crypto.key2buf(postKey);
  const postKeyHex = buf2hex(postKeyRaw);
  const ciphertext = await Crypto.encryptString(postKeyHex, encKey);

  return putFile(pubKey, `keys/${locHex}`, privKey, token, ciphertext, "application/json");
}

export async function putFile(
  pubKeyHex: string,
  path: string,
  signPrivKey: CryptoKey,
  token: string,
  data: ArrayBuffer,
  contentType: "application/json" | "application/octet-stream",
): Promise<void> {
  // Sign.
  const sig = await Crypto.sign(signPrivKey, data);

  // Send.
  const location = Net.fileLoc(pubKeyHex, path);
  Net.putFile(location, pubKeyHex, token, data, sig, contentType)
}

export async function getUserAuthChallenge(
  publicKey: CryptoKey,
): Promise<IAuthChallenge> {
  const rawPubKey = await Crypto.key2buf(publicKey);
  const pubKeyHex = buf2hex(rawPubKey);
  const capDesc = {
    type: "user",
    pubKey: pubKeyHex,
  } as const;
  return Net.fetchAuthChallenge(capDesc);
}

export async function getMessageAuthChallenge(
  message: ArrayBuffer,
  host?: string,
): Promise<IAuthChallenge> {
  const hash = await Crypto.sha(message);
  const hashHex = buf2hex(hash);

  const capDesc = {
    type: "message",
    hash: hashHex,
    numBytes: message.byteLength,
  } as const;
  return Net.fetchAuthChallenge(capDesc, host);
}

export async function getSessionToken(
  privateKey: CryptoKey,
  publicKey: CryptoKey,
  solution: Uint8Array,
): Promise<string> {
  const pubKeyBuf = await Crypto.key2buf(publicKey);
  const sig = await Crypto.sign(privateKey, solution);
  return Net.fetchSessionToken(pubKeyBuf, sig, solution);
}
