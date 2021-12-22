import { concatArrayBuffers } from "core/bytes";
import solvePoWChallenge from "core/challenge";
import { ecdsaParams, NUM_SIG_BYTES } from "core/consts";
import Crypto from "lib/crypto";
import { IMessage } from "core/types";
import { getMessageAuthChallenge } from "lib/api";
import Net from "lib/net";
import { loadID } from "./id";

export async function unwrapInboxItem(
  id: string,
  pubKeyHex: string,
  privKey: CryptoKey,
): Promise<IMessage | undefined> {
  const ephemDHPub = await Crypto.hex2ECDHKey(id);
  if (!ephemDHPub) {
    return;
  }

  const ephemDH = await Crypto.deriveDHKey(ephemDHPub, privKey, ["decrypt"]);

  const enc = await Net.fetchInboxItem(pubKeyHex, id);
  if (!enc) {
    return;
  }
  const decBuf = await Crypto.decryptBuf(enc, ephemDH);
  const sig = decBuf.slice(0, NUM_SIG_BYTES);
  const rest = decBuf.slice(NUM_SIG_BYTES);

  const json = new TextDecoder().decode(rest);
  const msg = JSON.parse(json) as IMessage;

  const signerPubKeyHex = msg.pubKey;
  const signerPubKey = await Crypto.hex2ECDSAKey(signerPubKeyHex);
  if (!signerPubKey) {
    return; // TODO: signal error.
  }

  const valid = await crypto.subtle.verify(
    ecdsaParams,
    signerPubKey,
    sig,
    rest,
  );
  if (!valid) {
    return; // TODO blow up.
  }

  return msg;
}

export async function sendMessage(
  destPubKeyHex: string,
  message: IMessage,
  host?: string,
): Promise<void> {
  const userPubKey = await Crypto.hex2ECDSAKey(destPubKeyHex);
  if (!userPubKey) {
    return;
  }

  const ident = await loadID();
  if (!ident) {
    // TODO: blow up. Switch all these to exceptions.
    return;
  } 

  // Sign message.
  const msgJson = JSON.stringify(message);
  const msgBuf =  new TextEncoder().encode(msgJson);
  const sig = await Crypto.sign(ident.privKey.key, msgBuf);
  const signed = concatArrayBuffers(sig, msgBuf);

  const pubECDH = await Crypto.pubECDSA2ECDH(userPubKey);

  // Gen ephem keypair for outer DH.
  const ephemKeys = await Crypto.genECDHKeys();
  const ephemDH = await Crypto.deriveDHKey(pubECDH, ephemKeys.privateKey, ["encrypt"]);

  // Encrypt request.
  const encReqBuf = await Crypto.encryptBuf(signed, ephemDH);

  // Get PoW challenge and solve it.
  const { chal, diff } =  await getMessageAuthChallenge(encReqBuf, host);
  const solution = await solvePoWChallenge(chal, diff);
  if (!solution) {
    // TODO: signal failure.
    return;
  }

  const ephemDHPubBuf = await Crypto.key2buf(ephemKeys.publicKey);
  return Net.putMessage(destPubKeyHex, ephemDHPubBuf, encReqBuf, solution, host);
}
