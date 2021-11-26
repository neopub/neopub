import { IEncPost, TPost } from "core/types";
import EncryptedPost from "./encryptedPost";
import ReplyButton from "./replyButton";

export default function PostList({ pubKeyHex, posts, id, worldKeyHex, host, empty }: { posts: (TPost | IEncPost)[], id: string, worldKeyHex?: string, pubKeyHex?: string, host: string, empty: React.ReactElement }) {
  if (posts.length === 0) {
    return empty;
  }

  const showReply = id !== pubKeyHex;

  return (
    <div className="divide-green-800 divide-y">
      {
        posts.map(
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
