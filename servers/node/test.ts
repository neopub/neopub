import Lib from "./shared/lib";
import * as crypto from "crypto";
import Server from "./server";
import http from "http";
import { hex2bytes } from "./shared/core/bytes";
import fs from 'fs';

const sessTokenSeed = "abc";
const powSeed = "123";
const lib = new Lib(crypto.webcrypto, sessTokenSeed, powSeed);

const port = Math.floor((Math.random() * (65535 - 1024)) + 1024)
const host = 'localhost';
const server = new Server(host, port, lib);

server.run();

interface IResponse {
  statusCode?: number;
  statusMessage?: string;
  data: any;
}
async function req(path: string, method: "GET" | "POST" | "PUT", headers: Record<string, string> = {}, data?: any): Promise<IResponse> {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: host,
      port,
      path,
      method,
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
          statusMessage: res.statusMessage,
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

async function post(path: string, data: any, headers: Record<string, string> = {}): Promise<IResponse> {
  return req(path, "POST", headers, data);
}

async function put(path: string, data: any, headers: Record<string, string> = {}): Promise<IResponse> {
  return req(path, "PUT", headers, data);
}

async function get(path: string, headers: Record<string, string> = {}): Promise<IResponse> {
  return req(path, "GET", headers);
}

async function test() {
  const pubKeyHex = "0497520E3CD5FB316B259308CB4A8B1D519C4CC6E2B5885743095036E4ADED949D7ABD83533C94BFEC8F90067678A9D6B7F17AD441F0CD547ACE01BA92EF4D4D97";

  const authHeaders = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const expectedChal = '742AE55E0C86D52692C4B15FE27E917E8ABAFDA807A490B46D4C77E1065A30610E';

  async function testAuthUser() {
    const capDesc = JSON.stringify({
      type: "user",
      pubKey: pubKeyHex,
    });

    const { statusCode, statusMessage, data } = await post('/auth', capDesc, authHeaders);
    const chal = new TextDecoder().decode(data);
    if (statusCode !== 200 || chal !== expectedChal) {
      throw new Error(`[${statusCode}] ${statusMessage}`);
    }
  }

  async function testAuthUserMissingPubKey() {
    const { statusCode, statusMessage } = await post('/auth', null, {});
    if (statusCode !== 400) {
      throw new Error(`[${statusCode}] ${statusMessage}`);
    }
  }

  const sigHex = '826604FE9418C64BCFBF05D6753E0D2B3D63496F8BFB410B029A096ABD23E5456C083B606529AA9CF7ABEB84E87194D0ED320E1AB7A15C725EF3B4AEDF9E60B5';
  const solution = '00000000000000000000000000000000000000000000000000000000000007F3';

  const expectedToken = '1FA58BD95F14243226F9F04105F8BBA39976FC4A6E9D41797F5681164804CB09';

  const chalHeaders = {
    "neopub-pub-key": pubKeyHex,
    "neopub-sig": sigHex,
  }
  async function testChal() {
    const { statusCode, statusMessage, data } = await post('/chal', solution, chalHeaders);
    const token = new TextDecoder().decode(data);
    if (token !== expectedToken) {
      throw new Error(`[${statusCode}] ${statusMessage}`);
    }
  }

  const postEncHex = '21F57BB19F9B080BE7904CCE078B91D4A1E93A48F13793AC291EC860888C7E4989393D947CA1F7D8224FD0B1BEB80744C2EB6B61F1299D06E026F12403BC78ED7E78195CE0C0B4CE2F4DB76A0F78FEEF6940B06B876B248D88D4C1238B8D920DF055919489CBE51DC115539D39F8563E';
  const postEnc = hex2bytes(postEncHex) as Uint8Array;
  const postSig = 'C67A37DF6CB4B1096604B294434A9270AA84A81800E206513AB2BF6E12D190AB87CF974E621708ECE08F1C7CE2AB0241FEA2194862D7541029ECB022CC2B1272';

  const loc = `/users/0497520E3CD5FB316B259308CB4A8B1D519C4CC6E2B5885743095036E4ADED949D7ABD83533C94BFEC8F90067678A9D6B7F17AD441F0CD547ACE01BA92EF4D4D97/posts/A63C60091C325DE36CC47B520B00DF30ADFCBA5C26A69C80532FCBB63FE0588C`;
  const putHeaders = {
    "Content-Type": "application/octet-stream",
    "neopub-pub-key": pubKeyHex,
    'neopub-sig': postSig,
    'neopub-token': expectedToken,
  }

  async function testPut() {
    const { statusCode, statusMessage, data } = await put(loc, postEnc, putHeaders);
    if (statusCode !== 200) {
      throw new Error(`[${statusCode}] ${statusMessage}`);
    }
  }

  async function testGet() {
    const { statusCode, statusMessage, data } = await get(loc);
    if (statusCode !== 200 || data.equals(postEnc) !== true) {
      throw new Error(`[${statusCode}] ${statusMessage}`);
    }
  }

  async function testInboxPostPreflight() {
    const capDesc = JSON.stringify({
      type: "message",
      hash: "448B1AC6096D02F9278FBB7D1ABD7A7867CACB3E5E98643A22ABA8E73DFA9893",
      numBytes: 304,
    });

    const { statusCode, statusMessage, data } = await post('/auth', capDesc, authHeaders);
    if (statusCode !== 200) {
      throw new Error(`[${statusCode}] ${statusMessage}`);
    }
  }

  await fs.promises.rm(`public/users/${pubKeyHex}/inbox`, { recursive: true, force: true });

  const msgHex = "BF378BB4C4F8D87685B624DB2133C8C855A52EEA3FEF7C63636184338DB537035157458E0B69568D63B26FD0B066F0DB4D1DE99B916A934F539F49A6562C48693378A7EEB449165853703E5A17E134A666C673B3867E62EA00AD668AF3D2C0B17920AD54B6313DAFC383A797E36E3289B5ABCF60D3DB15230DA271078BBEFE4DE3DE6B5B09629154C632B56826799B3235A8033E4FF7B11CE9BFACBA7B2ECE6F054EAEDF34390966240C0F7DEC9739ED0C174204FC954AB513A401217F6B9F923E31D62ED39816677B28E55EF05625BF349A33819B4F0B849973320E447820165D379DBA305AE59E971784E9A355BA6280D9E4F4798C4E9D66BDB321BE644D8BC39F5AD0FB8E2EA3D5A76D593CC3A53C96395103C8534B75F1CDF0309812CD9D9D7C7A8C2D60E2B1B2F234EF581AC559";
  const msgIdHex = "049767B429BECDEE15F3773825E8ED5718A66BAABAF90610D53DB1CEAEAB1B57DA5D8C1904EC40AFF33DAAA1444AFA2C8CD34D6658D9562594639B56046F2BBE81";
  const inboxHeaders = {
    "neopub-pub-key": pubKeyHex,
    "neopub-sub-key": msgIdHex,
    "neopub-pow": "000000000000000000000000000000000000000000000000000000000000A5A6",
  };
  async function testInboxPost() {
    const reply = hex2bytes(msgHex) as Uint8Array;
    const { statusCode, statusMessage } = await post('/inbox', reply, inboxHeaders);
    if (statusCode !== 200) {
      throw new Error(`[${statusCode}] ${statusMessage}`);
    }
  }

  async function testInboxGet() {
    const headers = {
      ...inboxHeaders,
      'neopub-token': expectedToken,
    }
    const { statusCode, statusMessage, data } = await get('/inbox', headers);
    if (statusCode !== 200) {
      throw new Error(`[${statusCode}] ${statusMessage}`);
    }

    const inbox = JSON.parse(new TextDecoder().decode(data));

    if (inbox.length !== 1 || inbox[0] !== msgIdHex) {
      throw new Error(`[${statusCode}] ${statusMessage}`);
    }
  }

  await testAuthUser();
  await testAuthUserMissingPubKey();
  await testChal();
  await testPut();
  await testGet();
  await testInboxPostPreflight();
  await testInboxPost();
  await testInboxGet();
}

console.log("Running tests...");

test()
  .then(() => {
    console.log("Done");
    process.exit(0);
  })
  .catch((err) => {
    console.log(err);
    process.exit(1)
  });
