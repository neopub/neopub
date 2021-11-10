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
async function req(path: string, method: "GET" | "POST", headers: Record<string, string> = {}, data?: any): Promise<IResponse> {
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

async function get(path: string, headers: Record<string, string> = {}): Promise<IResponse> {
  return req(path, "GET", headers);
}

async function test() {
  const pubKeyHex = '043D333E9AE10134CD2E6E637AF0790B00956C6B6445587973B09FB6B306B80CB2B895AD609B34AAF1659516E7CB2A39DE11F3E902A35D97B5031B99FFEC5A8578';

  const authHeaders = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "neopub-pub-key": pubKeyHex,
  };

  const expectedChal = 'FDCB74BE707DFBCFBB4425F9C5E73C752BA94C54022F711253E2A4792E311EA00E';

  async function testAuth() {
    const { statusCode, statusMessage, data } = await post('/auth', null, authHeaders);
    const chal = new TextDecoder().decode(data);
    if (statusCode !== 200 || chal !== expectedChal) {
      throw new Error(`[${statusCode}] ${statusMessage}`);
    }
  }

  async function testAuthMissingPubKey() {
    const { statusCode, statusMessage } = await post('/auth', null, {});
    if (statusCode !== 400) {
      throw new Error(`[${statusCode}] ${statusMessage}`);
    }
  }

  const sigHex = '2EB5B6F2D55171F8DBA8D7D076372DB6A325989C005C008677755F94CEB26C59C9CE5D0A2003B9FF4FDE83828ACF33DD051487AB158D6A90FB241DE55FA52DD3';
  const solution = '000000000000000000000000000000000000000000000000000000000000C685';

  const expectedToken = 'B1966B5AF3F57E6EE67C7A65AB5E3137559F037F1A72B7C00BB9E2DC44E5E02D';

  const chalHeaders = {
    ...authHeaders,
    "neopub-sig": sigHex,
  }
  async function testChal() {
    const { statusCode, statusMessage, data } = await post('/chal', solution, chalHeaders);
    const token = new TextDecoder().decode(data);
    if (token !== expectedToken) {
      throw new Error(`[${statusCode}] ${statusMessage}`);
    }
  }

  const postEncHex = '42BE204370BEF228630163CEB3230DC6FBB1A818419F9E2BD30AC7F57CED6D07FDFDEFC910D9106E27A1906F9326ADB12DD53DAFDCA3AA8E1FA71BE92EE103B48D8AA8EBA591333A40C6454CCCFD0D5DABA879D93FDA82F7013437C0422865D535D2FCDB2A720563160B9CD4574F3E76';
  const postEnc = hex2bytes(postEncHex) as Uint8Array;
  const postSig = '67984C8C1FF906D772DFA4A4C97C58A44317E1EBBB84702E74848FAAEFFACF2AD10C80B2E168A645ADE8673DCB033A7FD1968B0B5587E24E5E49128757892E4D';

  const loc = `/users/043D333E9AE10134CD2E6E637AF0790B00956C6B6445587973B09FB6B306B80CB2B895AD609B34AAF1659516E7CB2A39DE11F3E902A35D97B5031B99FFEC5A8578/posts/6D47EBF93C1B1BFAA30A5FA3A8CE6BF868352ACF8DD2A999D1728918173D65C7`;
  const putHeaders = {
    ...authHeaders,
    "Content-Type": "application/octet-stream",
    'neopub-sig': postSig,
    'neopub-token': expectedToken,
    'neopub-location': loc,
  }

  async function testPut() {
    const { statusCode, statusMessage, data } = await post('/put', postEnc, putHeaders);
    if (statusCode !== 200) {
      throw new Error(`[${statusCode}] ${statusMessage}`);
    }
  }

  const getHeaders = {
    'neopub-location': loc,
  }
  async function testGet() {
    const { statusCode, statusMessage, data } = await get('/get', getHeaders);
    if (statusCode !== 200 || data.equals(postEnc) !== true) {
      throw new Error(`[${statusCode}] ${statusMessage}`);
    }
  }

  await fs.promises.rm(`public/users/${pubKeyHex}/inbox`, { recursive: true, force: true });

  const replyHex = "9AAB13B04EC37A8827F6517BA5E8ABD035C590D409543F94292E6CE29AE30BADFA382538AB3801EF3606458B9F736A87320393B5EB889B87365FBB1D955C5E170E082A5363BEE9E72DA574CF0DE03AC89972A9B20EB6FF358F8DCF7EAF3F2396B64CFF5BA51B984402C4A5826D1378C0A6B414CC06174CF79F5400E718EB4BFA7F59C5165BB4DA655FB8DCE14032C6D27BAABD3B896B0DA56F4D76711A23DC8F9346BBA199C08E3729158334785A940548D54D04FFE3768FEEDAE8F50744652D1DBAEDF833831CE2140EFDB2FF6337869D548F9389E6502A8A48CD7631F01462FDC50D51D5BDE5854EB730CFE7C011CB2FCC55AF85A74890CF5233D8DE258898";
  const replyIdHex = "04FEAC3B63980AE84CDDED68D2291535C4188269D355BDB9350A206A765FC825B204A57BD981AB6D62BE661F9FE4A8487B6A69913145D7B0B117CAA8E0F4497723";
  const inboxHeaders = {
    "neopub-pub-key": pubKeyHex,
    "neopub-sub-key": replyIdHex,
  };
  async function testInboxPost() {
    const reply = hex2bytes(replyHex) as Uint8Array;
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

    if (inbox.length !== 1 || inbox[0] !== replyIdHex) {
      throw new Error(`[${statusCode}] ${statusMessage}`);
    }
  }

  await testAuth();
  await testAuthMissingPubKey();
  await testChal();
  await testPut();
  await testGet();
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
