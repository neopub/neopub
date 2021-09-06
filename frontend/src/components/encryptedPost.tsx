import { TPost, IEncPost } from "core/types";
import { fetchAndDecryptWorldOrSubPost } from "lib/api";
import { usePrivateKey } from "lib/auth";
import { useEffect, useState } from "react";
import Post from "components/post";

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
      const { id } = enc;
      const post = await fetchAndDecryptWorldOrSubPost(
        id,
        pubKey,
        privDH,
        worldKeyHex,
      );
      setPost(post);
    }

    fetchAndDec();
  }, [enc, pubKey, worldKeyHex, privDH]);

  return <Post post={post} pubKey={pubKey} />;
}
