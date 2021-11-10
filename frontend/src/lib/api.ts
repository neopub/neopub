import { hex2bytes, concatArrayBuffers, buf2hex } from "core/bytes";
import {
  decryptString,
  deriveDHKey,
  encryptString,
  genECDHKeys,
  genSymmetricKey,
  hex2ECDHKey,
  hex2ECDSAKey,
  importAESKey,
  key2buf,
  pubECDSA2ECDH,
  sha,
  sign,
} from "core/crypto";
import {
  TPost,
  IIndex,
  PostVisibility,
  IReq,
  IAuthChallenge,
  ISubReq,
  IProfile,
  IReply,
} from "core/types";
import { getSubscriberPubKeyList } from "lib/storage";
import * as Net from "lib/net";
import DB from "./db";

// TODO: just switch sub reqs to using this.
export async function unwrapInboxItem(
  id: string,
  pubKeyHex: string,
  privKey: CryptoKey,
): Promise<any | undefined> {
  const ephemDHPub = await hex2ECDHKey(id);
  if (!ephemDHPub) {
    return;
  }

  const ephemDH = await deriveDHKey(ephemDHPub, privKey, ["decrypt"]);

  const enc = await Net.fetchInboxItem(pubKeyHex, id);
  if (!enc) {
    return;
  }
  const decJson = await decryptString(enc, ephemDH);
  const req = JSON.parse(decJson) as IReq;

  return req;
}

export async function unwrapReq(
  reqName: string,
  pubKeyHex: string,
  privKey: CryptoKey,
): Promise<IReq | undefined> {
  const ephemDHPub = await hex2ECDHKey(reqName);
  if (!ephemDHPub) {
    return;
  }

  const ephemDH = await deriveDHKey(ephemDHPub, privKey, ["decrypt"]);

  const enc = await Net.fetchSubReq(pubKeyHex, reqName);
  if (!enc) {
    return;
  }
  const decJson = await decryptString(enc, ephemDH);
  const req = JSON.parse(decJson) as IReq;

  return req;
}

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

  const postKeyHex = await decryptString(postKeyEncBytes, outerKey);
  const postKeyBytes = hex2bytes(postKeyHex);
  if (!postKeyBytes) {
    return;
  }

  const decKey = await importAESKey(postKeyBytes, ["decrypt"]);
  const postJson = await decryptString(encBuf, decKey);
  const post = JSON.parse(postJson);
  return post;
}

async function fetchAndDecryptPostWithSubKey(
  privDH: CryptoKey,
  posterPubKeyHex: string,
  encBuf: ArrayBuffer,
  postHash: Uint8Array,
) {
  const pubECDH = await hex2ECDHKey(posterPubKeyHex);
  if (!pubECDH) {
    return;
  }

  const outerKey = await deriveDHKey(pubECDH, privDH, ["decrypt"]);

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
  const outerKey = await importAESKey(outerKeyBytes, ["decrypt"]);

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
  const postKey = await genSymmetricKey();

  const [newIndex, postHash] = await publishPost(
    post,
    postKey,
    pubKey,
    privKey,
    token,
  );

  const postHashHex = buf2hex(postHash)
  DB.posts.add({ post, hash: postHashHex }, [postHash]);

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
    const subs = getSubscriberPubKeyList();
    const subPubKeys = Object.keys(subs);

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
  const worldKey = await importAESKey(worldKeyBytes, ["encrypt"]);

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
  const subDHPub = await hex2ECDHKey(subPubKey);
  if (!subDHPub) {
    return;
  }

  const encDH = await deriveDHKey(subDHPub, privDH, ["encrypt", "decrypt"]);

  await publishPostKey(postKey, postHash, encDH, pubKey, privKey, token);
}

export async function sendReply(
  postId: string,
  pubPubKeyHex: string,
  senderPubKeyHex: string,
  msg: string,
  host?: string,
): Promise<void> {
  const userPubKey = await hex2ECDSAKey(pubPubKeyHex);
  if (!userPubKey) {
    return;
  }

  const pubECDH = await pubECDSA2ECDH(userPubKey);

  // Gen ephem keypair for outer DH.
  const ephemKeys = await genECDHKeys();
  const ephemDH = await deriveDHKey(pubECDH, ephemKeys.privateKey, ["encrypt"]);

  // Form request.
  const req: IReply = {
    type: "reply",
    pubKey: senderPubKeyHex,
    msg,
    postId,
    createdAt: new Date().toISOString(),
  };

  // Encrypt request.
  const reqJson = JSON.stringify(req);
  const encReqBuf = await encryptString(reqJson, ephemDH);

  const ephemDHPubBuf = await key2buf(ephemKeys.publicKey);
  return Net.putReply(pubPubKeyHex, ephemDHPubBuf, encReqBuf, host);
}

