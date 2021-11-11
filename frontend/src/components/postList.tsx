import { IIndex, IEncPost } from "core/types";
import { sendReply } from "lib/api";
import { useHistory } from "react-router-dom";
import EncryptedPost from "./encryptedPost";

export default function PostList({ pubKeyHex, index, id, worldKeyHex, host }: { index: IIndex, id: string, worldKeyHex?: string, pubKeyHex?: string, host: string }) {
  const history = useHistory();
  
  if (index.posts?.length === 0) {
    return <div className="mt-2">No posts.</div>;
  }

  function handleReply(postId: string, pubKey: string) {
    if (!pubKeyHex) {
      alert('You need an identity first.')
      history.push(`/?next=${encodeURIComponent(history.location.pathname)}`);
      return;
    }

    const reply = prompt("Reply");
    if (!reply) {
      return;
    }

    sendReply(postId, id, pubKeyHex, reply, host);
  }

  const showReply = id !== pubKeyHex;

  return (
    <>
      {
        index.posts?.map(
          (p, i) =>
            id && (
              <div key={i} className="flex flex-row items-start space-x-8">
                <EncryptedPost
                  key={i}
                  enc={p as IEncPost}
                  pubKey={id}
                  worldKeyHex={worldKeyHex}
                />
                {showReply && <button onClick={() => handleReply((p as IEncPost).id, id)}>Reply</button>}
              </div>
            ),
        )
      }
    </>
  );
}
