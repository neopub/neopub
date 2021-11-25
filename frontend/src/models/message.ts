import { concatArrayBuffers } from "core/bytes";
import solvePoWChallenge from "core/challenge";
import { ecdsaParams, NUM_SIG_BYTES } from "core/consts";
import { hex2ECDHKey, deriveDHKey, hex2ECDSAKey, pubECDSA2ECDH, genECDHKeys, key2buf, sign, encryptBuf, decryptBuf } from "core/crypto";
import { IMessage } from "core/types";
import { getMessageAuthChallenge } from "lib/api";
import { fetchInboxItem, putMessage } from "lib/net";
import { loadID } from "./id";

export async function unwrapInboxItem(
  id: string,
  pubKeyHex: string,
  privKey: CryptoKey,
): Promise<IMessage | undefined> {
  const ephemDHPub = await hex2ECDHKey(id);
  if (!ephemDHPub) {
    return;
  }

  const ephemDH = await deriveDHKey(ephemDHPub, privKey, ["decrypt"]);

  const enc = await fetchInboxItem(pubKeyHex, id);
  if (!enc) {
    return;
  }
  const decBuf = await decryptBuf(enc, ephemDH);
  const sig = decBuf.slice(0, NUM_SIG_BYTES);
  const rest = decBuf.slice(NUM_SIG_BYTES);

  const json = new TextDecoder().decode(rest);
  const msg = JSON.parse(json) as IMessage;

  const signerPubKeyHex = msg.pubKey;
  const signerPubKey = await hex2ECDSAKey(signerPubKeyHex);
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
  const userPubKey = await hex2ECDSAKey(destPubKeyHex);
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
  const sig = await sign(ident.privKey.key, msgBuf);
  const signed = concatArrayBuffers(sig, msgBuf);

  const pubECDH = await pubECDSA2ECDH(userPubKey);

  // Gen ephem keypair for outer DH.
  const ephemKeys = await genECDHKeys();
  const ephemDH = await deriveDHKey(pubECDH, ephemKeys.privateKey, ["encrypt"]);

  // Encrypt request.
  const encReqBuf = await encryptBuf(signed, ephemDH);

  // Get PoW challenge and solve it.
  const { chal, diff } =  await getMessageAuthChallenge(encReqBuf, host);
  const solution = await solvePoWChallenge(chal, diff);
  if (!solution) {
    // TODO: signal failure.
    return;
  }

  const ephemDHPubBuf = await key2buf(ephemKeys.publicKey);
  return putMessage(destPubKeyHex, ephemDHPubBuf, encReqBuf, solution, host);
}
