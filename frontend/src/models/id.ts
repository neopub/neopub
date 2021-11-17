import { getPrivateKey, getPublicKey, getPublicKeyHex } from "lib/auth";
import { getToken, getWorldKey } from "lib/storage";
import { useEffect, useState } from "react";

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

export function useID(): ID | undefined {
  const [id, setID] = useState<ID>();

  useEffect(() => {
    loadID().then(setID);
  }, []);

  return id;
}
