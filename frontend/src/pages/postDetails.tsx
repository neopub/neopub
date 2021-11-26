import Empty from "components/empty";
import EncryptedPost from "components/encryptedPost";
import HexIDCard from "components/hexIdCard";
import Post from "components/post";
import ReplyButton from "components/replyButton";
import Tabs, { ITab } from "components/tabs";
import DB from "lib/db";
import { useID } from "models/id";
import { deletePost, removeAccess, useAudience } from "models/post";
import { useProfile } from "models/profile";
import { useEffect } from "react";
import { useState } from "react";
import { useParams } from "react-router-dom";

function AudienceListItem({ pubKey, postHash }: { pubKey: string, postHash: string }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [profile, _] = useProfile(pubKey);
  if (profile === "notfound" || !profile) {
    return null;
  }

  function handleRemove() {
    removeAccess(postHash, pubKey);
  }

  return (
    <div>
      <HexIDCard key={pubKey} pubKey={pubKey} host={profile.host} handle={profile.handle} />
      <button onClick={handleRemove}>Remove access</button>
    </div>
  );
}

function Audience({ postHash, worldKeyHex }: { postHash: string, worldKeyHex?: string }) {
  const pubKeys = useAudience(postHash);

  // TODO: visualize all past visibility states, since someone might have cached a key.

  return (
    <div>
      {
        pubKeys.map((pubKey) => {
          const isWorld = pubKey === worldKeyHex;
          if (isWorld) {
            return <div>PUBLIC</div>;
          }

          return <AudienceListItem key={pubKey} pubKey={pubKey} postHash={postHash} />;
        })
      }
    </div>
  )
}

export default function PostDetails() {
  const { userId, postId } = useParams<{ userId: string, postId: string }>();
  const ident = useID();

  const [profile] = useProfile(userId);

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
  const post = { id: postId };

  const postHost = profile?.host;

  const isPoster = userId === ident?.pubKey.hex;

  function handleDelete() {
    deletePost(postId);
  }

  const tabs: ITab[] = [
    {
      name: "Replies",
      el: (
        <>
          {
            replies.map(reply => {
              return <Post key={reply.hash} id={reply.hash} post={reply.post} pubKey={reply.publisherPubKey} />
            })
          }
          {
            replies.length < 1 && <Empty text="No replies." />
          }
        </>
      ),
    },
  ];

  if (isPoster) {
    tabs.push({
      name: "Audience",
      el: <Audience postHash={postId} worldKeyHex={worldKeyHex} />,
    });
  }

  return (
    <div className="space-y-4">
      <EncryptedPost
        enc={post}
        pubKey={userId}
        worldKeyHex={worldKeyHex}
      />
      {postHost != null && <ReplyButton post={post} pubKeyHex={ident?.pubKey.hex} id={userId} host={postHost} />}
      {isPoster && <button onClick={handleDelete}>Delete Post</button>}
      <Tabs tabs={tabs} initialActiveTab="Replies" />
    </div>
  )
}
