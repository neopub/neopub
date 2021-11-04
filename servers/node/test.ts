import Lib from "./shared/lib";
import * as crypto from "crypto";
import Server from "./server";
import http from "http";

const sessTokenSeed = "abc";
const powSeed = "123";
const lib = new Lib(crypto.webcrypto, sessTokenSeed, powSeed);

const port = 8888;
const host = 'localhost';
const server = new Server(host, port, lib);

server.run();

interface IResponse {
  statusCode?: number;
  data: any;
}
async function post(path: string, data: any, headers: Record<string, string> = {}): Promise<IResponse> {
  return new Promise((resolve, reject) => {
    const pubKey = new Uint8Array([1, 3, 3, 7]);

    const opts = {
      hostname: host,
      port,
      path,
      method: 'POST',
      headers,
    };

    const req = http.request(opts, res => {
      let resData: any;
      res.on("data", d => {
        resData = d;
      });
      res.on("close", () => {
        resolve({
          statusCode: res.statusCode,
          data: resData,
        });
      })
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

async function test() {
  const authHeaders = {
    Accept: "application/octet-stream",
    "Content-Type": "application/octet-stream",
  };

  async function testAuth() {
    const pubKey = new Uint8Array([1, 3, 3, 7]);
    const { statusCode, data } = await post('/auth', pubKey, authHeaders);
    if (statusCode !== 200 || data.byteLength !== 33) {
      throw new Error("fail");
    }
  }

  async function testAuthMissingPubKey() {
    const { statusCode, data } = await post('/auth', null, authHeaders);
    if (statusCode !== 400) {
      throw new Error("fail");
    }
  }

  await testAuth();
  await testAuthMissingPubKey();

  console.log("Done");
}

test()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
