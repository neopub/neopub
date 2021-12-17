import { buf2hex, concatArrayBuffers } from "../bytes";
import NPCrypto from "../crypto";
import { TPost, IIndex, IAuthChallenge } from "../types";
import Net from "./net";

export default class API {
  net: Net;
  crypto: NPCrypto;

  constructor(net: Net, crypto: NPCrypto) {
    this.net = net;
    this.crypto = crypto;
  }

  async publishPost(
    post: TPost,
    postKey: CryptoKey,
    pubKey: string,
    privKey: CryptoKey,
    token: string,
  ): Promise<[IIndex, ArrayBuffer]> {
    const body = JSON.stringify(post);
    const ciphertext = await this.crypto.encryptString(body, postKey);

    const now = new Date().toISOString();

    let index: IIndex = { posts: [], updatedAt: now };
    const idx = await this.net.getIndex(pubKey);
    if (idx && idx !== "notfound") {
      index = idx;
    }

    // Compute content-based ID.
    const hash = await this.crypto.sha(ciphertext);
    const hashHex = await buf2hex(hash);

    // Put post.
    await this.putFile(pubKey, `posts/${hashHex}`, privKey, token, ciphertext, "application/octet-stream");

    // Update index.
    index.posts.push({ id: hashHex });
    index.updatedAt = now;
    const indexEnc = new TextEncoder().encode(JSON.stringify(index));
    const indexSig = await this.crypto.sign(privKey, indexEnc);
    const signedIndex = concatArrayBuffers(indexSig, indexEnc);
    // putFile already signs the file for the host to check. Redundant? Cleaner way?

    await this.putFile(pubKey, `index.json`, privKey, token, signedIndex, "application/json");

    return [index, hash];
  }

  async putFile(
    pubKeyHex: string,
    path: string,
    signPrivKey: CryptoKey,
    token: string,
    data: ArrayBuffer,
    contentType: "application/json" | "application/octet-stream",
  ): Promise<void> {
    // Sign.
    const sig = await this.crypto.sign(signPrivKey, data);
  
    // Send.
    const location = this.net.fileLoc(pubKeyHex, path);
    this.net.putFile(location, pubKeyHex, token, data, sig, contentType)
  }

  async publishPostKey(
    postKey: CryptoKey,
    postHash: ArrayBuffer,
    encKey: CryptoKey,
    pubKey: string,
    privKey: CryptoKey,
    token: string,
  ): Promise<void> {
    const locHex = await this.postKeyLocation(encKey, postHash);
  
    const postKeyRaw = await this.crypto.key2buf(postKey);
    const postKeyHex = buf2hex(postKeyRaw);
    const ciphertext = await this.crypto.encryptString(postKeyHex, encKey);
  
    return this.putFile(pubKey, `keys/${locHex}`, privKey, token, ciphertext, "application/json");
  }

  async postKeyLocation(
    outerKey: CryptoKey,
    postHash: ArrayBuffer,
  ): Promise<string> {
    const encKeyBytes = await this.crypto.key2buf(outerKey);
    const locBytes = await this.crypto.sha(concatArrayBuffers(encKeyBytes, postHash)); // TODO: don't stick post hash on end of this... that makes it trivial to analyze number of distinct posts and people with access to each.
    const locHex = buf2hex(locBytes);
    return locHex;
  }

  async getUserAuthChallenge(
    publicKey: CryptoKey,
  ): Promise<IAuthChallenge> {
    const rawPubKey = await this.crypto.key2buf(publicKey);
    const pubKeyHex = buf2hex(rawPubKey);
    const capDesc = {
      type: "user",
      pubKey: pubKeyHex,
    } as const;
    return this.net.fetchAuthChallenge(capDesc);
  }

  async getSessionToken(
    privateKey: CryptoKey,
    publicKey: CryptoKey,
    solution: Uint8Array,
  ): Promise<string> {
    const pubKeyBuf = await this.crypto.key2buf(publicKey);
    const sig = await this.crypto.sign(privateKey, solution);
    return this.net.fetchSessionToken(pubKeyBuf, sig, solution);
  }
}