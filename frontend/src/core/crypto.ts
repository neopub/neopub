import { concatArrayBuffers, hex2bytes } from "./bytes";
import { ecdsaParams } from "./consts";

export default class NPCrypto {
  crypto: Crypto;
  constructor(crypto: Crypto) {
    this.crypto = crypto;
  }

  async genIDKeyPair(): Promise<CryptoKeyPair> {
    return this.crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"],
    );
  }

  async deriveDHKey(
    publicKey: CryptoKey,
    privateKey: CryptoKey,
    usages: KeyUsage[],
  ): Promise<CryptoKey> {
    return this.crypto.subtle.deriveKey(
      { name: "ECDH", public: publicKey },
      privateKey,
      { name: "AES-CBC", length: 256 },
      true,
      usages,
    );
  }

  async pubECDSA2ECDH(pubKey: CryptoKey): Promise<CryptoKey> {
    // HACK: dump ECDSA pub key and load it as an ECDH pub key.
    // This is only used 1-way, for a subscriber to send a request to the pub key's owner.
    // Is this a problem?
    const dump = await this.crypto.subtle.exportKey("jwk", pubKey);
    return await this.crypto.subtle.importKey(
      "jwk",
      dump,
      { name: "ECDH", namedCurve: "P-256" },
      true,
      [],
    );
  }

  async genECDHKeys(): Promise<CryptoKeyPair> {
    return this.crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey"],
    );
  }

  async verify(signerPubKey: CryptoKey, sig: ArrayBuffer, data: ArrayBuffer) {
    return this.crypto.subtle.verify(
      ecdsaParams,
      signerPubKey,
      sig,
      data,
    );
  }

  async importAESKey(
    buf: ArrayBuffer,
    usages: KeyUsage[],
  ): Promise<CryptoKey> {
    return this.crypto.subtle.importKey("raw", buf, { name: "AES-CBC" }, true, usages);
  }

  async hex2ECDHKey(hex: string): Promise<CryptoKey | undefined> {
    const bytes = hex2bytes(hex);
    if (!bytes) {
      return;
    }
    return this.crypto.subtle.importKey(
      "raw",
      bytes,
      { name: "ECDH", namedCurve: "P-256" },
      true,
      [],
    );
  }

  async hex2ECDSAKey(
    hex: string,
  ): Promise<CryptoKey | undefined> {
    const bytes = hex2bytes(hex);
    if (!bytes) {
      return;
    }
    return this.crypto.subtle.importKey(
      "raw",
      bytes,
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["verify"],
    );
  }

  async sign(
    ecdsaPrivKey: CryptoKey,
    bytes: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    return this.crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      ecdsaPrivKey,
      bytes,
    );
  }

  async key2buf(key: CryptoKey): Promise<ArrayBuffer> {
    return this.crypto.subtle.exportKey("raw", key);
  }

  async sha(data: ArrayBuffer): Promise<ArrayBuffer> {
    return this.crypto.subtle.digest("SHA-256", data);
  }

  async genSymmetricKey(): Promise<CryptoKey> {
    // Generate a new key.
    const key = await this.crypto.subtle.generateKey(
      {
        name: "AES-CBC",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"],
    );
    return key;
  }

  numIvBytes = 16;

  async genIV(
    plaintext: ArrayBuffer,
    key: CryptoKey,
  ): Promise<ArrayBuffer> {
    const rawKey = await this.crypto.subtle.exportKey("raw", key);

    const combined = concatArrayBuffers(rawKey, plaintext);

    const sha = await this.crypto.subtle.digest("SHA-256", combined);
    const iv = sha.slice(0, this.numIvBytes);

    return iv;
  }

  async encryptBuf(plaintext: ArrayBuffer, key: CryptoKey): Promise<ArrayBuffer> {
    const iv = await this.genIV(plaintext, key);

    const ciphertext = await this.crypto.subtle.encrypt(
      {
        name: "AES-CBC",
        iv,
      },
      key,
      plaintext,
    );

    const payload = concatArrayBuffers(iv, ciphertext);
    return payload;
  }

  async encryptString(
    data: string,
    key: CryptoKey,
  ): Promise<ArrayBuffer> {
    const plaintext = new TextEncoder().encode(data);
    return this.encryptBuf(plaintext, key);
  }

  async decryptBuf(
    payload: ArrayBuffer,
    key: CryptoKey,
  ): Promise<ArrayBuffer> {
    const bytes = new Uint8Array(payload);
    const iv = bytes.slice(0, this.numIvBytes);
    const ciphertext = bytes.slice(this.numIvBytes);

    const decrypted = await this.crypto.subtle.decrypt(
      {
        name: "AES-CBC",
        iv,
      },
      key,
      ciphertext,
    );

    return decrypted;
  }

  async decryptString(
    payload: ArrayBuffer,
    key: CryptoKey,
  ): Promise<string> {
    const decrypted = await this.decryptBuf(payload, key);
    const plaintext = new TextDecoder().decode(decrypted);
    return plaintext;
  }
}