export async function sendSubRequest(
  pubPubKeyHex: string,
  subPubKeyHex: string,
  msg: string,
  host?: string,
): Promise<void> {
  const userPubKey = await hex2ECDSAKey(pubPubKeyHex);
  if (!userPubKey) {
    return;
  }

  const pubECDH = await pubECDSA2ECDH(userPubKey);

  // Gen ephem keypair for outer DH.
  const ephemKeys = await genECDHKeys();
  const ephemDH = await deriveDHKey(pubECDH, ephemKeys.privateKey, ["encrypt"]);

  // Form request.
  const req: ISubReq = {
    type: "subscribe",
    pubKey: subPubKeyHex,
    msg,
  };

  // Encrypt request.
  const reqJson = JSON.stringify(req);
  const encReqBuf = await encryptString(reqJson, ephemDH);

  const ephemDHPubBuf = await key2buf(ephemKeys.publicKey);
  return Net.putSubReq(pubPubKeyHex, ephemDHPubBuf, encReqBuf, host);
}

export async function publishPost(
  post: TPost,
  postKey: CryptoKey,
  pubKey: string,
  privKey: CryptoKey,
  token: string,
): Promise<[IIndex, ArrayBuffer]> {
  const body = JSON.stringify(post);
  const ciphertext = await encryptString(body, postKey);

  let index: IIndex = { posts: [], updatedAt: new Date().toISOString() };
  const idx = await Net.getIndex(pubKey);
  if (idx && idx !== "notfound") {
    index = idx;
  }

  // Compute content-based ID.
  const hash = await sha(ciphertext);
  const hashHex = await buf2hex(hash);

  // Put post.
  await putFile(pubKey, `posts/${hashHex}`, privKey, token, ciphertext, "application/octet-stream");

  // Update index.
  index.posts.push({ id: hashHex });
  const indexEnc = new TextEncoder().encode(JSON.stringify(index));
  await putFile(pubKey, `index.json`, privKey, token, indexEnc, "application/json");

  return [index, hash];
}

async function postKeyLocation(
  outerKey: CryptoKey,
  postHash: ArrayBuffer,
): Promise<string> {
  const encKeyBytes = await key2buf(outerKey);
  const locBytes = await sha(concatArrayBuffers(encKeyBytes, postHash));
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

  const postKeyRaw = await key2buf(postKey);
  const postKeyHex = buf2hex(postKeyRaw);
  const ciphertext = await encryptString(postKeyHex, encKey);

  return putFile(pubKey, `keys/${locHex}`, privKey, token, ciphertext, "application/json");
}

export async function uploadProfile(pubKey: CryptoKey, privKey: CryptoKey, token: string, profile: IProfile) {
  const pubKeyBuf = await key2buf(pubKey);
  const pubKeyHex = buf2hex(pubKeyBuf);

  const payload = new TextEncoder().encode(JSON.stringify(profile));

  return putFile(pubKeyHex, "profile.json", privKey, token, payload, "application/json");
}

async function putFile(
  pubKeyHex: string,
  path: string,
  signPrivKey: CryptoKey,
  token: string,
  data: ArrayBuffer,
  contentType: "application/json" | "application/octet-stream",
): Promise<void> {
  // Sign.
  const sig = await sign(signPrivKey, data);

  // Send.
  const location = Net.fileLoc(pubKeyHex, path);
  Net.putFile(location, pubKeyHex, token, data, sig, contentType)
}

export async function getAuthChallenge(
  publicKey: CryptoKey,
): Promise<IAuthChallenge> {
  const rawPubKey = await key2buf(publicKey);
  return Net.fetchAuthChallenge(rawPubKey);
}

export async function getSessionToken(
  privateKey: CryptoKey,
  publicKey: CryptoKey,
  solution: Uint8Array,
): Promise<string> {
  const pubKeyBuf = await key2buf(publicKey);
  const sig = await sign(privateKey, solution);
  return Net.fetchSessionToken(pubKeyBuf, sig, solution);
}
