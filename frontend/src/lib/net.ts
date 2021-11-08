import { locationHeader, pubKeyHeader, tokenHeader, sigHeader, subDhKey } from "core/consts";
import { buf2hex, bytes2hex, hex2bytes } from "core/bytes";
import { IAuthChallenge, IIndex, IProfile, NotFound } from "core/types";

export const hostPrefix = process.env.REACT_APP_HOST_PREFIX ?? "NOHOST";

export function fileLoc(pubKeyHex: string, path: string): string {
  return `/users/${pubKeyHex}/${path}`;
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
  return getFileJSON<IIndex>(location, host);
}

export async function getProfile(pubKeyHex: string, host?: string): Promise<IProfile | undefined | NotFound> {
  const location = fileLoc(pubKeyHex, "profile.json");
  return getFileJSON<IProfile>(location, host);
}

export async function fetchPost(
  posterPubKeyHex: string,
  postHashHex: string,
): Promise<ArrayBuffer | undefined> {
  const location = fileLoc(posterPubKeyHex, `posts/${postHashHex}`);
  return getFile(location);
}

async function getFile(location: string): Promise<ArrayBuffer | undefined> {
  try {
    const resp = await fetch(`${hostPrefix}/get`, {
      method: "GET",
      headers: {
        Accept: "application/octet-stream",
        [locationHeader]: location,
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

export async function getFileJSON<T>(location: string, host?: string): Promise<T | undefined | NotFound> {
  try {
    const resp = await fetch(`${host ?? hostPrefix}/get`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        [locationHeader]: location,
      },
    });
    if (resp.status === 404) {
      return "notfound";
    }
    if (!resp.ok) {
      return;
    }
    const json = await resp.json();
    return json;
  } catch {
    debugger;
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

  await fetch(`${hostPrefix}/put`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": contentType,
      [locationHeader]: location,
      [pubKeyHeader]: pubKeyHex,
      [tokenHeader]: token,
      [sigHeader]: sigHex,
    },
    body: payload,
  });
}

export async function fetchReqs(pubKey: string, token: string): Promise<any> {
  const resp = await fetch(`${hostPrefix}/reqs`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      [pubKeyHeader]: pubKey,
      [tokenHeader]: token,
    },
  });
  try {
    const reqs = await resp.json();
    return reqs;
  } catch {
    return []
  }
}

export async function putReply(
  pubPubKeyHex: string,
  ephemDHPubBuf: ArrayBuffer,
  encReqBuf: ArrayBuffer,
  host?: string,
): Promise<void> {
  const ephemDHPubBytes = new Uint8Array(ephemDHPubBuf);
  const ephemDHPubHex = bytes2hex(ephemDHPubBytes);

  await fetch(`${host ?? hostPrefix}/inbox`, {
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
  pubKeyBuf: ArrayBuffer,
): Promise<IAuthChallenge> {
  const pubKeyHex = buf2hex(pubKeyBuf);

  const resp = await fetch(`${hostPrefix}/auth`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      [pubKeyHeader]: pubKeyHex,
    },
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
