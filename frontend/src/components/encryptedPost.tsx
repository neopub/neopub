import { TPost, IEncPost } from "core/types";
import { useEffect, useState } from "react";
import Post from "components/post";
import { useID } from "models/id";
import { fetchAndDec } from "models/post";

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
  const ident = useID();

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
