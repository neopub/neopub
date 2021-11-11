import { buf2hex, concatArrayBuffers, hex2bytes } from "./core/bytes";
import { ecdsaParams, POW_DIFF } from "./core/consts";
import PoW, { numHashBits } from "./core/pow";
import { CapabilityDescription } from "./core/types";

const supportedCapabilities = new Set(["user", "message"]);
export default class Lib {
  crypto: any;
  pow: PoW;
  powSeedBytes: Uint8Array;
  sessTokenSeedBytes: Uint8Array;

  constructor(crypto: any, sessTokenSeed: string, powSeed: string) {
    this.crypto = crypto;
    this.pow = new PoW(crypto);
    this.powSeedBytes = new TextEncoder().encode(powSeed);
    this.sessTokenSeedBytes = new TextEncoder().encode(sessTokenSeed);
  }

  async checkSig(pubKey: ArrayBuffer, sig: ArrayBuffer, data: ArrayBuffer): Promise<boolean> {
    const key = await this.crypto.subtle.importKey(
      "raw",
      pubKey,
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["verify"],
    );
    
    return await this.crypto.subtle.verify(
      ecdsaParams,
      key,
      sig,
      data,
    );
  }

  private desc2pow(capDesc: CapabilityDescription): { hex: string, diff: number } {
    switch (capDesc.type) {
      case "user": {
        const hex = capDesc.pubKey;
        const diff = POW_DIFF;
        return { hex, diff };
      }
      case "message": {
        const hex = capDesc.hash;

        const diff = POW_DIFF; // TODO: scale this with capDesc.numBytes.

        return { hex, diff };
      }
    }
  }

  async checkTok(pubKeyBytes: Uint8Array, tokenHex: string): Promise<boolean> {
    // TODO: use a timing-safe string comparison.
    const expectedToken = await this.pow.hash(pubKeyBytes, this.sessTokenSeedBytes);
    const expectedTokenHex = buf2hex(expectedToken);
    return tokenHex === expectedTokenHex;
  }

  async checkPoW(capDesc: CapabilityDescription, solution: ArrayBuffer): Promise<boolean> {
    const { hex, diff } = this.desc2pow(capDesc);
    const bytes = hex2bytes(hex);
    if (!bytes) {
      return false;
    }

    const chal = await this.pow.hash(bytes, this.powSeedBytes);
    const hash = await this.pow.hash(new Uint8Array(solution), chal);

    const N = numHashBits - diff;
    return this.pow.lessThan2ToN(hash, N);
  }

  async genTok(keyBytes: Uint8Array): Promise<string> {
    // NOTE: token is generated, instead of simply using the PoW solution as a token,
    // because the token can be rotated.
    // Wait.
    // The PoW seed could just be rotated.
    // Then there's no need for this second piece of state.
    // Client can just solve PoW and retain the solution as its token.
    // TODO: do that (just ensure PoW check is efficient--should be).
    const token = await this.pow.hash(keyBytes, this.sessTokenSeedBytes);
    const hex = buf2hex(token);
    return hex;
  }

  async genChal(capDesc: any): Promise<ArrayBuffer | undefined> {
    if (typeof capDesc !== "object" || !capDesc.type) {
      return;
    }

    if (!supportedCapabilities.has(capDesc?.type)) {
      return;
    }

    const { hex, diff } = this.desc2pow(capDesc);
    const bytes = hex2bytes(hex);
    if (!bytes) {
      return;
    }

    const chal = await this.pow.hash(bytes, this.powSeedBytes);
    return concatArrayBuffers(chal, new Uint8Array([diff]));
  }

  async sha(data: ArrayBuffer): Promise<ArrayBuffer> {
    return this.crypto.subtle.digest("SHA-256", data);
  }
}
