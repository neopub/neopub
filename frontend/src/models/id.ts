import { getPrivateKey, getPublicKey, getPublicKeyHex } from "lib/auth";
import { wipeDB } from "lib/db";
import EventBus from "lib/eventBus";
import { getToken, getWorldKey, loadCreds, setIDKeys, setStateKey, setToken, setWorldKey } from "lib/storage";
import * as Host from "models/host";
import { useEffect, useState, createContext } from "react";
import { fetchAndStoreOwnProfile } from "./profile";
import { fetchState } from "./state";

export interface ID {
  pubKey: {
    key: CryptoKey,
    hex: string,
  },
  privKey: {
    key: CryptoKey,
    dhKey: CryptoKey,
  },
  token: string,
  worldKey: {
    hex: string,
  }
}

export const IdentityContext = createContext<ID | null | undefined>(undefined);

export async function loadID(): Promise<ID | undefined> {
  const pubKey = await getPublicKey();
  const pubKeyHex = await getPublicKeyHex();
  const privKey = await getPrivateKey("ECDSA");
  const privDH = await getPrivateKey("ECDH");
  const token = getToken();
  const worldKeyHex = getWorldKey();

  if (!token || !pubKey || !pubKeyHex || !privKey || !privDH || !worldKeyHex) {
    return;
  }

  return {
    pubKey: {
      key: pubKey,
      hex: pubKeyHex,
    },
    privKey: {
      key: privKey,
      dhKey: privDH,
    },
    token,
    worldKey: {
      hex: worldKeyHex,
    },
  };
}

const idChange = new EventBus();

// undefined means loading; null means error
export function useID(): ID | undefined | null {
  const [id, setID] = useState<ID | null>();

  useEffect(() => {
    async function reloadID() {
      const id = await loadID();
      if (id) {
        setID(id);
      } else {
        setID(null);
      }
    }

    reloadID();

    idChange.on(reloadID);

    return () => {
      idChange.off(reloadID);
    }
  }, []);

  return id;
}

export async function identify(creds: string, setStatus: (status: string) => void): Promise<boolean | undefined> {
  setStatus("Loading creds...");
  loadCreds(creds);
  setStatus("Loaded creds.");

  await fetchState();
  
  // Fetch token.
  const pubKey = await getPublicKey();
  const privKey = await getPrivateKey("ECDSA");
  if (!pubKey || !privKey) {
    return true;
  }
  const token = await Host.getToken(pubKey, privKey, setStatus);

  if (token instanceof Error) {
    setStatus("Failed to get token.");
    return true;
  }
  setToken(token);
 
  await fetchAndStoreOwnProfile();

  idChange.emit();
}

export async function deidentify() {
  localStorage.clear();
  idChange.emit();
  await wipeDB();
}

export async function storeCredentials(idKeys: CryptoKeyPair, token: string, worldKey: CryptoKey, stateKey: CryptoKey) {
  setToken(token);
  await setIDKeys(idKeys);
  await setWorldKey(worldKey);
  await setStateKey(stateKey);
  idChange.emit();
}
