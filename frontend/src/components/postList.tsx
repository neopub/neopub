import { IIndex, IEncPost } from "core/types";
import { sendReply } from "lib/api";
import { useState } from "react";
import { useHistory } from "react-router-dom";
import EncryptedPost from "./encryptedPost";

function ReplyButton({ post, pubKeyHex, id, host }: { post: IEncPost, id: string, worldKeyHex?: string, pubKeyHex?: string, host: string }) {
  const history = useHistory();
  const [replyState, setReplyState] = useState<"sending" | "sent">();

  async function handleReply(postId: string, pubKey: string) {
    if (!pubKeyHex) {
      alert('You need an identity first.')
      history.push(`/?next=${encodeURIComponent(history.location.pathname)}`);
      return;
    }

    const reply = prompt("Reply");
    if (!reply) {
      return;
    }

    try {
      setReplyState("sending");
      await sendReply(postId, id, pubKeyHex, reply, host);
      setReplyState("sent");
    } catch (err) {
      alert("Failed to send reply.");
      setReplyState(undefined);
    }
  }

  let text = "Reply";
  if (replyState === "sending") {
    text = "Sending...";
  } else if (replyState === "sent") {
    text = "Reply sent."
  }

  return <button className="border-0 mt-2 mb-0" onClick={() => handleReply(post.id, id)} disabled={replyState !== undefined}>{text}</button>;
}

export default function PostList({ pubKeyHex, index, id, worldKeyHex, host }: { index: IIndex, id: string, worldKeyHex?: string, pubKeyHex?: string, host: string }) {
  if (index.posts?.length === 0) {
    return <div className="mt-2">No posts.</div>;
  }

  const showReply = id !== pubKeyHex;

  return (
    <div className="divide-green-800 divide-y">
      {
        index.posts?.map(
          (p, i) =>
            id && (
              <div key={i} className="flex flex-col pt-3 pb-2">
                <EncryptedPost
                  key={i}
                  enc={p as IEncPost}
                  pubKey={id}
                  worldKeyHex={worldKeyHex}
                />
                {showReply && <ReplyButton post={p as IEncPost} pubKeyHex={pubKeyHex} id={id} host={host} />}
                
              </div>
            ),
        )
      }
    </div>
  );
}
