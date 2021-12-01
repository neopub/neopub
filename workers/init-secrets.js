const crypto = require("crypto");
const { execSync } = require("child_process");


function buf2hex(buf) {
  const hex = Array.from(buf).map((b) => {
    const h = b.toString(16).toUpperCase();
    if (h.length < 2) {
      return `0${h}`;
    }
    return h;
  });
  return hex.join('');
}

const numSeedBytes = 32;

function updateSecrets() {
  const powSeedBuf = crypto.webcrypto.getRandomValues(new Uint8Array(numSeedBytes));
  const powSeedHex = buf2hex(powSeedBuf);
  
  const sessTokenSeedBuf = crypto.webcrypto.getRandomValues(new Uint8Array(numSeedBytes));
  const sessTokenSeedHex = buf2hex(sessTokenSeedBuf);
  
  const cwd = __dirname;
  console.log(execSync(`echo ${powSeedHex} | wrangler secret put POW_SEED`, { cwd }).toString());
  console.log(execSync(`echo ${sessTokenSeedHex} | wrangler secret put SESS_TOKEN_SEED`, { cwd }).toString());
}

updateSecrets();
