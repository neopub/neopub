import { TPost, IEncPost } from "core/types";
import { fetchAndDecryptWorldOrSubPost } from "lib/api";
import { usePrivateKey, usePublicKeyHex } from "lib/auth";
import { useEffect, useState } from "react";
import Post from "components/post";
import DB from "lib/db";
import { buf2hex } from "core/bytes";
import HexString from "./hexString";

export default function EncryptedPost({
  enc,
  pubKey,
  worldKeyHex,
  showEncHex,
}: {
  enc: IEncPost;
  pubKey: string;
  worldKeyHex?: string;
  showEncHex?: boolean;
}) {
  const privDH = usePrivateKey("ECDH");
  const selfPubKeyHex = usePublicKeyHex();

  const [post, setPost] = useState<TPost>();
  const [encBuf, setEncBuf] = useState<ArrayBuffer>();
  useEffect(() => {
    async function fetchAndDec() {
      const { id: postHashHex } = enc;

      const postRow = await DB.posts.get(postHashHex);
      if (postRow) {
        setPost(postRow.post);
        return;
      }

      const res = await fetchAndDecryptWorldOrSubPost(
        postHashHex,
        pubKey,
        privDH,
        worldKeyHex,
      );
      if (!res) {
        return;
      } 
      const { post, encBuf } = res;
      setEncBuf(encBuf);

      async function cachePost() {
        return DB.posts.add({
          post,
          hash: postHashHex,
          publisherPubKey: pubKey,
          createdAt: post?.createdAt,
        });
      }

      try {
        const isOwnPost = pubKey === selfPubKeyHex;
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

      setPost(post);
    }

    if (!selfPubKeyHex) {
      return;
    }

    fetchAndDec();
  }, [selfPubKeyHex, enc, pubKey, worldKeyHex, privDH]);

  const encHex = encBuf ? buf2hex(encBuf) : "";

  const postEl = <Post id={enc.id} post={post} pubKey={pubKey} />;

  if (showEncHex) {
    return (
      <div>
        {postEl}
        <HexString hex={encHex} />
      </div>
    );
  }

  return postEl;
}
