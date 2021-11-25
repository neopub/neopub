// State models client state that should sync with the host via an E2E-encrypted file.
// Excludes posts, because those already sync up to the host for distribution.

import * as Net from "lib/net";
import { hex2bytes } from "core/bytes";
import { importAESKey, encryptString, decryptString } from "core/crypto";
import { getPublicKeyHex } from "lib/auth";
import { dumpState, loadStateDangerously } from "lib/db";
import { putFile } from "lib/api";
import { getStateKey } from "lib/storage";
import { loadID } from "models/id";

async function putState(): Promise<void> {
  const state = await dumpState();

  const ident = await loadID();
  if (!ident) {
    return;
  }

  const pubKeyHex = ident.pubKey.hex;

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
  return putFile(pubKeyHex, "state.json", ident.privKey.key, ident.token, ciphertext, "application/json");
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

  // TODO: test this blows up if it fails to decrypt.

  const state = JSON.parse(plaintext);

  return loadStateDangerously(state);
}

export async function mutateState(mutateFn: () => Promise<void>) {
  // NOTE: race condition, here.
  // Use CRDTs to eliminate that?

  await fetchState();
  await mutateFn();
  await putState();
}