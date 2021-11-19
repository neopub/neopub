import { IEncPost } from "core/types";
import { sendReply } from "lib/api";
import { useState } from "react";
import { useHistory } from "react-router-dom";

export default function ReplyButton({ post, pubKeyHex, id, host }: { post: IEncPost; id: string; worldKeyHex?: string; pubKeyHex?: string; host: string; }) {
  const history = useHistory();
  const [replyState, setReplyState] = useState<"sending" | "sent">();

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
    text = "Reply sent.";
  }

  return <button className="border-0 mt-2 mb-0" onClick={() => handleReply(post.id)} disabled={replyState !== undefined}>{text}</button>;
}
