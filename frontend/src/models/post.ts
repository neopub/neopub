import { IEncPost, IIndex, ITextPost, PostVisibility } from "core/types";
import { fetchAndDecryptWorldOrSubPost, publishPostAndKeys } from "lib/api";
import DB from "lib/db";
import { getIndex } from "lib/net";
import { ID } from "./id";

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
    createdAt: post?.createdAt,
  });
}

export async function fetchPosts(privDH: CryptoKey) {
  const subs: { pubKey: string, host: string, worldKeyHex: string }[] = await DB.subscriptions.orderBy("pubKey").toArray();

  await Promise.all(subs.map(async (sub) => {
    const { pubKey, host, worldKeyHex } = sub;
    const index = await getIndex(pubKey, host);
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