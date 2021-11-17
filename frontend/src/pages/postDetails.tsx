import Empty from "components/empty";
import EncryptedPost from "components/encryptedPost";
import Post from "components/post";
import { IProfile } from "core/types";
import DB from "lib/db";
import { useJSON } from "lib/useJSON";
import { useEffect } from "react";
import { useState } from "react";
import { useParams } from "react-router-dom";

export default function PostDetails() {
  const { userId, postId } = useParams<{ userId: string, postId: string }>();

  const [profile] = useJSON<IProfile>(userId, "profile.json", { handle: "", avatarURL: "", worldKey: "" });

  const [replies, setReplies] = useState<any[]>([]);
  useEffect(() => {
    DB.posts.where({ replyToHash: postId }).toArray()
      .then((rs: any) => setReplies(rs));
  }, [postId])

  if (!(userId && postId)) {
    return null;
  }
  
  if (profile === "notfound") {
    return null;
  }

  const worldKeyHex = profile?.worldKey;

  return (
    <>
      <EncryptedPost
        enc={{ id: postId }}
        pubKey={userId}
        worldKeyHex={worldKeyHex}
        showEncHex
      />
      <div>
        <h2>Replies</h2>
        {
          replies.map(reply => {
            return <Post key={reply.hash} id={reply.hash} post={reply.post} pubKey={reply.publisherPubKey} />
          })
        }
        {
          replies.length < 1 && <Empty text="No replies." />
        }
      </div>
    </>
  )
}
