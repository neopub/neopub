import { pubKeyHeader, tokenHeader, sigHeader, subDhKey, powHeader, NUM_SIG_BYTES } from "../consts";
import { buf2hex, bytes2hex, hex2bytes } from "../bytes";
import { IAuthChallenge, IIndex, IProfile, NotFound, CapabilityDescription } from "../types";
import NPCrypto from "../crypto";

type FetchFn = (input: string, init?: { method: "GET" | "POST" | "PUT" | "DELETE", headers?: Record<string, string>, body?: any }) => Promise<Response>;

export default class Net {
  hostPrefix: string;
  fetch: FetchFn;
  npCrypto: NPCrypto;

  constructor(hostPrefix: string, fetch: FetchFn, npCrypto: NPCrypto) {
    this.hostPrefix = hostPrefix;
    this.fetch = fetch;
    this.npCrypto = npCrypto;
  }

  fileLoc(pubKeyHex: string, path: string): string {
    return `/users/${pubKeyHex}/${path}`;
  }

  async fetchInboxItem(
    pubKeyHex: string,
    id: string,
  ): Promise<ArrayBuffer | undefined> {
    const location = this.fileLoc(pubKeyHex, `inbox/${id}`);
    return this.getFile(location);
  }

  async fetchPostKey(
    posterPubKeyHex: string,
    postKeyLocHex: string,
  ): Promise<ArrayBuffer | undefined> {
    const location = this.fileLoc(posterPubKeyHex, `keys/${postKeyLocHex}`);
    return this.getFile(location);
  }

  async getIndex(pubKeyHex: string, host?: string): Promise<IIndex | undefined | NotFound> {
    const location = this.fileLoc(pubKeyHex, "index.json");
    return this.getFileSignedJSON<IIndex>(pubKeyHex, location, host);
  }

  async getProfile(pubKeyHex: string, host?: string): Promise<IProfile | undefined | NotFound> {
    const location = this.fileLoc(pubKeyHex, "profile.json");
    return this.getFileSignedJSON<IProfile>(pubKeyHex, location, host);
  }

  async fetchPost(
    posterPubKeyHex: string,
    postHashHex: string,
  ): Promise<ArrayBuffer | undefined> {
    const location = this.fileLoc(posterPubKeyHex, `posts/${postHashHex}`);
    return this.getFile(location);
  }

  async getFile(location: string): Promise<ArrayBuffer | undefined> {
    try {
      const resp = await this.fetch(`${this.hostPrefix}${location}`, {
        method: "GET",
        headers: {
          Accept: "application/octet-stream",
        },
      });
      if (!resp.ok) {
        return;
      }
      const buf = resp.arrayBuffer();
      return buf
    } catch {
      return
    }
  }

  async deleteFile(pubKeyHex: string, token: string, location: string): Promise<Response> {
    return this.fetch(`${this.hostPrefix}${location}`, {
      method: "DELETE",
      headers: {
        Accept: "application/octet-stream",
        [pubKeyHeader]: pubKeyHex,
        [tokenHeader]: token,
      },
    });
  }

  async getFileSignedJSON<T>(signerPubKeyHex: string, location: string, host?: string): Promise<T | undefined | NotFound> {
    try {
      const resp = await this.fetch(`${host ?? this.hostPrefix}${location}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });
      if (resp.status === 404) {
        return "notfound";
      }
      if (!resp.ok) {
        return;
      }

      const buf = await resp.arrayBuffer();
      const sig = buf.slice(0, NUM_SIG_BYTES);

      // TODO: check.
      const signerPubKey = await this.npCrypto.hex2ECDSAKey(signerPubKeyHex);
      if (!signerPubKey) {
        return; // TODO: signal error.
      }

      const rest = buf.slice(NUM_SIG_BYTES);

      const valid = await this.npCrypto.verify(signerPubKey, sig, rest);
      if (!valid) {
        return; // TODO blow up.
      }

      const json = new TextDecoder().decode(rest);
      const index = JSON.parse(json);

      return index;
    } catch (err) {
      console.error(err);
      return;
    }
  }

  async putFile(
    location: string,
    pubKeyHex: string,
    token: string,
    payload: ArrayBuffer,
    sig: ArrayBuffer,
    contentType: "application/json" | "application/octet-stream",
  ): Promise<void> {
    const sigHex = bytes2hex(new Uint8Array(sig));

    await this.fetch(`${this.hostPrefix}${location}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": contentType,
        [pubKeyHeader]: pubKeyHex,
        [tokenHeader]: token,
        [sigHeader]: sigHex,
      },
      body: payload,
    });
  }

  async fetchInbox(pubKey: string, token: string): Promise<string[]> {
    const resp = await this.fetch(`${this.hostPrefix}/inbox`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        [pubKeyHeader]: pubKey,
        [tokenHeader]: token,
      },
    });
    try {
      const inbox = await resp.json();
      return inbox;
    } catch {
      return []
    }
  }

  async putMessage(
    pubPubKeyHex: string,
    ephemDHPubBuf: ArrayBuffer,
    encMsgBuf: ArrayBuffer,
    powSolution: Uint8Array,
    host?: string,
  ): Promise<void> {
    const ephemDHPubBytes = new Uint8Array(ephemDHPubBuf);
    const ephemDHPubHex = bytes2hex(ephemDHPubBytes);

    const powHex = bytes2hex(powSolution);

    await this.fetch(`${host ?? this.hostPrefix}/inbox`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        [pubKeyHeader]: pubPubKeyHex,
        [subDhKey]: ephemDHPubHex,
        [powHeader]: powHex,
      },
      body: encMsgBuf,
    });
  }

  async fetchAuthChallenge(
    capDesc: CapabilityDescription,
    host?: string,
  ): Promise<IAuthChallenge> {
    const resp = await this.fetch(`${host ?? this.hostPrefix}/auth`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(capDesc),
    });
    const bytes = hex2bytes(await resp.text());
    if (!bytes) {
      throw new Error('failed to parse hex');
    }
    const diff = bytes[bytes.length - 1];
    const chal = bytes.slice(0, bytes.length - 1);

    return { chal, diff };
  }

  async fetchSessionToken(
    pubKey: ArrayBuffer,
    sig: ArrayBuffer,
    solution: Uint8Array,
  ): Promise<string> {
    const pubKeyHex = buf2hex(pubKey);
    const sigHex = bytes2hex(new Uint8Array(sig));

    const solutionHex = buf2hex(solution);

    const chalResp = await this.fetch(`${this.hostPrefix}/chal`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/octet-stream",
        [pubKeyHeader]: pubKeyHex,
        [sigHeader]: sigHex,
      },
      body: solutionHex,
    });
    return await chalResp.text();
  }
}