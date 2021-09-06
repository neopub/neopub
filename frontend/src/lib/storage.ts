import { useEffect, useState } from "react";
import { buf2hex } from "core/bytes";
import { key2buf } from "core/crypto";

const tokenKey = "token";
const privKeyKey = "privKey";
const pubKeyKey = "pubKey";
const subListKey = "subs";
const worldKeyKey = "worldKey";

export function setToken(token: string) {
  localStorage[tokenKey] = token;
}

export async function setIDKeys(idKeys: CryptoKeyPair) {
  const pubJWK = await crypto.subtle.exportKey("jwk", idKeys.publicKey);

  // const pubBuf = await crypto.subtle.exportKey("spki", idKeys.publicKey);
  // const pubStr = new TextDecoder().decode(new Uint8Array(pubBuf));
  // debugger;
  // const pubB64 = btoa(pubStr);
  // console.log("pub", pubStr, pubB64);

  // const privBuf = await crypto.subtle.exportKey("pkcs8", idKeys.privateKey);
  // const privStr = new TextDecoder().decode(privBuf);
  // const privB64 = btoa(privStr);
  // console.log("priv", privStr, privB64);
  
  const privJWK = await crypto.subtle.exportKey("jwk", idKeys.privateKey);
  localStorage[pubKeyKey] = JSON.stringify(pubJWK);
  localStorage[privKeyKey] = JSON.stringify(privJWK);
}

export async function setWorldKey(key: CryptoKey) {
  const buf = await key2buf(key);
  const hex = buf2hex(buf);
  localStorage[worldKeyKey] = hex;
}

export function getPrivateKeyJWK(): string | undefined {
  return localStorage[privKeyKey];
}

export function getPublicKeyJWK(): string | undefined {
  return localStorage[pubKeyKey];
}

export function getWorldKey(): string | undefined {
  return localStorage[worldKeyKey];
}

function useLocalStorage(key: string): string | undefined {
  const [val, setVal] = useState<string>();

  useEffect(() => {
    const val = localStorage.getItem(key);
    if (val != null) {
      setVal(val);
    }
  }, [key]);

  return val;
}

export const useToken = () => useLocalStorage(tokenKey);
export const useWorldKey = () => useLocalStorage(worldKeyKey);

export function getSubscriberPubKeyList(): Record<string, boolean> {
  const subs = JSON.parse(localStorage[subListKey] ?? "{}") as Record<string, boolean>;
  return subs;
}

function setSubscriberPubKeyList(subs: Record<string, boolean>) {
  localStorage[subListKey] = JSON.stringify(subs);
}

export function addSubscriberPubKey(subPubKey: string) {
  const subs = getSubscriberPubKeyList();
  subs[subPubKey] = true;
  setSubscriberPubKeyList(subs);
}

export function useSubscribers(): [Record<string, boolean> | undefined, () => void] {
  const [subs, setSubs] = useState<Record<string, boolean>>();

  function fetchSubs() {
    setSubs(getSubscriberPubKeyList());
  }

  useEffect(() => {
    fetchSubs();  
  }, []);

  return [subs, fetchSubs];
}

export function dumpState(): string | undefined {
  const { pubKey, privKey, worldKey } = localStorage;
  try {
    const json = JSON.stringify(
      {
        pubKey: JSON.parse(pubKey),
        privKey: JSON.parse(privKey),
        worldKey,
      }, null, 2
    );
    return json;
  } catch (e) {
    return undefined;
  }
}

export function loadState(stateJSON: string) {
  try {
    const state = JSON.parse(stateJSON);
    const { pubKey, privKey, subs, worldKey } = state;
    localStorage[pubKeyKey] = JSON.stringify(pubKey);
    localStorage[privKeyKey] = JSON.stringify(privKey);
    localStorage[worldKeyKey] = worldKey
  } catch {
  }
}
