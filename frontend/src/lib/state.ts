import * as Net from "lib/net";
import { buf2hex, hex2bytes } from "core/bytes";
import { key2buf, importAESKey, encryptString, decryptString } from "core/crypto";
import { getPrivateKey, getPublicKey, getPublicKeyHex } from "./auth";
import { dumpState, loadStateDangerously } from "./db";
import { putFile } from "./api";
import { getToken, getStateKey } from "./storage";

export async function putState(): Promise<void> {
  const state = await dumpState();

  const privKey = await getPrivateKey("ECDSA");
  const pubKey = await getPublicKey();
  const token = getToken();
  if (!privKey || !pubKey || !token) {
    return;
  }

  const pubKeyBuf = await key2buf(pubKey);
  const pubKeyHex = buf2hex(pubKeyBuf);

  const plaintext = JSON.stringify(state);

  const stateKeyHex = getStateKey();
  if (!stateKeyHex) {
    return;
  }
  const stateKeyBytes = hex2bytes(stateKeyHex);
  if (!stateKeyBytes) {
    return;
  }
  const stateKey = await importAESKey(stateKeyBytes, ["encrypt"]);

  const ciphertext = await encryptString(plaintext, stateKey);

  // Obscure filename?
  return putFile(pubKeyHex, "state.json", privKey, token, ciphertext, "application/json");
}

export async function fetchState(): Promise<void> {
  const pubKeyHex = await getPublicKeyHex();
  if (!pubKeyHex) {
    return;
  }

  const loc = Net.fileLoc(pubKeyHex, "state.json");
  const ciphertext = await Net.getFile(loc);
  if (!ciphertext) {
    return;
  }

  const stateKeyHex = getStateKey();
  if (!stateKeyHex) {
    return;
  }
  const stateKeyBytes = hex2bytes(stateKeyHex);
  if (!stateKeyBytes) {
    return;
  }
  const stateKey = await importAESKey(stateKeyBytes, ["decrypt"]);

  const plaintext = await decryptString(ciphertext, stateKey);

  const state = JSON.parse(plaintext);

  return loadStateDangerously(state);
}