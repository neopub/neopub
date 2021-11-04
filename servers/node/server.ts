import http from "http";
import { Buffer } from 'buffer';
import Lib from "./shared/lib";
import fs from "fs";
import path from "path";
import API, { corsHeaders, IDataLayer, IHandlerContext } from "./shared/api";

async function body2buf(req: http.IncomingMessage): Promise<Buffer> {
  const bufs = [];
  for await (const chunk of req) {
    bufs.push(chunk);
  }
  return Buffer.concat(bufs);
}

function success(body: any, headers: Record<string, string>, res: http.ServerResponse) {
  Object.entries({ ...corsHeaders, ...headers }).forEach(([h, v]) => {
    res.setHeader(h, v);
  })

  res.writeHead(200);
  if (body) {
    res.write(body);
  }
  res.end();
}

function failure(status: number, msg: string, res: http.ServerResponse) {
  Object.entries(corsHeaders).forEach(([h, v]) => {
    res.setHeader(h, v);
  })

  res.writeHead(status, msg);
  res.end();
}

const data: IDataLayer = {
  async writeFile(loc: string, data: any): Promise<void> {
    const fullLoc = `public${loc}`;
    await fs.promises.mkdir(path.dirname(fullLoc), { recursive: true });
    return fs.promises.writeFile(fullLoc, data);
  },
  
  async readFile(loc: string): Promise<any> {
    const fullLoc = `public${loc}`;
    return fs.promises.readFile(fullLoc);
  },
  
  async listFiles(prefix: string): Promise<string[]> {
    const fullLoc = `public${prefix}`;
    const dirExists = fs.existsSync(fullLoc);
    if (!dirExists) {
      return [];
    }
  
    const keys = await fs.promises.readdir(fullLoc);
    return keys;
  }
};

export default class Server {
  host: string;
  port: number;
  api: API;
  server: http.Server;
  constructor(host: string, port: number, lib: Lib) {
    this.host = host;
    this.port = port;
    this.api = new API(lib, data);
    this.server = http.createServer(this.handle);
  }

  run() {
    this.server.listen(this.port, this.host, () => {
      console.log(`listening on http://${this.host}:${this.port}...`);
    });
  }

  private handleOptions(req: http.IncomingMessage, res: http.ServerResponse) {
    if (
      this.host === "localhost" ||
      req.headers["Origin"] != null &&
      req.headers["Access-Control-Request-Method"] !== null &&
      req.headers["Access-Control-Request-Headers"] !== null
    ){
      Object.entries(corsHeaders).forEach(([h, v]) => {
        res.setHeader(h, v);
      })

      res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] ?? "");
    } else {
      res.setHeader("Allow", "GET, POST, OPTIONS");
    }

    res.writeHead(200);
    res.end();
  }

  private handle = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    console.log(req.method, req.url);
    
    if (req.method === "OPTIONS") {
      // Handle CORS preflight requests
      return this.handleOptions(req, res);
    }

    const context: IHandlerContext = {
      body: () => body2buf(req),
      success: (body: any, hdrs: Record<string, string>) => success(body, hdrs, res),
      failure: (code: number, msg: string) => failure(code, msg, res),
      header: (header: string) => (req.headers[header] ?? "") as string,
    }

    return this.api.handle(req.url ?? "", context);
  }
}