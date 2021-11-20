import { IIndex, IEncPost } from "core/types";
import Empty from "./empty";
import EncryptedPost from "./encryptedPost";
import ReplyButton from "./replyButton";

export default function PostList({ pubKeyHex, index, id, worldKeyHex, host }: { index: IIndex, id: string, worldKeyHex?: string, pubKeyHex?: string, host: string }) {
  if (index.posts?.length === 0) {
    return <Empty text="No posts" subtext="Write a post and it will show up here." />;
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
