import { sha } from "core/crypto";
import { buf2hex } from "core/bytes";
import Post from "components/post";
import { IMessage, IReply, ISubReq } from "core/types";
import { unwrapInboxItem } from "lib/api";
import { usePrivateKey } from "lib/auth";
import DB from "lib/db";
import { useState, useEffect } from "react";
import Req from "./subscriptionRequest";

export default function InboxItem({ id, pubKeyHex }: { id: string, pubKeyHex: string }) {
  const privKey = usePrivateKey("ECDH");

  // TODO: do all this unwrapping in a data layer. Not UI.
  const [item, setItem] = useState<IMessage>();
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

  switch (item.type) {
    case "reply":
      const reply = item as IReply;
      const post = {
        content: {
          text: reply.msg,
        },
        createdAt: new Date(reply.createdAt),
        type: "text",
      };
      return <Post id={reply.postId} post={post as any} pubKey={reply.pubKey} />
    case "subscribe":
      const req = item as ISubReq;
      return <Req req={req} />;
  }
}