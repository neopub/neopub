import { useEffect, useState } from "react";
import { buf2hex } from "core/bytes";
import { key2buf, sha } from "core/crypto";
import DB from "lib/db";
import { IReply, ISubReq } from "core/types";
import { mutateState } from "models/state";
import { acceptFollower, fetchProfile } from "models/profile";

const tokenKey = "token";
const privKeyKey = "privKey";
const pubKeyKey = "pubKey";
const worldKeyKey = "worldKey";
const stateKeyKey = "stateKey";

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

export async function setStateKey(key: CryptoKey) {
  const buf = await key2buf(key);
  const hex = buf2hex(buf);
  localStorage[stateKeyKey] = hex;
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

export function getStateKey(): string | undefined {
  return localStorage[stateKeyKey];
}

export async function getSubscriberPubKeyList(): Promise<{ pubKey: string }[]> {
  return DB.followers.toArray();
}

export async function addSubscriptionPubKey(pubKey: string, host: string, worldKeyHex: string, handle?: string) {
  return DB.subscriptions.add({ pubKey, host, worldKeyHex, handle })
    .catch(() => {});
}

export async function addSubscriber(req: ISubReq) {
  const profile = await fetchProfile(req.pubKey, req.host);
  console.log(profile);
  if (!profile || profile === "notfound") {
    return; // TODO: handle error.
  }

  return mutateState(async () => {
    await acceptFollower(req.pubKey, profile);
    return DB.followers.put({
      pubKey: req.pubKey,
      host: req.host,
    });
  });
}

export function useSubscribers(): [any[] | undefined, () => void] {
  const [subs, setSubs] = useState<any[]>();

  function fetchSubs() {
    DB.profiles.filter((p: any) => p.followsMe).toArray()
      .then((subs: any[]) => { setSubs(subs) })
      .catch((err: any) => {
        console.error(err);
      });
  }

  useEffect(() => {
    fetchSubs();  
  }, []);

  return [subs, fetchSubs];
}

export function dumpState(): string | undefined {
  const { pubKey, privKey, worldKey, stateKey } = localStorage;
  try {
    const json = JSON.stringify(
      {
        pubKey: JSON.parse(pubKey),
        privKey: JSON.parse(privKey),
        worldKey,
        stateKey,
      }, null, 2
    );
    return json;
  } catch (e) {
    return undefined;
  }
}

export function loadCreds(stateJSON: string) {
  try {
    const state = JSON.parse(stateJSON);
    const { pubKey, privKey, worldKey, stateKey } = state;
    localStorage[pubKeyKey] = JSON.stringify(pubKey);
    localStorage[privKeyKey] = JSON.stringify(privKey);
    localStorage[worldKeyKey] = worldKey;
    localStorage[stateKeyKey] = stateKey;
  } catch {
  }
}

export async function recordReplyInDB(reply: IReply) {
  const buf = new TextEncoder().encode(reply.msg);
  const hash = await sha(buf);
  const hashHex = await buf2hex(hash);
  return DB.posts.put({
    hash: hashHex,
    replyToHash: reply.postId,
    publisherPubKey: reply.pubKey,
    post: {
      content: {
        text: reply.msg,
      },
      createdAt: new Date(reply.createdAt),
      type: "text",
    },
  });
}
