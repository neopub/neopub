import { buf2hex } from "core/bytes";
import { sha } from "core/crypto";
import { IReply } from "core/types";
import { recordReplyInDB } from "lib/storage";
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
