import { fileLoc, getFileJSON } from "lib/net";
import { IProfile, NotFound } from "core/types";
import { useEffect, useState } from "react";
import { uploadProfile } from "./api";
import { loadID } from "models/id";

export function useJSON<T>(
  userId: string | undefined,
  filename: string,
  initial: T,
): [T | undefined | NotFound, (newData: T | NotFound) => void] {
  const [data, setData] = useState<T | NotFound>(initial);

  useEffect(() => {
    if (userId !== undefined) {
      const location = fileLoc(userId, filename);
      getFileJSON<T>(location)
        .then((d) => {
          if (d) {
            setData(d);
          }
        });
    }
  }, [userId, filename]);

  return [data, setData];
}

export function useProfile(userId?: string, host?: string): [IProfile | NotFound, (newProfile: IProfile) => void] {
  const defaultProfile: IProfile = { worldKey: "" };
  const [profile, setProfile] = useState<IProfile | NotFound>(defaultProfile);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const location = fileLoc(userId, "profile.json");
    getFileJSON<IProfile>(location, host)
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