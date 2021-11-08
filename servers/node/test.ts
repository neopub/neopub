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
    const { statusCode, statusMessage, data } = await post('/get', null, getHeaders);
    if (statusCode !== 200 || data.equals(postEnc) !== true) {
      throw new Error(`[${statusCode}] ${statusMessage}`);
    }
  }

  await fs.promises.rm(`public/users/${pubKeyHex}/reqs`, { recursive: true, force: true });

  const subPubKeyHex = '043D333E9AE10134CD2E6E637AF0790B00956C6B6445587973B09FB6B306B80CB2B895AD609B34AAF1659516E7CB2A39DE11F3E902A35D97B5031B99FFEC5A8578';
  const reqHex = '60EC674AFA21B6B7905658ACD94A242C90B5F0857D4A67E5AD8998BCA4D2C81A014BA10A1F0590217804014B95122B22622B17B83FC6EDC6FAC5E081FD102CCF73139A4810C84CF71B5BB73074CF46747C72BB672CDB0E9EB4068F67A11A92AD3E42F4E50931C1BAD97D6720A2FF874C17FAD893B47F0B8533FE2891766AAD94F99F4AA49C8A113F57A6E99F6BF1E029596F4FDA20009B6A6B055223D250E2F637915C07747349E73AD6955D2F3679E3';
  const req = hex2bytes(reqHex) as Uint8Array;

  const subHeaders = {
    'neopub-pub-key': subPubKeyHex,
    'neopub-sub-key': pubKeyHex,
  };

  async function testSub() {
    const { statusCode, statusMessage, data } = await post('/sub', req, subHeaders);
    if (statusCode !== 200) {
      throw new Error(`[${statusCode}] ${statusMessage}`);
    }
  }

  const reqsHeaders = {
    ...authHeaders,
    'neopub-token': expectedToken,
  }
  async function testReqs() {
    const { statusCode, statusMessage, data } = await post('/reqs', null, reqsHeaders);
    const reqs = JSON.parse(new TextDecoder().decode(data));
    if (statusCode !== 200 || reqs.length !== 1 || reqs[0] !== subPubKeyHex) {
      throw new Error(`[${statusCode}] ${statusMessage}`);
    }
  }

  await fs.promises.rm(`public/users/${pubKeyHex}/inbox`, { recursive: true, force: true });

  const replyHex = "A8FDC58B05B8CDA246ABED2F752D12DA0E8292305F4BFC04C131F4882080A594177C5D37E71AC8D5054CF54FA6877FD88778E521AFF00C016DBDCFE1586A6FC2755D025C89E1471AD9077C88A4EA7CF1CAA1C83509F5F1DC48E71B9CCC418A85816C2EF4B18320D60E5932FD85BC776BFE4F658A4A688D11DA83109622ACB929D808C46DAE44DF485A0D09AAE2611316E954C4D844D5AACC14A7AE810EF45ACD248DD6BAE9417EFA3398940ED98AD85B9645C16E050B9193E532B9DA9AFCB96F979580006F9D7993AF3308D4B654E2272E9203B87D117255E723C1D7AB982BC820B683A731FC1DFD82B7D3054A1300E7D8C5DD4E5DB0BB3ABFD940D8E7AEB0DB";
  const replyIdHex = "492E079D452244C8ACE0EFB0CFA7B1DDAB0EC05EF25AEAFDDCD0D9EA9F3B3D15";
  const inboxHeaders = {
    "neopub-pub-key": pubKeyHex,
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
  await testSub();
  await testReqs();
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
