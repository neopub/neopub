import { useEffect, useState } from "react";
import { buf2hex } from "core/bytes";
import { key2buf } from "core/crypto";
import DB from "lib/db";
import { ISubReq } from "core/types";

const tokenKey = "token";
const privKeyKey = "privKey";
const pubKeyKey = "pubKey";
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

export function getToken(): string | undefined {
  return localStorage[tokenKey];
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

function useLocalStorage(key: string): { val: string | null, loading: boolean } {
  const [state, setState] = useState<{ val: string | null, loading: boolean }>({ val: null, loading: true });

  useEffect(() => {
    const val = localStorage.getItem(key);
    setState({ val, loading: false });
  }, [key]);

  return state;
}

export function useToken() {
  const { val: token, loading } = useLocalStorage(tokenKey);
  return { token, loading };
}

export function useWorldKey() {
  const { val: worldKeyHex, loading } = useLocalStorage(worldKeyKey);
  return { worldKeyHex, loading };
}

export async function getSubscriberPubKeyList(): Promise<{ pubKey: string }[]> {
  return DB.followers.toArray();
}

export function addSubscriptionPubKey(pubKey: string, host: string, worldKeyHex: string, handle?: string) {
  DB.subscriptions.add({ pubKey, host, worldKeyHex, handle })
    .catch(() => {});
}

export async function addSubscriber(req: ISubReq) {
  DB.followers.put({
    pubKey: req.pubKey,
    host: req.host,
  });
}

export function useSubscribers(): [string[] | undefined, () => void] {
  const [subs, setSubs] = useState<string[]>();

  function fetchSubs() {
    getSubscriberPubKeyList()
      .then((subs) => {
        setSubs(subs.map(s => s.pubKey));
      })
      .catch(err => {
        console.error(err);
      });
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
    const { pubKey, privKey, worldKey } = state;
    localStorage[pubKeyKey] = JSON.stringify(pubKey);
    localStorage[privKeyKey] = JSON.stringify(privKey);
    localStorage[worldKeyKey] = worldKey
  } catch {
  }
}
