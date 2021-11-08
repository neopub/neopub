import { buf2hex, hex2bytes } from "./core/bytes";
import { ECDSA_PUBKEY_BYTES } from "./core/consts";
import { locationHeader, pubKeyHeader, sigHeader, subDhKey, tokenHeader } from "./core/consts";
import Lib from "./lib";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
};

type BodyFunc = () => Promise<ArrayBuffer>;
type SuccessFunc = (body: any, headers: Record<string, string>) => any;
type FailureFunc = (code: number, msg: string) => any;
type HeaderFunc = (name: string) => string;
export interface IHandlerContext {
  body: BodyFunc,
  success: SuccessFunc,
  failure: FailureFunc,
  header: HeaderFunc,
}

export interface IDataLayer {
  writeFile: (loc: string, data: any) => Promise<void>,
  readFile: (loc: string) => Promise<any>,
  listFiles: (loc: string) => Promise<string[]>,
}

function parsePublicKey(header: HeaderFunc): { hex: string, bytes: Uint8Array } | undefined {
  const hex = header(pubKeyHeader);
  if (!hex) {
    return;
  }

  const bytes = hex2bytes(hex);
  if (!bytes || bytes.length !== ECDSA_PUBKEY_BYTES) {
    return;
  }

  return { hex, bytes };
}

export default class API {
  lib: Lib;
  data: IDataLayer;
  constructor(lib: Lib, data: IDataLayer) {
    this.lib = lib;
    this.data = data;
  }

  async handle(url: string, context: IHandlerContext) {
    switch (url) {
      case "/auth":
        return this.auth(context);
      case "/chal":
        return this.chal(context);
      case "/get":
        return this.get(context);
      case "/put":
        return this.put(context);
      case "/reqs":
        return this.reqs(context);
      case "/sub":
        return this.sub(context);
      case "/inbox":
        return this.inbox(context);
    }
  
    return context.failure(404, "Invalid route");
  }

  private async auth({ body, success, failure, header }: IHandlerContext) {
    const pubKey = parsePublicKey(header);
    if (!pubKey) {
      return failure(400, "Missing/invalid pubKey");
    }

    const chal = await this.lib.genChal(pubKey.bytes);
    const hex = buf2hex(chal);

    return success(hex, {});
  }

  private async chal({ body, success, failure, header }: IHandlerContext) {
    const pubKey = parsePublicKey(header);
    if (!pubKey) {
      return failure(400, "Missing/invalid pubKey");
    }

    const solutionHex = new TextDecoder().decode(await body());
    const solution = hex2bytes(solutionHex)
    if (!solution) {
      return failure(400, "Failed to parse solution");
    }

    // Check proof-of-work.
    const valid = await this.lib.checkPoW(pubKey.bytes, solution)
    if (!valid) {
      return failure(400, "Invalid solution");
    }

    // Parse signature.
    const sigHex = header(sigHeader);
    const sigBytes = hex2bytes(sigHex);
    if (!sigBytes) {
      return failure(400, "Missing signature");
    }

    // Verify signature of solution.
    const verified = await this.lib.checkSig(pubKey.bytes, sigBytes, solution);
    if (!verified) {
      return failure(400, "Invalid signature");
    }

    // Compute token.
    const tokenHex = await this.lib.genTok(pubKey.bytes);

    return success(tokenHex, { "Content-Type": "text/plain" });
  }

  private async put({ body, success, failure, header }: IHandlerContext) {
    const pubKey = parsePublicKey(header);
    if (!pubKey) {
      return failure(400, "Missing/invalid pubKey");
    }
    
    // Check token.
    const tokenHex = header(tokenHeader);
    const tokenValid = await this.lib.checkTok(pubKey.bytes, tokenHex);
    if (!tokenValid) {
      return failure(400, "Invalid token");
    }

    // Parse signature.
    const sigHex = header(sigHeader);
    const sigBytes = hex2bytes(sigHex);
    if (!sigBytes) {
      return failure(400, "Missing signature");
    }

    // Check signature.
    const data = await body();
    const verified = await this.lib.checkSig(pubKey.bytes, sigBytes, data);
    if (!verified) {
      return failure(400, "Invalid signature");
    }

    const loc = header(locationHeader);
    try {
      await this.data.writeFile(loc, data);
    } catch (e) {
      console.error(e);
      return failure(500, "Error writing data");
    }

    return success(null, { "Content-Type": "text/plain" });
  }

  private async get({ success, failure, header }: IHandlerContext) {
    const loc = header(locationHeader);
    if (!loc) {
      return failure(400, "Invalid location");
    }

    try {
      const data = await this.data.readFile(loc);
      if (data === null) {
        return failure(404, "Not found");
      }

      return success(data, { "Content-Type": "text/plain" });
    } catch (e) {
      console.error(e);
      return failure(404, "Not found");
    }
  }

  private async reqs({ success, failure, header }: IHandlerContext) {
    const pubKey = parsePublicKey(header);
    if (!pubKey) {
      return failure(400, "Missing/invalid pubKey");
    }

    // Check token.
    const tokenHex = header(tokenHeader);
    const tokenValid = await this.lib.checkTok(pubKey.bytes, tokenHex);
    if (!tokenValid) {
      return failure(400, "Invalid token");
    }

    const prefix = `/users/${pubKey.hex}/reqs/`;
    try {
      const keys = await this.data.listFiles(prefix);
      return success(JSON.stringify(keys), { "Content-Type": "text/plain" });
    } catch (e) {
      console.error(e);
      return failure(500, "Error listing reqs");
    }
  }

  private async sub({ body, success, failure, header }: IHandlerContext) {
    const pubKey = parsePublicKey(header);
    if (!pubKey) {
      return failure(400, "Missing/invalid pubKey");
    }

    const dhHex = header(subDhKey);
    if (!dhHex) {
      return failure(400, "Invalid DH key");
    }

    // NOTE: can't check signature, or server would know identity of subscriber.
    // But it could be signed with subscriber's DH pub key. Does that add anything?
    // Yes. Because sub's DH pub key is used as the path, someone could overwrite
    // a legitimate key if they knew the DH pub key to target. But it's ephemeral,
    // and transmitted over HTTPS, so that doesn't seem like a real risk.

    const reqData = await body();

    const loc = `/users/${pubKey.hex}/reqs/${dhHex}`;
    try {
      await this.data.writeFile(loc, reqData);
    } catch (e) {
      console.error(e);
      return failure(500, "Error writing data");
    }
    
    return success(null, { "Content-Type": "text/plain" });
  }

  private async inbox({ body, success, failure, header }: IHandlerContext) {
    const pubKey = parsePublicKey(header);
    if (!pubKey) {
      return failure(400, "Missing/invalid pubKey");
    }

    // TODO: preflight to get token. Check token.

    const reqData = await body();
    if (reqData.byteLength < 1) {
      return failure(400, "Missing payload");
    }

    const hash = await this.lib.sha(reqData);
    const hashHex = await buf2hex(hash);

    const loc = `/users/${pubKey.hex}/inbox/${hashHex}`;
    try {
      await this.data.writeFile(loc, reqData);
    } catch (e) {
      console.error(e);
      return failure(500, "Error writing data");
    }
    
    return success(null, {});
  }
}
