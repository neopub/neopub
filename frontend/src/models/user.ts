import { buf2hex, bytes2hex, hex2bytes } from "core/bytes";
import Crypto from "lib/crypto";
import { IProfile } from "core/types";
import { hostPrefix } from "lib/net";
import { getToken } from "./host";
import { storeCredentials } from "./id";
import { storeProfile, uploadProfile } from "./profile";

export class AuthorizedUser {
  user: User;
  token: string;

  constructor(user: User, token: string) {
    this.user = user;
    this.token = token;
  }

  async storeCreds() {
    return storeCredentials(this.user.idKeys, this.token, this.user.worldKey, this.user.stateKey);
  }

  async storeAndUploadProfile(): Promise<Error | void> {
    const profile = await this.user.profile();
    const pubKeyResult = await this.user.pubKeyHex();

    if (pubKeyResult instanceof Error) {
      return pubKeyResult;
    }

    await Promise.all([
      storeProfile(pubKeyResult, profile),
      uploadProfile(this.user.idKeys.publicKey, this.user.idKeys.privateKey, this.token, profile),
    ]);
  }
}

export default class User {
  idKeys: CryptoKeyPair;
  stateKey: CryptoKey;
  worldKey: CryptoKey;

  constructor(idKeys: CryptoKeyPair, stateKey: CryptoKey, worldKey: CryptoKey) {
    this.idKeys = idKeys;
    this.stateKey = stateKey;
    this.worldKey = worldKey;
  }

  static async create(): Promise<User> {
    const idKeys = await Crypto.genIDKeyPair();
    const stateKey = await Crypto.genSymmetricKey();
    const worldKey = await Crypto.genSymmetricKey();

    return new User(idKeys, stateKey, worldKey);
  }

  static async loadFromJSON(json: string): Promise<User | Error> {
    try {
      const id = JSON.parse(json);

      const publicKey = await crypto.subtle.importKey("jwk", id.pubKey, { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
      const privateKey = await crypto.subtle.importKey("jwk", id.privKey, { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);

      const idKeys = { publicKey, privateKey };

      const worldKeyBufResult = hex2bytes(id.worldKey);
      if (worldKeyBufResult == null) {
        return new Error("Parsing world key");
      }
      const worldKey = await crypto.subtle.importKey("raw", worldKeyBufResult, { name: "AES-CBC", length: 256 }, false, ["encrypt", "decrypt"]);

      const stateKeyBufResult = hex2bytes(id.stateKey);
      if (stateKeyBufResult == null) {
        return new Error("Parsing state key");
      }
      const stateKey = await crypto.subtle.importKey("raw", stateKeyBufResult, { name: "AES-CBC", length: 256 }, false, ["encrypt", "decrypt"]);

      return new User(idKeys, stateKey, worldKey);
    } catch (e) {
      return e;
    }
  }

  async getToken(setStatus: (status: string) => void): Promise<Error | AuthorizedUser> {
    const token = await getToken(this.idKeys.publicKey, this.idKeys.privateKey, setStatus);
    if (token instanceof Error) {
      return token;
    }

    return new AuthorizedUser(this, token);
  }

  async profile(): Promise<IProfile> {
    const worldKeyBuf = await Crypto.key2buf(this.worldKey);
    const worldKeyHex = buf2hex(worldKeyBuf);
    return { worldKey: worldKeyHex, host: hostPrefix };
  }

  async pubKeyHex(): Promise<string | Error> {
    try {
      const raw = await crypto.subtle.exportKey("raw", this.idKeys.publicKey);
      const bytes = new Uint8Array(raw);
      return bytes2hex(bytes);
    } catch (e) {
      return e;
    }
  }
}