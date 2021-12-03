import { buf2hex, concatArrayBuffers } from "core/bytes";
import { genIDKeyPair, genSymmetricKey, key2buf, sign } from "core/crypto";
import { IIndex, IProfile, ISubReq, NotFound } from "core/types";
import { getPublicKeyHex } from "lib/auth";
import DB from "lib/db";
import { fileLoc, getFileSignedJSON, hostPrefix } from "lib/net";
import { useState, useEffect } from "react";
import { loadID, storeCredentials } from "./id";
import { putFile } from "lib/api";
import { getToken } from "models/host";
import { mutateState } from "./state";

// TODO: standardize userId vs. pubKeyHex.
export function fetchProfile(userId: string, host?: string): Promise<IProfile | "notfound" | undefined> {
  const location = fileLoc(userId, "profile.json");
  return getFileSignedJSON<IProfile>(userId, location, host);
}

export function useIndex(id: string, host?: string): IIndex | "notfound" {
  const [index, setIndex] = useState<IIndex | "notfound">({ posts: [], updatedAt: "" });
  useEffect(() => {
    // TODO: manage potential local/remote index conflicts.
    async function load() {
      let updatedAt = "";

      // Must put an updatedAt timestamp on index, to know which should win.
      const row = await DB.indexes.get(id);
      if (row) {
        setIndex(row.index);
        updatedAt = row.index.updatedAt;
      }

      const location = fileLoc(id, "index.json");
      const remoteIndex = await getFileSignedJSON<IIndex>(id, location, host);
      if (remoteIndex && remoteIndex !== "notfound" && remoteIndex.updatedAt > updatedAt) {
        setIndex(remoteIndex);
      }
    }

    if (!id) {
      return;
    }

    load();
  }, [id, host]);

  return index;
}

async function loadProfile(userId: string): Promise<IProfile | undefined> {
  return DB.profiles.get(userId);
}

export function useProfile(userId?: string, host?: string): [IProfile | NotFound, (newProfile: IProfile) => void] {
  const defaultProfile: IProfile = { worldKey: "" };
  const [profile, setProfile] = useState<IProfile | NotFound>(defaultProfile);

  useEffect(() => {
    if (!userId) {
      return;
    }

    async function get(userId: string, host?: string): Promise<IProfile | undefined | "notfound"> {
      const local = await loadProfile(userId);
      if (local) {
        return local;
      }

      const remote = await fetchProfile(userId, host);
      return remote;
    }

    get(userId, host)
      .then((p) => {
        if (p) {
          setProfile(p);
        }
      });
  }, [userId, host]);

  async function updateProfile(newProfile: IProfile): Promise<void> {
    if (!userId) {
      return;
    }

    setProfile(newProfile);

    await storeProfile(userId, newProfile);
    console.log(newProfile);

    const ident = await loadID();
    if (!ident) {
      return;
    }

    return uploadProfile(ident.pubKey.key, ident.privKey.key, ident.token, newProfile);
  }

  return [profile, updateProfile];
}

export async function storeProfile(pubKeyHex: string, profile: IProfile, following: boolean = false, followsMe: boolean = false) {
  return DB.profiles.put({
    pubKey: pubKeyHex,
    host: profile.host,
    worldKey: profile.worldKey, // TODO: standardize all these Hex suffixes.
    handle: profile.handle,
    bio: profile.bio,
    following,
    followsMe,
  })
}

export async function fetchAndStoreOwnProfile() {
  const pubKeyHex = await getPublicKeyHex();
  if (pubKeyHex) {
    const profile = await fetchProfile(pubKeyHex);
    if (profile && profile !== "notfound") {
      storeProfile(pubKeyHex, profile);
    }
  }
}

export async function uploadProfile(pubKey: CryptoKey, privKey: CryptoKey, token: string, profile: IProfile) {
  const pubKeyBuf = await key2buf(pubKey);
  const pubKeyHex = buf2hex(pubKeyBuf);

  const payload = new TextEncoder().encode(JSON.stringify(profile));
  const sig = await sign(privKey, payload);
  const signed = concatArrayBuffers(sig, payload);

  return putFile(pubKeyHex, "profile.json", privKey, token, signed, "application/json");
}

export async function createProfile(setStatus: (status: string) => void) {
  const idKeys = await genIDKeyPair();
  const stateKey = await genSymmetricKey();

  const token = await getToken(idKeys.publicKey, idKeys.privateKey, setStatus);
  if (!token) {
    return; // TODO: handle these intermediate errors.
  }

  const worldKey = await genSymmetricKey();

  await storeCredentials(idKeys, token, worldKey, stateKey);

  const pubKeyHex = await getPublicKeyHex();
  if (!pubKeyHex) {
    return;
  }

  // Create profile.
  const worldKeyBuf = await key2buf(worldKey);
  const worldKeyHex = buf2hex(worldKeyBuf);
  const profile = { worldKey: worldKeyHex, host: hostPrefix };

  return Promise.all([
    storeProfile(pubKeyHex, profile),
    uploadProfile(idKeys.publicKey, idKeys.privateKey, token, profile),
  ]);
}

export function useIsSubscribedTo(pubKeyHex: string): boolean {
  const [isSubscribed, setIsSubscribed] = useState(false);
  useEffect(() => {
    if (!pubKeyHex) {
      return;
    }

    DB.subscriptions.get(pubKeyHex).then((sub: any) => {
      setIsSubscribed(sub != null);
    });
  }, [pubKeyHex])

  return isSubscribed;
}

export async function follow(pubKeyHex: string, profile: IProfile) {
  return DB.profiles.put({
    pubKey: pubKeyHex,
    host: profile.host,
    worldKey: profile.worldKey, // TODO: standardize all these Hex suffixes.
    handle: profile.handle,
    bio: profile.handle,
    following: true,
    followsMe: false, // TODO: handle case of overwrite. Maybe using separate table to track follower/following.
  });
}

export async function acceptFollower(pubKeyHex: string, profile: IProfile) {
  return DB.profiles.put({
    pubKey: pubKeyHex,
    host: profile.host,
    worldKey: profile.worldKey, // TODO: standardize all these Hex suffixes.
    handle: profile.handle,
    bio: profile.handle,
    following: false, // TODO: handle case of overwrite. Maybe using separate table to track follower/following.
    followsMe: true,
  });
}

export async function addSubscriber(req: ISubReq) {
  const profile = await fetchProfile(req.pubKey, req.host);

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
