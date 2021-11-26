import { buf2hex } from "core/bytes";
import { sha } from "core/crypto";
import { IEncPost, IReply } from "core/types";
import DB from "lib/db";
import { recordReplyInDB } from "lib/storage";
import { useEffect, useState } from "react";
import { ID } from "./id";
import { sendMessage } from "./message";

export async function sendReply(
  postId: string,
  pubPubKeyHex: string,
  senderPubKeyHex: string,
  msg: string,
  host?: string,
): Promise<IReply> {
  const message: IReply = {
    type: "reply",
    pubKey: senderPubKeyHex,
    msg,
    postId,
    createdAt: new Date().toISOString(),
  };

  await sendMessage(pubPubKeyHex, message, host);
  await recordReplyInDB(message);

  return message;
}

export async function replyId(reply: IReply): Promise<string> {
  // TODO: compute hash to encompass full reply struct. Just hashing the msg field means every identical text message will collide.
  const buf = new TextEncoder().encode(reply.msg);
  const hash = await sha(buf);
  const hashHex = await buf2hex(hash);
  return hashHex;
}

export function useReplies(ident: ID | null | undefined): IEncPost[] | undefined {
  const [replies, setReplies] = useState<IEncPost[]>();

  useEffect(() => {
    if (!ident) {
      return;
    }

    DB.posts.where({ publisherPubKey: ident.pubKey.hex })
      .and((post: any) => post.replyToHash != null)
      .toArray()
      .then((posts: any[]) => {
        const repls = posts.map((post: any) => {
          return { id: post.hash };
        });
        setReplies(repls);
      })
      .catch((err: any) => console.error(err));
  }, [ident]);

  return replies;
}
