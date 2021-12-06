import { pubKeyHeader, tokenHeader, sigHeader, subDhKey, powHeader, ecdsaParams, NUM_SIG_BYTES } from "core/consts";
import { buf2hex, bytes2hex, hex2bytes } from "core/bytes";
import { IAuthChallenge, IIndex, IProfile, NotFound, CapabilityDescription } from "core/types";
import { hex2ECDSAKey } from "core/crypto";

export const hostPrefix = process.env.REACT_APP_HOST_PREFIX ?? "NOHOST";

export function fileLoc(pubKeyHex: string, path: string): string {
  return `/users/${pubKeyHex}/${path}`;
}

export async function fetchInboxItem(
  pubKeyHex: string,
  id: string,
): Promise<ArrayBuffer | undefined> {
  const location = fileLoc(pubKeyHex, `inbox/${id}`);
  return getFile(location);
}

export async function fetchSubReq(
  pubKeyHex: string,
  reqName: string,
): Promise<ArrayBuffer | undefined> {
  const location = fileLoc(pubKeyHex, `reqs/${reqName}`);
  return getFile(location);
}

export async function fetchPostKey(
  posterPubKeyHex: string,
  postKeyLocHex: string,
): Promise<ArrayBuffer | undefined> {
  const location = fileLoc(posterPubKeyHex, `keys/${postKeyLocHex}`);
  return getFile(location);
}

export async function getIndex(pubKeyHex: string, host?: string): Promise<IIndex | undefined | NotFound> {
  const location = fileLoc(pubKeyHex, "index.json");
  return getFileSignedJSON<IIndex>(pubKeyHex, location, host);
}

export async function getProfile(pubKeyHex: string, host?: string): Promise<IProfile | undefined | NotFound> {
  const location = fileLoc(pubKeyHex, "profile.json");
  return getFileSignedJSON<IProfile>(pubKeyHex, location, host);
}

export async function fetchPost(
  posterPubKeyHex: string,
  postHashHex: string,
): Promise<ArrayBuffer | undefined> {
  const location = fileLoc(posterPubKeyHex, `posts/${postHashHex}`);
  return getFile(location);
}

export async function getFile(location: string): Promise<ArrayBuffer | undefined> {
  try {
    const resp = await fetch(`${hostPrefix}${location}`, {
      method: "GET",
      headers: {
        Accept: "application/octet-stream",
      },
    });
    if (!resp.ok) {
      return;
    }
    const buf = resp.arrayBuffer();
    return buf
  } catch {
    return
  }
}

export async function deleteFile(pubKeyHex: string, token: string, location: string): Promise<Response> {
  return fetch(`${hostPrefix}${location}`, {
    method: "DELETE",
    headers: {
      Accept: "application/octet-stream",
      [pubKeyHeader]: pubKeyHex,
      [tokenHeader]: token,
    },
  });
}

export async function getFileSignedJSON<T>(signerPubKeyHex: string, location: string, host?: string): Promise<T | undefined | NotFound> {
  try {
    const resp = await fetch(`${host ?? hostPrefix}${location}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    if (resp.status === 404) {
      return "notfound";
    }
    if (!resp.ok) {
      return;
    }

    const buf = await resp.arrayBuffer();
    const sig = buf.slice(0, NUM_SIG_BYTES);

    // TODO: check.
    const signerPubKey = await hex2ECDSAKey(signerPubKeyHex);
    if (!signerPubKey) {
      return; // TODO: signal error.
    }

    const rest = buf.slice(NUM_SIG_BYTES);

    const valid = await crypto.subtle.verify(
      ecdsaParams,
      signerPubKey,
      sig,
      rest,
    );
    if (!valid) {
      return; // TODO blow up.
    }

    const json = new TextDecoder().decode(rest);
    const index = JSON.parse(json);

    return index;
  } catch (err) {
    console.error(err);
    return;
  }
}

export async function putFile(
  location: string,
  pubKeyHex: string,
  token: string,
  payload: ArrayBuffer,
  sig: ArrayBuffer,
  contentType: "application/json" | "application/octet-stream",
): Promise<void> {
  const sigHex = bytes2hex(new Uint8Array(sig));

  await fetch(`${hostPrefix}${location}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": contentType,
      [pubKeyHeader]: pubKeyHex,
      [tokenHeader]: token,
      [sigHeader]: sigHex,
    },
    body: payload,
  });
}

export async function fetchInbox(pubKey: string, token: string): Promise<string[]> {
  const resp = await fetch(`${hostPrefix}/inbox`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      [pubKeyHeader]: pubKey,
      [tokenHeader]: token,
    },
  });
  try {
    const inbox = await resp.json();
    return inbox;
  } catch {
    return []
  }
}

export async function putMessage(
  pubPubKeyHex: string,
  ephemDHPubBuf: ArrayBuffer,
  encMsgBuf: ArrayBuffer,
  powSolution: Uint8Array,
  host?: string,
): Promise<void> {
  const ephemDHPubBytes = new Uint8Array(ephemDHPubBuf);
  const ephemDHPubHex = bytes2hex(ephemDHPubBytes);

  const powHex = bytes2hex(powSolution);

  await fetch(`${host ?? hostPrefix}/inbox`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      [pubKeyHeader]: pubPubKeyHex,
      [subDhKey]: ephemDHPubHex,
      [powHeader]: powHex,
    },
    body: encMsgBuf,
  });
}

export async function putSubReq(
  pubPubKeyHex: string,
  ephemDHPubBuf: ArrayBuffer,
  encReqBuf: ArrayBuffer,
  host?: string,
): Promise<void> {
  const ephemDHPubBytes = new Uint8Array(ephemDHPubBuf);
  const ephemDHPubHex = bytes2hex(ephemDHPubBytes);

  await fetch(`${host ?? hostPrefix}/sub`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      [pubKeyHeader]: pubPubKeyHex,
      [subDhKey]: ephemDHPubHex,
    },
    body: encReqBuf,
  });
}

export async function fetchAuthChallenge(
  capDesc: CapabilityDescription,
  host?: string,
): Promise<IAuthChallenge> {
  const resp = await fetch(`${host ?? hostPrefix}/auth`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(capDesc),
  });
  const bytes = hex2bytes(await resp.text());
  if (!bytes) {
    throw new Error('failed to parse hex');
  }
  const diff = bytes[bytes.length - 1];
  const chal = bytes.slice(0, bytes.length - 1);

  return { chal, diff };
}

export async function fetchSessionToken(
  pubKey: ArrayBuffer,
  sig: ArrayBuffer,
  solution: Uint8Array,
): Promise<string> {
  const pubKeyHex = buf2hex(pubKey);
  const sigHex = bytes2hex(new Uint8Array(sig));

  const solutionHex = buf2hex(solution);

  const chalResp = await fetch(`${hostPrefix}/chal`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/octet-stream",
      [pubKeyHeader]: pubKeyHex,
      [sigHeader]: sigHex,
    },
    body: solutionHex,
  });
  return await chalResp.text();
}
