import { TPost, IEncPost } from "core/types";
import { useContext, useEffect, useState } from "react";
import Post from "components/post";
import { IdentityContext } from "models/id";
import { fetchAndDec } from "models/post";

export default function EncryptedPost({
  enc,
  pubKey,
  worldKeyHex,
}: {
  enc: IEncPost;
  pubKey: string;
  worldKeyHex?: string;
}) {
  const ident = useContext(IdentityContext);

  const [post, setPost] = useState<TPost>();
  useEffect(() => {
    if (!ident) {
      return;
    }

    fetchAndDec(ident, enc, pubKey, worldKeyHex)
      .then(post => setPost(post));
  }, [enc, pubKey, worldKeyHex, ident]);

  return <Post id={enc.id} post={post} pubKey={pubKey} />;
}
