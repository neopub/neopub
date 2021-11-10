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

function parseSignature(header: HeaderFunc): Uint8Array | undefined {
  const sigHex = header(sigHeader);
  if (!sigHex) {
    return;
  }

  const sigBytes = hex2bytes(sigHex);
  if (!sigBytes) {
    return;
  }

  return sigBytes;
}

export default class API {
  lib: Lib;
  data: IDataLayer;
  constructor(lib: Lib, data: IDataLayer) {
    this.lib = lib;
    this.data = data;
  }

  private async checkToken(header: HeaderFunc, pubKeyBytes: Uint8Array): Promise<boolean> {
    const tokenHex = header(tokenHeader);
    if (!tokenHex) {
      return false;
    }

    return await this.lib.checkTok(pubKeyBytes, tokenHex);
  }

  async handle(url: string, method: string, context: IHandlerContext) {
    type Handler = (context: IHandlerContext) => Promise<void>;
    const handlers: Record<string, Handler> = {
      "POST /auth": this.auth,
      "POST /chal": this.chal,
      "GET /get": this.get,
      "POST /put": this.put,
      "POST /inbox": this.inbox,
      "GET /inbox": this.inboxGet,
    };

    const key = `${method.toUpperCase()} ${url}`;
    const handler = handlers[key];
    if (!handler) {
      return context.failure(404, "Invalid route");
    }

    return handler.bind(this)(context);
  }

  // Returns a challenge to the client, based on provided capabilities description.
  private async auth({ body, success, failure, header }: IHandlerContext) {
    try {
      const buf = await body();
      const json = new TextDecoder().decode(buf);
      const caps = JSON.parse(json);

      const chal = await this.lib.genChal(caps);
      if (!chal) {
        return failure(400, "Invalid capabilities description");
      }
      const hex = buf2hex(chal);
      return success(hex, {});
    } catch (err) {
      return failure(400, "Invalid/missing capabilities description");
    }
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

    const sigBytes = parseSignature(header);
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
    
    const tokenValid = await this.checkToken(header, pubKey.bytes);
    if (!tokenValid) {
      return failure(400, "Invalid token");
    }

    const sigBytes = parseSignature(header);
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

    // NOTE: can't check signature, or server would know identity of sender.
    // But it could be signed with sender's DH pub key. Does that add anything?
    // Yes. Because sender's DH pub key is used as the path, someone could overwrite
    // a legitimate key if they knew the DH pub key to target. But it's ephemeral,
    // and transmitted over HTTPS, so that doesn't seem like a real risk.

    // TODO: bake the DH key into the front of the payload, and use hash for filename?
    const dhHex = header(subDhKey);
    if (!dhHex) {
      return failure(400, "Invalid DH key");
    }

    const loc = `/users/${pubKey.hex}/inbox/${dhHex}`;
    try {
      await this.data.writeFile(loc, reqData);
    } catch (e) {
      console.error(e);
      return failure(500, "Error writing data");
    }
    
    return success(null, {});
  }

  private async inboxGet({ body, success, failure, header }: IHandlerContext) {
    const pubKey = parsePublicKey(header);
    if (!pubKey) {
      return failure(400, "Missing/invalid pubKey");
    }

    const tokenValid = await this.checkToken(header, pubKey.bytes);
    if (!tokenValid) {
      return failure(400, "Invalid token");
    }

    const prefix = `/users/${pubKey.hex}/inbox/`;
    try {
      const keys = await this.data.listFiles(prefix);
      return success(JSON.stringify(keys), { "Content-Type": "text/plain" });
    } catch (e) {
      console.error(e);
      return failure(500, "Error listing inbox");
    }
  }
}
