import { TPost, IEncPost } from "core/types";
import { fetchAndDecryptWorldOrSubPost } from "lib/api";
import { usePrivateKey } from "lib/auth";
import { useEffect, useState } from "react";
import Post from "components/post";
import DB from "lib/db";

export default function EncryptedPost({
  enc,
  pubKey,
  worldKeyHex,
}: {
  enc: IEncPost;
  pubKey: string;
  worldKeyHex?: string;
}) {
  const privDH = usePrivateKey("ECDH");

  const [post, setPost] = useState<TPost>();
  useEffect(() => {
    async function fetchAndDec() {
      const { id: postHashHex } = enc;

      const postRow = await DB.posts.get(postHashHex);
      if (postRow) {
        setPost(postRow.post);
        return;
      }

      const post = await fetchAndDecryptWorldOrSubPost(
        postHashHex,
        pubKey,
        privDH,
        worldKeyHex,
      );

      try {
        // Cache post iff subscribed to poster.
        const sub = await DB.subscriptions.get(pubKey);
        if (sub) {
          await DB.posts.add({
            post,
            hash: postHashHex,
            publisherPubKey: pubKey,
            createdAt: post?.createdAt,
         });
        }
      } catch (err) {
        console.log(err, postHashHex)
      }

      setPost(post);
    }

    fetchAndDec();
  }, [enc, pubKey, worldKeyHex, privDH]);

  return <Post post={post} pubKey={pubKey} />;
}
