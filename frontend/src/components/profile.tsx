 import type { IProfile, IIndex, IEncPost } from "core/types";
import { useJSON } from "lib/useJSON";
import { usePublicKeyHex } from "lib/auth";
import Hexatar from "./hexatar";
import { Link } from "react-router-dom";
import EncryptedPost from "./encryptedPost";
import { useEffect, useState } from "react";
import DB from "lib/db";
import { fileLoc, getFileJSON, hostPrefix } from "lib/net";
import HexQR from "./hexQR";

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
              <EncryptedPost
                key={i}
                enc={p as IEncPost}
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
  const { hex: pubKeyHex } = usePublicKeyHex();
  const isAuthedUser = id === pubKeyHex;

  const [profile] = useJSON<IProfile>(id, "profile.json", { handle: "", avatarURL: "", worldKey: "" });

  const [index, setIndex] = useState<IIndex | "notfound">({ posts: [], updatedAt: "" });
  useEffect(() => {
    // TODO: manage potential local/remote index conflicts.
    async function load() {
      let updatedAt = "";

      // Must put an updatedAt timestamp on index, to know which should win.
      const row = await DB.indexes.get(id);
      if (row) {
        setIndex(row.index);
        updatedAt = row.updatedAt;
      }

      const location = fileLoc(id, "index.json");
      const remoteIndex = await getFileJSON<IIndex>(location);
      if (remoteIndex && remoteIndex !== "notfound" && remoteIndex.updatedAt > updatedAt) {
        setIndex(remoteIndex);
      }
    }

    if (!id) {
      return;
    }

    load();
  }, [id]);

  // const [index] = useJSON<IIndex>(id, "index.json", { posts: [] });

  const [isSubscribed, setIsSubscribed] = useState(false);
  useEffect(() => {
    if (!id) {
      return;
    }

    DB.subscriptions.get(id).then((sub: any) => {
      setIsSubscribed(sub != null);
    });
  }, [id])

  if (profile === "notfound") {
    return <div>Not found.</div>
  }

  const worldKeyHex = profile?.worldKey;

  const host = escape(hostPrefix);

  return (
    <main>
      <h1 className="mb-8">profile</h1>

      <div className="flex mb-8">
        <a href={`/users/${id}?host=${host}`}><HexQR hex={`https://${document.location.host}/users/${id}?host=${host}`} /></a>
      </div>

      <div className="flex flex-row space-x-1 mb-4">
        <Hexatar hex={id} />
        {isAuthedUser && <Link to="/creds/dump">Creds</Link>}
        {!isAuthedUser && (isSubscribed ? <Link to={`/subs`}>Subscribed</Link> : <Link to={`/users/${id}/sub`}>Subscribe</Link>)}
      </div>


      <div>
        <h2 className="mb-3">Posts</h2>
        {isAuthedUser && <div className="mb-4"><Link to="/post">New Post</Link></div>}
        {index === "notfound" || !index ? <div>No posts</div> : <PostList id={id} worldKeyHex={worldKeyHex} index={index} />}
      </div>
    </main>
  );
}
