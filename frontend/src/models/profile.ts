import { buf2hex } from "core/bytes";
import { genIDKeyPair, genSymmetricKey, key2buf } from "core/crypto";
import { IProfile, NotFound } from "core/types";
import { getPublicKeyHex, storeCredentials } from "lib/auth";
import DB from "lib/db";
import { fileLoc, getFileJSON, hostPrefix } from "lib/net";
import { useState, useEffect } from "react";
import { loadID } from "./id";
import { putFile } from "lib/api";
import { getToken } from "models/host";

// TODO: standardize userId vs. pubKeyHex.
export function fetchProfile(userId: string, host?: string): Promise<IProfile | "notfound" | undefined> {
  const location = fileLoc(userId, "profile.json");
  return getFileJSON<IProfile>(location, host);
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
    worldKeyHex: profile.worldKey, // TODO: standardize all these Hex suffixes.
    handle: profile.handle,
    bio: profile.handle,
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

  return putFile(pubKeyHex, "profile.json", privKey, token, payload, "application/json");
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
