import { hex2bytes } from "core/bytes";
import { hex2ECDHKey, deriveDHKey } from "core/crypto";
import { IEncPost, IIndex, ITextPost, PostVisibility, TPost } from "core/types";
import { fetchAndDecryptWorldOrSubPost, postKeyLocation, publishPostAndKeys } from "lib/api";
import DB from "lib/db";
import Net from "lib/net";
import { useEffect, useState } from "react";
import { ID, loadID } from "./id";

export type DBPost = any; // TODO.

export async function loadPosts(): Promise<DBPost[]> {
  return DB.posts.orderBy("createdAt").reverse().toArray();
}

async function fetchAndCachePost(pubKey: string, postHashHex: string, worldKeyHex: string, privDH: CryptoKey) {
  const res = await fetchAndDecryptWorldOrSubPost(
    postHashHex,
    pubKey,
    privDH,
    worldKeyHex,
  );
  if (!res) {
    return;
  } 
  const { post } = res;

  return DB.posts.put({
    post,
    hash: postHashHex,
    publisherPubKey: pubKey,
  });
}

export async function fetchPosts(privDH: CryptoKey) {
  const subs: { pubKey: string, host: string, worldKeyHex: string }[] = await DB.subscriptions.orderBy("pubKey").toArray();

  await Promise.all(subs.map(async (sub) => {
    const { pubKey, host, worldKeyHex } = sub;
    const index = await Net.getIndex(pubKey, host);
    if (index === "notfound" || !index) {
      return;
    }

    return Promise.all(index.posts.map(async (post) => {
      const postHash = (post as IEncPost).id;
      
      const local = await DB.posts.get(postHash);
      if (local) {
        return;
      }

      return fetchAndCachePost(pubKey, postHash, worldKeyHex, privDH);
    }));
  }));
};

export async function publishTextPost(id: ID, text: string, visibility: PostVisibility): Promise<IIndex> {
  const now = new Date();
  const post: ITextPost = {
    createdAt: now.toISOString(),
    type: "text",
    content: {
      text,
    },
  };
  
  const newIndex = await publishPostAndKeys(
    post,
    id.worldKey.hex,
    id.privKey.dhKey,
    id.pubKey.hex,
    id.privKey.key,
    id.token,
    visibility,
  );

  await DB.indexes.put({ pubKey: id.pubKey.hex, index: newIndex });

  return newIndex;
}

export async function fetchAndDec(ident: ID, enc: IEncPost, pubKey: string, worldKeyHex?: string): Promise<TPost | undefined> {
  const { id: postHashHex } = enc;

  const postRow = await DB.posts.get(postHashHex);
  if (postRow) {
    return postRow.post;
  }

  const res = await fetchAndDecryptWorldOrSubPost(
    postHashHex,
    pubKey,
    ident?.privKey.dhKey,
    worldKeyHex,
  );
  if (!res) {
    return;
  } 
  const { post } = res;
  // setEncBuf(encBuf);

  async function cachePost() {
    return DB.posts.put({
      post,
      hash: postHashHex,
      publisherPubKey: pubKey,
    });
  }

  try {
    const isOwnPost = pubKey === ident?.pubKey.hex;
    if (isOwnPost) {
      await cachePost();
    } else {
      // Cache post if subscribed to poster.
      const sub = await DB.subscriptions.get(pubKey);
      if (sub) {
        await cachePost();
      }
    }
  } catch (err) {
    console.log(err, postHashHex)
  }

  return post;
}

export function useAudience(postHash: string): string[] {
  const [pubKeys, setPubKeys] = useState<string[]>([]);

  useEffect(() => {
    DB.postKeys.where({ postHash }).toArray()
      .then((postKeys: any[]) => {
        const pubKeys = postKeys.map(({ subPubKey }) => subPubKey);
        setPubKeys(pubKeys);
      });
  }, [postHash]);

  return pubKeys;
}

export async function removeAccess(postHash: string, viewerPubKey: string) {
  const ident = await loadID();
  if (!ident) {
    // TODO: show error. Real TODO: rearchitect so ident must be present before calling this.
    return;
  }

  // TODO: manage the prefixing with pubkeyhex all on the server side. Client doesn't need to care about that.
  // const location = fileLoc(ident.pubKey.hex, `inbox/${id}`);
  // try {
  //   deleteFile(ident.pubKey.hex, ident.token, location);
  //   inboxChange.emit();
  // } catch (err) {
  //   // TODO: handle in UI code.
  //   alert("Failed to delete.");
  // }

  const subDHPub = await hex2ECDHKey(viewerPubKey);
  if (!subDHPub) {
    return;
  }

  const hashBuf = hex2bytes(postHash);
  if (!hashBuf) {
    return; // TODO.
  }

  const encDH = await deriveDHKey(subDHPub, ident.privKey.dhKey, ["encrypt", "decrypt"]);

  const keyLoc = await postKeyLocation(encDH, hashBuf);

  const location = Net.fileLoc(ident.pubKey.hex, `keys/${keyLoc}`);
  try {
    await Net.deleteFile(ident.pubKey.hex, ident.token, location);
  } catch (err) {
    // TODO: handle in UI code.
    alert("Failed to delete from host.");
  }

  await DB.postKeys.delete(keyLoc);
}

export async function deletePost(postHash: string) {
  const ident = await loadID();
  if (!ident) {
    // TODO: show error. Real TODO: rearchitect so ident must be present before calling this.
    return;
  }

  const location = Net.fileLoc(ident.pubKey.hex, `posts/${postHash}`);
  try {
    await Net.deleteFile(ident.pubKey.hex, ident.token, location);
  } catch (err) {
    // TODO: handle in UI code.
    alert("Failed to delete from host.");
  }

  await DB.posts.delete(postHash);

  // TODO: update index.

  // TODO: delete post keys too.
}