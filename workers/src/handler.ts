import Lib from "../shared/lib";
import API, { IDataLayer, IHandlerContext } from "../shared/api";
import { corsHeaders, handleOptions } from "./cors";

declare let KV: KVNamespace;
declare let SESS_TOKEN_SEED: string;
declare let POW_SEED: string;

const data: IDataLayer = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async writeFile(loc: string, data: any): Promise<void> {
    return KV.put(loc, data)
  },
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async readFile(loc: string): Promise<any> {
    return KV.get(loc, "stream");
  },
  
  async listFiles(prefix: string): Promise<string[]> {
    const list = await KV.list({ prefix });
    return list.keys.map(k => k.name.substr(prefix.length));
  }
};

const lib = new Lib(crypto, SESS_TOKEN_SEED, POW_SEED);
const api = new API(lib, data);

function success(body: BodyInit | null, headers: HeadersInit = {}): Response {
  return new Response(body, {
    headers: {
      ...corsHeaders,
      ...headers,
    },
    status: 200,
  });
}

function failure(status: number, msg: string) {
  return new Response(msg, { status, headers: corsHeaders });
}

export async function handleRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    // Handle CORS preflight requests
    return handleOptions(request);
  }

  const context: IHandlerContext = {
    body: () => request.arrayBuffer(),
    success,
    failure,
    header: (header: string) => request.headers.get(header) ?? "",
  }

  const url = new URL(request.url);
  switch (url.pathname) {
    case "/auth":
      return api.auth(context);
    case "/chal":
      return api.chal(context);
    case "/get":
      return api.get(context);
    case "/put":
      return api.put(context);
    case "/reqs":
      return api.reqs(context);
    case "/sub":
      return api.sub(context);
  }

  return new Response("Invalid route", { status: 404 })
}
