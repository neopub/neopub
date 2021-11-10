import { sha } from "core/crypto";
import { buf2hex } from "core/bytes";
import Post from "components/post";
import { IReply } from "core/types";
import { unwrapInboxItem } from "lib/api";
import { usePrivateKey } from "lib/auth";
import DB from "lib/db";
import { useState, useEffect } from "react";

export default function InboxItem({ id, pubKeyHex }: { id: string, pubKeyHex: string }) {
  const privKey = usePrivateKey("ECDH");

  // TODO: do all this unwrapping in a data layer. Not UI.
  const [item, setItem] = useState<any>();
  useEffect(() => {
    if (!privKey) {
      return;
    }
    unwrapInboxItem(id, pubKeyHex, privKey)
      .then(async (item: IReply) => {
        const buf = new TextEncoder().encode(item.msg);
        const hash = await sha(buf);
        const hashHex = await buf2hex(hash);
        DB.posts.put({
          hash: hashHex,
          replyToHash: item.postId,
          publisherPubKey: item.pubKey,
          post: {
            content: {
              text: item.msg,
            },
            createdAt: new Date(item.createdAt),
            type: "text",
          },
        });

        setItem(item);
      })
      .catch(err => { console.log(err) });
  }, [id, privKey, pubKeyHex]);

  if (!item) {
    return null;
  }

  const post = {
    content: {
      text: item.msg,
    },
    createdAt: new Date(item.createdAt),
    type: "text",
  };
  return <Post id={item.postId} post={post as any} pubKey={item.pubKey} />
}
