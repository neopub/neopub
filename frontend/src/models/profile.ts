import { IProfile, NotFound } from "core/types";
import { uploadProfile } from "lib/api";
import { getPublicKeyHex } from "lib/auth";
import DB from "lib/db";
import { fileLoc, getFileJSON } from "lib/net";
import { useState, useEffect } from "react";
import { loadID } from "./id";

export function fetchProfile(userId: string, host?: string): Promise<IProfile | "notfound" | undefined> {
  const location = fileLoc(userId, "profile.json");
  return getFileJSON<IProfile>(location, host);
}

export function useProfile(userId?: string, host?: string): [IProfile | NotFound, (newProfile: IProfile) => void] {
  const defaultProfile: IProfile = { worldKey: "" };
  const [profile, setProfile] = useState<IProfile | NotFound>(defaultProfile);

  useEffect(() => {
    if (!userId) {
      return;
    }

    fetchProfile(userId, host)
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
