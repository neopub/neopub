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

async function test() {
  function testAuth() {
    return new Promise<void>((resolve, reject) => {
      const pubKey = new Uint8Array([1, 3, 3, 7]);

      const opts = {
        hostname: host,
        port,
        path: '/auth',
        method: 'POST',
        headers: {
          Accept: "application/octet-stream",
          "Content-Type": "application/octet-stream",
        },
      };

      const req = http.request(opts, res => {
        res.on("data", d => {
          console.log(d.length);
        });
        res.on("close", () => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject();
          }
        })
      });

      req.write(pubKey);

      req.end();
    });
  }

  function testAuthMissingPubKey() {
    return new Promise<void>((resolve, reject) => {
      const opts = {
        hostname: host,
        port,
        path: '/auth',
        method: 'POST',
        headers: {
          Accept: "application/octet-stream",
          "Content-Type": "application/octet-stream",
        },
      };

      const req = http.request(opts, res => {
        res.on("data", () => {});
        res.on("close", () => {
          if (res.statusCode === 400) {
            resolve();
          } else {
            reject();
          }
        })
      });

      req.end();
    });
  }

  await testAuth();
  await testAuthMissingPubKey();

  console.log("Done");
}

test()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
