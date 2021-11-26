import { IEncPost, IReply } from "core/types";
import { replyId, sendReply } from "models/reply";
import { useEffect } from "react";
import { useState } from "react";
import { Link, useHistory } from "react-router-dom";

function ViewReplyButton({ reply }: { reply: IReply }) {
  const [id, setId] = useState<string>();
  useEffect(() => {
    replyId(reply).then((hex) => {
      setId(hex);
    });
  }, [reply]);

  if (!id) {
    return null;
  }

  return <Link to={`/posts/${reply.pubKey}/${id}`}>View reply</Link>;
}

export default function ReplyButton({ post, pubKeyHex, id, host }: { post: IEncPost; id: string; worldKeyHex?: string; pubKeyHex?: string; host: string; }) {
  const history = useHistory();
  const [replyState, setReplyState] = useState<"sending" | "sent">();
  const [sentReply, setSentReply] = useState<IReply>();

  async function handleReply(postId: string) {
    if (!pubKeyHex) {
      alert('You need an identity first.');
      history.push(`/?next=${encodeURIComponent(history.location.pathname)}`);
      return;
    }

    const reply = prompt("Reply");
    if (!reply) {
      return;
    }

    try {
      setReplyState("sending");

      const replyMsg = await sendReply(postId, id, pubKeyHex, reply, host);
      
      setReplyState("sent");
      setSentReply(replyMsg);
    } catch (err) {
      alert("Failed to send reply.");
      setReplyState(undefined);
    }
  }

  let text = "Reply";
  if (replyState === "sending") {
    text = "Sending...";
  } else if (replyState === "sent") {
    text = "Reply sent.";
  }

  return (
    <button className="border-0 mt-2 mb-0 flex flex-row space-x-2" onClick={() => handleReply(post.id)} disabled={replyState !== undefined}>
      <span>{text}</span>
      {sentReply && <ViewReplyButton reply={sentReply} />}
    </button>
  );
}
