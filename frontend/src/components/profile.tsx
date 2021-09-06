 import type { IProfile, IIndex } from "core/types";
import MaybeEncryptedPost from "components/maybeEncryptedPost";
import { useJSON } from "lib/useJSON";
import { usePublicKeyHex } from "lib/auth";
import HexString from "components/hexString";
import Hexatar from "./hexatar";
import { Link } from "react-router-dom";

function PostList({ index, id, worldKeyHex }: { index: IIndex, id: string, worldKeyHex?: string }) {
  if (index.posts?.length === 0) {
    return <div className="mt-4">No posts.</div>;
  }

  return (
    <>
      {
        index.posts?.map(
          (p, i) =>
            id && (
              <MaybeEncryptedPost
                key={i}
                post={p}
                pubKey={id}
                worldKeyHex={worldKeyHex}
              />
            ),
        )
      }
    </>
  );
}
interface IProps {
  id: string;
}
export default function Profile({ id }: IProps) {
  const pubKeyHex = usePublicKeyHex();
  const isAuthedUser = id === pubKeyHex;

  const [profile] = useJSON<IProfile>(id, "profile.json", { handle: "", avatarURL: "", worldKey: "" });
  const [index] = useJSON<IIndex>(id, "index.json", { posts: [] });

  if (profile === "notfound") {
    return <div>Not found.</div>
  }

  const worldKeyHex = profile?.worldKey;

  return (
    <main>
      <h1 className="mb-8">profile</h1>

      <div className="flex flex-row space-x-1 mb-4">
        <Hexatar hex={id} />
        <HexString hex={<a href={`/users/${id}`}>{id ?? ""}</a>} />
      </div>

      {!isAuthedUser && <Link to={`/users/${id}/sub`}>Subscribe</Link>}

      {isAuthedUser && <Link to="/post">New Post</Link>}

      <div>
        <h2 className="mb-3">Posts</h2>
        {index === "notfound" || !index ? <div>No posts</div> : <PostList id={id} worldKeyHex={worldKeyHex} index={index} />}
      </div>
    </main>
  );
}
