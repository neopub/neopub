import Lib from "./shared/lib";
import * as crypto from "crypto";
import Server from "./server";

const { SESS_TOKEN_SEED, POW_SEED } = process.env;
if (!SESS_TOKEN_SEED || !POW_SEED) {
  console.log("Missing env var(s)");
  process.exit(1);
}

const lib = new Lib(crypto.webcrypto, SESS_TOKEN_SEED, POW_SEED);

const port = 8888;
const host = 'localhost';
const server = new Server(host, port, lib);

server.run();
