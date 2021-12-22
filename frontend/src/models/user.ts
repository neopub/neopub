import { buf2hex, bytes2hex } from "core/bytes";
import Crypto from "lib/crypto";
import { IProfile } from "core/types";
import { hostPrefix } from "lib/net";
import { getToken } from "./host";
import { storeCredentials } from "./id";
import { storeProfile, uploadProfile } from "./profile";
import { loadFromJSON } from "core/client/creds";

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
    const creds = await loadFromJSON(json, crypto);
    if (creds instanceof Error) {
      return creds;
    }

    return new User(creds.idKeys, creds.stateKey, creds.worldKey);
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